import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import {
  AudioPlayerProvider,
  useAudioPlayerContext,
  type AudioTrack,
} from "../audio/AudioPlayerProvider";
import {
  getLastPlayedSlug,
  getPosition,
  savePosition,
} from "../lib/audioPosition";

jest.mock("../lib/audioDownload", () => ({
  resolvePlaybackUri: jest.fn(
    async (_slug: string, remoteUrl: string) => remoteUrl
  ),
}));

type AudioTestExports = {
  __audioTestPlayer: {
    seekTo: jest.Mock;
    play: jest.Mock;
    replace: jest.Mock;
  };
  __audioTestResetStatus: () => void;
};

function audioTest(): AudioTestExports {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- test helper
  return require("expo-audio") as AudioTestExports;
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
  return React.createElement(
    QueryClientProvider,
    { client },
    React.createElement(AudioPlayerProvider, null, children)
  );
}

function track(slug: string, overrides: Partial<AudioTrack> = {}): AudioTrack {
  return {
    slug,
    title: slug,
    heroImage: null,
    audioUrl: `https://example.com/${slug}.m4a`,
    durationSeconds: 501,
    ...overrides,
  };
}

async function flushReplaceLoad() {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
}

describe("AudioPlayerProvider resume", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    jest.clearAllMocks();
    audioTest().__audioTestResetStatus();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("seeks to the saved position after the track loads, then plays", async () => {
    await savePosition("recap", 42);

    const { result } = await renderHook(() => useAudioPlayerContext(), {
      wrapper,
    });

    await act(async () => {
      await result.current.loadAndPlay(
        track("recap", { title: "Season Recap" })
      );
    });
    await flushReplaceLoad();

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isPlaying).toBe(true);
    });

    expect(result.current.currentTime).toBe(42);
    expect(await getLastPlayedSlug()).toBe("recap");
    expect(await getPosition("recap")).toBe(42);
  });

  it("does not seek before the source reports loaded", async () => {
    await savePosition("recap", 99);
    const player = audioTest().__audioTestPlayer;

    const { result } = await renderHook(() => useAudioPlayerContext(), {
      wrapper,
    });

    await act(async () => {
      await result.current.loadAndPlay(
        track("recap", { title: "Season Recap" })
      );
    });

    expect(player.seekTo).not.toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();

    await flushReplaceLoad();

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });
    expect(result.current.currentTime).toBe(99);
  });

  it("waits for a post-replace loaded status when switching tracks", async () => {
    await savePosition("track-b", 77);
    const player = audioTest().__audioTestPlayer;

    const { result } = await renderHook(() => useAudioPlayerContext(), {
      wrapper,
    });

    await act(async () => {
      await result.current.loadAndPlay(track("track-a"));
    });
    await flushReplaceLoad();
    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.track?.slug).toBe("track-a");
    });

    player.seekTo.mockClear();
    player.play.mockClear();

    await act(async () => {
      await result.current.loadAndPlay(track("track-b"));
    });

    // Stale isLoaded from track A must not start track B early.
    expect(result.current.track?.slug).toBe("track-b");
    expect(player.seekTo).not.toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();

    await flushReplaceLoad();

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    expect(player.seekTo).toHaveBeenCalledWith(77);
    expect(player.play).toHaveBeenCalled();
    expect(result.current.currentTime).toBe(77);
    expect(await getLastPlayedSlug()).toBe("track-b");
  });
});
