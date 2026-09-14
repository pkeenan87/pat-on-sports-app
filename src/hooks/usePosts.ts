import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { useEffect } from "react";

import { fetchManifest, fetchPostsFeed, loadPostDetail } from "../lib/client";
import {
  getAllCachedMarkdown,
  isOfflineUnavailableError,
} from "../lib/articleCache";
import { isDeviceOnline, prefetchNewestArticles } from "../lib/prefetch";

export function useNetworkStatus() {
  const state = useNetworkState();
  const isOnline = isDeviceOnline(state);
  return {
    isOnline,
    isOffline: !isOnline,
    type: state.type,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
  };
}

export function useManifest() {
  return useQuery({
    queryKey: ["manifest"],
    queryFn: () => fetchManifest(),
    networkMode: "offlineFirst",
  });
}

export function usePostsFeed() {
  const network = useNetworkStatus();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["posts", "feed"],
    queryFn: () => fetchPostsFeed(),
    networkMode: "offlineFirst",
  });

  useEffect(() => {
    if (!query.data?.posts?.length) return;
    if (!network.isOnline) return;
    void prefetchNewestArticles(query.data.posts, {
      isOnline: network.isOnline,
      networkType: network.type,
    }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["posts", "cached-bodies"] });
    });
  }, [query.data?.posts, network.isOnline, network.type, queryClient]);

  return {
    ...query,
    isServingFromCache: Boolean(query.data) && network.isOffline,
  };
}

export function usePostDetail(slug: string, expectedBodyHash?: string | null) {
  const network = useNetworkStatus();

  return useQuery({
    queryKey: ["posts", "detail", slug, expectedBodyHash ?? null],
    queryFn: () =>
      loadPostDetail({
        slug,
        expectedBodyHash,
        isOnline: network.isOnline,
      }),
    enabled: Boolean(slug),
    networkMode: "offlineFirst",
    retry: (failureCount, error) => {
      if (isOfflineUnavailableError(error)) return false;
      return failureCount < 1;
    },
  });
}

export function useCachedBodies() {
  return useQuery({
    queryKey: ["posts", "cached-bodies"],
    queryFn: () => getAllCachedMarkdown(),
    staleTime: 30_000,
  });
}
