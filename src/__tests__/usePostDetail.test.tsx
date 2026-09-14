import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import { usePostDetail } from "../hooks/usePosts";
import {
  __setOpenDatabaseForTests,
  OfflineUnavailableError,
} from "../lib/articleCache";

jest.mock("expo-network", () => ({
  useNetworkState: () => ({
    type: "NONE",
    isConnected: false,
    isInternetReachable: false,
  }),
  NetworkStateType: {
    NONE: "NONE",
    UNKNOWN: "UNKNOWN",
    CELLULAR: "CELLULAR",
    WIFI: "WIFI",
  },
}));

function createMemoryDb() {
  return {
    async execAsync() {},
    async runAsync() {},
    async getFirstAsync() {
      return null;
    },
    async getAllAsync() {
      return [];
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe("usePostDetail offline", () => {
  beforeEach(() => {
    __setOpenDatabaseForTests(async () => createMemoryDb());
  });

  afterEach(() => {
    __setOpenDatabaseForTests(null);
  });

  it("reports OfflineUnavailableError when offline with no cache", async () => {
    const { result } = await renderHook(
      () => usePostDetail("missing-slug", "hash"),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const reported = result.current.error ?? result.current.failureReason;
    expect(reported).toBeInstanceOf(OfflineUnavailableError);
  });
});
