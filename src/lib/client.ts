import {
  apiManifestSchema,
  apiPostDetailSchema,
  apiPostsFeedSchema,
  type ApiManifest,
  type ApiPostDetail,
  type ApiPostsFeed,
} from "./api";
import {
  getCachedArticle,
  getCachedBodyHash,
  OfflineUnavailableError,
  putCachedArticle,
} from "./articleCache";

export const API_BASE = "https://patonsports.com";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchPostsFeed(
  fetchImpl: typeof fetch = fetch
): Promise<ApiPostsFeed> {
  const response = await fetchImpl(`${API_BASE}/api/v1/posts.json`);
  if (!response.ok) {
    throw new ApiError(`Failed to load posts (${response.status})`, response.status);
  }
  const json: unknown = await response.json();
  const parsed = apiPostsFeedSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Invalid posts feed: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function fetchManifest(
  fetchImpl: typeof fetch = fetch
): Promise<ApiManifest> {
  const response = await fetchImpl(`${API_BASE}/api/v1/manifest.json`);
  if (!response.ok) {
    throw new ApiError(
      `Failed to load manifest (${response.status})`,
      response.status
    );
  }
  const json: unknown = await response.json();
  const parsed = apiManifestSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Invalid manifest: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function fetchPostDetail(
  slug: string,
  fetchImpl: typeof fetch = fetch
): Promise<ApiPostDetail> {
  const response = await fetchImpl(
    `${API_BASE}/api/v1/posts/${encodeURIComponent(slug)}.json`
  );
  if (!response.ok) {
    throw new ApiError(`Failed to load post (${response.status})`, response.status);
  }
  const json: unknown = await response.json();
  const parsed = apiPostDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Invalid post detail: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * Load a post detail with SQLite cache and offline fallback.
 * When online, refetch if the feed’s bodyHash differs from the cache (or there
 * is no cache). When offline, serve the cached JSON or throw OfflineUnavailableError.
 */
export async function loadPostDetail(options: {
  slug: string;
  expectedBodyHash?: string | null;
  isOnline: boolean;
  fetchImpl?: typeof fetch;
}): Promise<ApiPostDetail> {
  const { slug, expectedBodyHash, isOnline, fetchImpl = fetch } = options;
  const cached = await getCachedArticle(slug);
  const cachedHash = cached?.bodyHash ?? (await getCachedBodyHash(slug));
  const hashMatches =
    expectedBodyHash == null ||
    cachedHash == null ||
    cachedHash === expectedBodyHash;

  if (isOnline) {
    const needsNetwork = !cached || !hashMatches;
    if (!needsNetwork && cached) {
      // Still refresh in the background when possible, but return cache now.
      void fetchPostDetail(slug, fetchImpl)
        .then((detail) => putCachedArticle(detail))
        .catch(() => undefined);
      return cached.detail;
    }
    try {
      const detail = await fetchPostDetail(slug, fetchImpl);
      await putCachedArticle(detail);
      return detail;
    } catch (error) {
      if (cached) return cached.detail;
      throw error;
    }
  }

  if (cached) return cached.detail;
  throw new OfflineUnavailableError();
}

export function canonicalPostUrl(slug: string): string {
  return `${API_BASE}/blog/${slug}`;
}
