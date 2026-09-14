import { filterAudioPosts } from "../lib/audioPosts";
import type { ApiPostSummary } from "../lib/api";

function post(
  overrides: Partial<ApiPostSummary> & Pick<ApiPostSummary, "slug" | "date">
): ApiPostSummary {
  return {
    title: overrides.slug,
    description: "",
    tags: [],
    category: { label: "NFL", slug: "nfl", color: "navy-muted" },
    heroImage: null,
    heroAlt: null,
    season: 2025,
    week: null,
    round: null,
    opponent: null,
    scoreUs: null,
    scoreThem: null,
    result: null,
    readingTimeMinutes: 5,
    audio: null,
    audioDurationSeconds: null,
    bodyHash: "hash",
    ...overrides,
  };
}

describe("filterAudioPosts", () => {
  const posts = [
    post({
      slug: "older",
      date: "2025-01-01",
      audio: "https://example.com/a.m4a",
      audioDurationSeconds: 100,
    }),
    post({
      slug: "newer",
      date: "2026-08-29",
      audio: "https://example.com/b.m4a",
      audioDurationSeconds: 200,
    }),
    post({ slug: "silent", date: "2026-09-01", audio: null }),
  ];

  it("keeps only posts with audio, newest first", () => {
    const result = filterAudioPosts(posts);
    expect(result.map((p) => p.slug)).toEqual(["newer", "older"]);
  });

  it("filters to downloaded slugs", () => {
    const result = filterAudioPosts(posts, {
      downloadedOnly: true,
      downloadedSlugs: ["older"],
    });
    expect(result.map((p) => p.slug)).toEqual(["older"]);
  });

  it("returns empty when downloaded filter has no matches", () => {
    expect(
      filterAudioPosts(posts, {
        downloadedOnly: true,
        downloadedSlugs: [],
      })
    ).toEqual([]);
  });
});
