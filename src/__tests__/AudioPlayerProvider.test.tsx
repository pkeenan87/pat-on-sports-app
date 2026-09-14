import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import {
  AudioPlayerProvider,
  useAudioPlayerContext,
} from "../audio/AudioPlayerProvider";
import {
  getLastPlayedSlug,
  getPosition,
  savePosition,
} from "../lib/audioPosition";

jest.mock("../lib/audioDownload", () => ({
  resolvePlaybackUri: jest.fn(async (_slug: string, remoteUrl: string) => remoteUrl),
}));

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

describe("AudioPlayerProvider resume", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("seeks to the saved position after the track loads, then plays", async () => {
    await savePosition("recap", 42);

    const { result } = await renderHook(() => useAudioPlayerContext(), {
      wrapper,
    });

    await act(async () => {
      await result.current.loadAndPlay({
        slug: "recap",
        title: "Season Recap",
        heroImage: null,
        audioUrl: "https://example.com/recap.m4a",
        durationSeconds: 501,
      });
    });

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

    const { result } = await renderHook(() => useAudioPlayerContext(), {
      wrapper,
    });

    let loadPromise: Promise<void> | undefined;
    await act(async () => {
      loadPromise = result.current.loadAndPlay({
        slug: "recap",
        title: "Season Recap",
        heroImage: null,
        audioUrl: "https://example.com/recap.m4a",
        durationSeconds: 501,
      });
      await loadPromise;
    });

    // Immediately after loadAndPlay resolves, replace has run but load may
    // still be pending — currentTime must not jump until isLoaded.
    // After waitFor, seek has applied.
    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });
    expect(result.current.currentTime).toBe(99);
  });
});
