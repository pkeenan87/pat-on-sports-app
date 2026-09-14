/** Speeds offered by the site player — keep in sync. */
export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export const SKIP_SECONDS = 15;

/** Format seconds as m:ss (or h:mm:ss when ≥ 1 hour). */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = hours > 0 ? String(mins).padStart(2, "0") : String(mins);
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatRemaining(remainingSeconds: number): string {
  const clamped = Math.max(0, Math.floor(remainingSeconds));
  return `${formatDuration(clamped)} left`;
}

export function nextPlaybackSpeed(current: PlaybackSpeed): PlaybackSpeed {
  const index = PLAYBACK_SPEEDS.indexOf(current);
  return PLAYBACK_SPEEDS[(index + 1) % PLAYBACK_SPEEDS.length];
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
