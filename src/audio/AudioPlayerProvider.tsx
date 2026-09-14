import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
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

type AudioPlayerContextValue = {
  track: AudioTrack | null;
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: PlaybackSpeed;
  progress: number;
  loadAndPlay: (track: AudioTrack) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  play: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  skipBackward: () => Promise<void>;
  skipForward: () => Promise<void>;
  cycleSpeed: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const lastSavedAtRef = useRef<number | null>(null);
  const finishingRef = useRef(false);

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
    },
    []
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
    async (next: AudioTrack) => {
      finishingRef.current = false;
      const uri = await resolvePlaybackUri(next.slug, next.audioUrl);
      const resumeAt = await getPosition(next.slug);

      player.replace({ uri });
      setTrack(next);
      await setLastPlayedSlug(next.slug);
      activateLockScreen(next);
      player.setPlaybackRate(playbackSpeed);

      if (resumeAt != null && resumeAt > 0) {
        await player.seekTo(resumeAt);
        lastSavedAtRef.current = resumeAt;
      } else {
        lastSavedAtRef.current = 0;
      }

      player.play();
    },
    [activateLockScreen, playbackSpeed, player]
  );

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

  useEffect(() => {
    if (!track || !status.didJustFinish || finishingRef.current) return;
    finishingRef.current = true;
    void clearPosition(track.slug);
    lastSavedAtRef.current = null;
  }, [status.didJustFinish, track]);

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
