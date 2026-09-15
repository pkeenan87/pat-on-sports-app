import AsyncStorage from "@react-native-async-storage/async-storage";

const POSITIONS_KEY = "audio-positions-v1";
const LAST_PLAYED_KEY = "audio-last-played-v1";

/** Persist position every this many seconds of wall-clock playback. */
export const POSITION_SAVE_INTERVAL_SEC = 10;

/** Treat as finished when within this many seconds of the end. */
export const FINISHED_THRESHOLD_SEC = 2;

export type PositionMap = Record<string, number>;

async function readPositions(): Promise<PositionMap> {
  const raw = await AsyncStorage.getItem(POSITIONS_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: PositionMap = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        out[slug] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

async function writePositions(map: PositionMap): Promise<void> {
  await AsyncStorage.setItem(POSITIONS_KEY, JSON.stringify(map));
}

export async function getPosition(slug: string): Promise<number | null> {
  const map = await readPositions();
  const value = map[slug];
  return value == null ? null : value;
}

export async function getAllPositions(): Promise<PositionMap> {
  return readPositions();
}

export async function savePosition(slug: string, seconds: number): Promise<void> {
  if (!slug || !Number.isFinite(seconds) || seconds < 0) return;
  const map = await readPositions();
  map[slug] = seconds;
  await writePositions(map);
}

export async function clearPosition(slug: string): Promise<void> {
  const map = await readPositions();
  if (!(slug in map)) return;
  delete map[slug];
  await writePositions(map);
}

export async function setLastPlayedSlug(slug: string): Promise<void> {
  await AsyncStorage.setItem(LAST_PLAYED_KEY, slug);
}

export async function getLastPlayedSlug(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_PLAYED_KEY);
}

export async function clearLastPlayedSlug(): Promise<void> {
  await AsyncStorage.removeItem(LAST_PLAYED_KEY);
}

/**
 * True when a saved position exists and the track is not finished.
 */
export function hasResumePosition(
  positionSeconds: number | null | undefined,
  durationSeconds: number | null | undefined
): boolean {
  if (positionSeconds == null || positionSeconds <= 0) return false;
  if (durationSeconds == null || durationSeconds <= 0) return true;
  return positionSeconds < durationSeconds - FINISHED_THRESHOLD_SEC;
}

/**
 * Decide whether the periodic saver should write on this tick.
 * `lastSavedAt` is the playback time (seconds) when we last persisted.
 */
export function shouldSavePeriodicPosition(
  currentTime: number,
  lastSavedAt: number | null
): boolean {
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  if (lastSavedAt == null) return currentTime >= POSITION_SAVE_INTERVAL_SEC;
  return currentTime - lastSavedAt >= POSITION_SAVE_INTERVAL_SEC;
}
