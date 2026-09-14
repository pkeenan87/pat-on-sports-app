import {
  apiPostDetailSchema,
  apiPostsFeedSchema,
  type ApiPostDetail,
  type ApiPostsFeed,
} from "./api";

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

export function canonicalPostUrl(slug: string): string {
  return `${API_BASE}/blog/${slug}`;
}
