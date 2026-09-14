import type { ApiPostSummary } from "./api";

export type AudioPost = ApiPostSummary & {
  audio: string;
  audioDurationSeconds: number | null;
};

export function isAudioPost(post: ApiPostSummary): post is AudioPost {
  return typeof post.audio === "string" && post.audio.length > 0;
}

/**
 * Posts with audio, newest first. Optionally restrict to downloaded slugs.
 */
export function filterAudioPosts(
  posts: ApiPostSummary[],
  options: {
    downloadedOnly?: boolean;
    downloadedSlugs?: ReadonlySet<string> | string[];
  } = {}
): AudioPost[] {
  const downloaded = options.downloadedSlugs
    ? options.downloadedSlugs instanceof Set
      ? options.downloadedSlugs
      : new Set(options.downloadedSlugs)
    : null;

  const withAudio = posts.filter(isAudioPost).filter((post) => {
    if (!options.downloadedOnly) return true;
    return downloaded?.has(post.slug) ?? false;
  });

  return [...withAudio].sort((a, b) => {
    if (a.date === b.date) return a.slug < b.slug ? 1 : -1;
    return a.date < b.date ? 1 : -1;
  });
}
