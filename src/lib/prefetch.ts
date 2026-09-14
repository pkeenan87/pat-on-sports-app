import { Image } from "expo-image";
import * as Network from "expo-network";

import type { ApiPostSummary } from "./api";
import { fetchPostDetail } from "./client";
import { getCachedBodyHash, putCachedArticle } from "./articleCache";

export const PREFETCH_COUNT = 10;

export function isWifiNetwork(type: Network.NetworkStateType | undefined): boolean {
  return type === Network.NetworkStateType.WIFI;
}

export function isDeviceOnline(state: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  // Treat unknown reachability as online when a connection exists.
  return state.isConnected === true || state.isConnected == null;
}

/**
 * Prefetch detail JSON + hero images for the newest posts. Wi-Fi only.
 */
export async function prefetchNewestArticles(
  posts: ApiPostSummary[],
  options: {
    networkType?: Network.NetworkStateType;
    isOnline: boolean;
    limit?: number;
    fetchImpl?: typeof fetch;
  }
): Promise<void> {
  if (!options.isOnline) return;
  if (!isWifiNetwork(options.networkType)) return;

  const newest = posts.slice(0, options.limit ?? PREFETCH_COUNT);
  const heroUrls = newest
    .map((post) => post.heroImage)
    .filter((url): url is string => Boolean(url));

  if (heroUrls.length > 0) {
    await Image.prefetch(heroUrls).catch(() => false);
  }

  await Promise.all(
    newest.map(async (post) => {
      try {
        const cachedHash = await getCachedBodyHash(post.slug);
        if (cachedHash === post.bodyHash) return;
        const detail = await fetchPostDetail(post.slug, options.fetchImpl);
        await putCachedArticle(detail);
      } catch {
        // Prefetch is best-effort.
      }
    })
  );
}
