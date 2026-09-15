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
  /**
   * Monotonic counter bumped whenever `useAudioPlayerStatus` yields a new
   * status object. Used to ignore stale isLoaded from a previous track.
   */
  const statusSeqRef = useRef(0);
  /** statusSeq at the moment replace() was called; start once a newer status arrives. */
  const pendingStartSeqRef = useRef<number | null>(null);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    statusSeqRef.current += 1;
  }, [status]);

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

      if (track) {
        await persistPosition(track.slug, player.currentTime);
      }

      const uri = await resolvePlaybackUri(next.slug, next.audioUrl);
      const resumeAt = await getPosition(next.slug);

      pendingResumeRef.current =
        resumeAt != null && resumeAt > 0 ? resumeAt : null;
      pendingSkipRef.current =
        options?.afterLoadSkipSeconds != null
          ? options.afterLoadSkipSeconds
          : null;
      lastSavedAtRef.current = pendingResumeRef.current ?? 0;

      activateLockScreen(next);
      // Capture seq immediately before replace so we ignore the previous
      // track's isLoaded until a newer status event arrives.
      pendingStartSeqRef.current = statusSeqRef.current;
      player.replace({ uri });
      setTrack(next);
      await setLastPlayedSlug(next.slug);
      // Seek, rate, and play happen in the post-replace loaded effect below.
    },
    [activateLockScreen, persistPosition, player, track]
  );

  // Apply resume / post-load skip only after a status event newer than replace.
  useEffect(() => {
    if (!track || !status.isLoaded) return;
    if (pendingStartSeqRef.current == null) return;
    if (statusSeqRef.current <= pendingStartSeqRef.current) return;

    pendingStartSeqRef.current = null;
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
        const base = resumeAt ?? 0;
        const next = Math.max(
          0,
          Math.min(duration > 0 ? duration : base + skipDelta, base + skipDelta)
        );
        await player.seekTo(next);
        position = next;
        lastSavedAtRef.current = next;
      }

      if (resumeAt != null || skipDelta != null) {
        await persistPosition(track.slug, position);
      }

      player.setPlaybackRate(playbackSpeed);
      player.play();
    })();
  }, [persistPosition, playbackSpeed, player, status, track]);

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
    if (pendingStartSeqRef.current != null) return;
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
