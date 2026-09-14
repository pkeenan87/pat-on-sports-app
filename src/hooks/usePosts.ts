import { useQuery } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { useEffect } from "react";

import { fetchManifest, fetchPostsFeed, loadPostDetail } from "../lib/client";
import { getAllCachedMarkdown } from "../lib/articleCache";
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
    });
  }, [query.data?.posts, network.isOnline, network.type]);

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
  });
}

export function useCachedBodies() {
  return useQuery({
    queryKey: ["posts", "cached-bodies"],
    queryFn: () => getAllCachedMarkdown(),
    staleTime: 30_000,
  });
}
