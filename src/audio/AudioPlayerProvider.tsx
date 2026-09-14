import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { resolvePlaybackUri } from "@/src/lib/audioDownload";
import {
  nextPlaybackSpeed,
  PLAYBACK_SPEEDS,
  SKIP_SECONDS,
  type PlaybackSpeed,
} from "@/src/lib/audioFormat";
import {
  clearPosition,
  getPosition,
  savePosition,
  setLastPlayedSlug,
  shouldSavePeriodicPosition,
} from "@/src/lib/audioPosition";

export type AudioTrack = {
  slug: string;
  title: string;
  heroImage: string | null;
  audioUrl: string;
  durationSeconds: number | null;
};

export type LoadAndPlayOptions = {
  /** Applied after the track loads (and after any resume seek). */
  afterLoadSkipSeconds?: number;
};

type AudioPlayerContextValue = {
  track: AudioTrack | null;
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: PlaybackSpeed;
  progress: number;
  loadAndPlay: (
    track: AudioTrack,
    options?: LoadAndPlayOptions
  ) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  play: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipBackward: () => Promise<void>;
  skipForward: () => Promise<void>;
  cycleSpeed: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

function invalidateAudioQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["audio", "positions"] });
  void queryClient.invalidateQueries({ queryKey: ["audio", "continue"] });
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const lastSavedAtRef = useRef<number | null>(null);
  const finishingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  /** Resume position to apply once the replaced source reports loaded. */
  const pendingResumeRef = useRef<number | null>(null);
  /** Optional skip after load (article ±15 before a track is active). */
  const pendingSkipRef = useRef<number | null>(null);
  /** True while waiting for isLoaded after loadAndPlay. */
  const pendingStartRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  const persistPosition = useCallback(
    async (slug: string, seconds: number) => {
      await savePosition(slug, seconds);
      lastSavedAtRef.current = seconds;
      invalidateAudioQueries(queryClient);
    },
    [queryClient]
  );

  const activateLockScreen = useCallback(
    (next: AudioTrack) => {
      player.setActiveForLockScreen(true, {
        title: next.title,
        artist: "Pat on Sports",
        artworkUrl: next.heroImage ?? undefined,
      });
    },
    [player]
  );

  const loadAndPlay = useCallback(
    async (next: AudioTrack, options?: LoadAndPlayOptions) => {
      finishingRef.current = false;
      const uri = await resolvePlaybackUri(next.slug, next.audioUrl);
      const resumeAt = await getPosition(next.slug);

      pendingResumeRef.current =
        resumeAt != null && resumeAt > 0 ? resumeAt : null;
      pendingSkipRef.current =
        options?.afterLoadSkipSeconds != null
          ? options.afterLoadSkipSeconds
          : null;
      pendingStartRef.current = true;
      lastSavedAtRef.current = pendingResumeRef.current ?? 0;

      player.replace({ uri });
      setTrack(next);
      await setLastPlayedSlug(next.slug);
      activateLockScreen(next);
      player.setPlaybackRate(playbackSpeed);
      // Seek + play happen in the isLoaded effect below.
    },
    [activateLockScreen, playbackSpeed, player]
  );

  // Apply resume / post-load skip only after the new source is ready.
  useEffect(() => {
    if (!track || !status.isLoaded || !pendingStartRef.current) return;

    pendingStartRef.current = false;
    const resumeAt = pendingResumeRef.current;
    pendingResumeRef.current = null;
    const skipDelta = pendingSkipRef.current;
    pendingSkipRef.current = null;

    void (async () => {
      let position = 0;
      if (resumeAt != null) {
        await player.seekTo(resumeAt);
        position = resumeAt;
        lastSavedAtRef.current = resumeAt;
      }

      if (skipDelta != null) {
        const duration = status.duration || track.durationSeconds || 0;
        const base = resumeAt ?? status.currentTime ?? 0;
        const next = Math.max(
          0,
          Math.min(duration > 0 ? duration : base + skipDelta, base + skipDelta)
        );
        await player.seekTo(next);
        position = next;
        lastSavedAtRef.current = next;
      }

      if (resumeAt != null || skipDelta != null) {
        // Keep storage aligned with where playback actually starts.
        await persistPosition(track.slug, position);
      }

      player.play();
    })();
  }, [
    persistPosition,
    player,
    status.currentTime,
    status.duration,
    status.isLoaded,
    track,
  ]);

  const pause = useCallback(async () => {
    player.pause();
    if (track) {
      await persistPosition(track.slug, player.currentTime);
    }
  }, [persistPosition, player, track]);

  const play = useCallback(async () => {
    if (!track) return;
    activateLockScreen(track);
    player.play();
  }, [activateLockScreen, player, track]);

  const togglePlayPause = useCallback(async () => {
    if (!track) return;
    if (status.playing) {
      await pause();
    } else {
      await play();
    }
  }, [pause, play, status.playing, track]);

  const seekTo = useCallback(
    async (seconds: number) => {
      const duration = status.duration || track?.durationSeconds || 0;
      const clamped = Math.max(0, Math.min(duration || seconds, seconds));
      await player.seekTo(clamped);
      if (track) {
        await persistPosition(track.slug, clamped);
      }
    },
    [persistPosition, player, status.duration, track]
  );

  const skipBackward = useCallback(async () => {
    const next = Math.max(0, status.currentTime - SKIP_SECONDS);
    await seekTo(next);
  }, [seekTo, status.currentTime]);

  const skipForward = useCallback(async () => {
    const duration = status.duration || track?.durationSeconds || 0;
    const next = Math.min(
      duration > 0 ? duration : status.currentTime + SKIP_SECONDS,
      status.currentTime + SKIP_SECONDS
    );
    await seekTo(next);
  }, [seekTo, status.currentTime, status.duration, track?.durationSeconds]);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((current) => {
      const next = nextPlaybackSpeed(current);
      player.setPlaybackRate(next);
      return next;
    });
  }, [player]);

  useEffect(() => {
    if (!track || !status.playing) return;
    if (
      shouldSavePeriodicPosition(status.currentTime, lastSavedAtRef.current)
    ) {
      void persistPosition(track.slug, status.currentTime);
    }
  }, [persistPosition, status.currentTime, status.playing, track]);

  // Cover lock-screen / interruption pauses, not only our pause() control.
  useEffect(() => {
    const wasPlaying = wasPlayingRef.current;
    wasPlayingRef.current = status.playing;
    if (!wasPlaying || status.playing || !track || status.didJustFinish) {
      return;
    }
    // replace() during loadAndPlay can flip playing off; skip until start finishes.
    if (pendingStartRef.current) return;
    void persistPosition(track.slug, status.currentTime);
  }, [
    persistPosition,
    status.currentTime,
    status.didJustFinish,
    status.playing,
    track,
  ]);

  useEffect(() => {
    if (!track || !status.didJustFinish || finishingRef.current) return;
    finishingRef.current = true;
    void (async () => {
      await clearPosition(track.slug);
      lastSavedAtRef.current = null;
      invalidateAudioQueries(queryClient);
    })();
  }, [queryClient, status.didJustFinish, track]);

  const duration =
    status.duration > 0 ? status.duration : (track?.durationSeconds ?? 0);
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, status.currentTime / duration)) : 0;

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      track,
      isPlaying: status.playing,
      isLoaded: Boolean(track) && status.isLoaded,
      currentTime: status.currentTime,
      duration,
      playbackSpeed,
      progress,
      loadAndPlay,
      togglePlayPause,
      pause,
      play,
      seekTo,
      skipBackward,
      skipForward,
      cycleSpeed,
    }),
    [
      track,
      status.playing,
      status.isLoaded,
      status.currentTime,
      duration,
      playbackSpeed,
      progress,
      loadAndPlay,
      togglePlayPause,
      pause,
      play,
      seekTo,
      skipBackward,
      skipForward,
      cycleSpeed,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error(
      "useAudioPlayerContext must be used within AudioPlayerProvider"
    );
  }
  return ctx;
}

export { PLAYBACK_SPEEDS };
