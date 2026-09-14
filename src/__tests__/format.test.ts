import type { ApiPostSummary } from "../lib/api";
import {
  filterPostsByCategory,
  filterPostsByQuery,
  formatDisplayDate,
  formatScoreline,
  groupPostsBySeason,
  is2025RunPost,
} from "../lib/format";

function post(
  overrides: Partial<ApiPostSummary> & Pick<ApiPostSummary, "slug" | "title">
): ApiPostSummary {
  return {
    date: "2026-09-10",
    description: "A recap.",
    tags: ["NFL"],
    category: { label: "NFL", slug: "nfl", color: "navy-muted" },
    heroImage: null,
    heroAlt: null,
    season: 2026,
    week: 1,
    round: null,
    opponent: null,
    scoreUs: null,
    scoreThem: null,
    result: null,
    readingTimeMinutes: 3,
    audio: null,
    audioDurationSeconds: null,
    bodyHash: "hash",
    ...overrides,
  };
}

describe("format helpers", () => {
  it("formats a scoreline", () => {
    expect(formatScoreline("W", 27, 20)).toBe("W 27–20");
    expect(formatScoreline("L", 10, 13)).toBe("L 10–13");
  });

  it("formats a display date in UTC", () => {
    expect(formatDisplayDate("2026-09-10")).toBe("Sep 10, 2026");
    expect(formatDisplayDate(undefined)).toBeUndefined();
  });

  it("groups posts by season descending", () => {
    const groups = groupPostsBySeason([
      post({ slug: "a", title: "A", season: 2025 }),
      post({ slug: "b", title: "B", season: 2026 }),
      post({ slug: "c", title: "C", season: null }),
    ]);
    expect(groups.map((g) => g.season)).toEqual([2026, 2025, null]);
  });

  it("filters by category and query including cached bodies", () => {
    const posts = [
      post({
        slug: "one",
        title: "Seahawks recap",
        category: { label: "Pros & Cons", slug: "pros-cons", color: "navy" },
        tags: ["Pros & Cons"],
      }),
      post({
        slug: "two",
        title: "UCLA preview",
        category: { label: "UCLA", slug: "ucla", color: "ucla" },
        description: "Bruins host SDSU",
      }),
    ];

    expect(filterPostsByCategory(posts, "UCLA")).toHaveLength(1);
    expect(filterPostsByQuery(posts, "seahawks").map((p) => p.slug)).toEqual([
      "one",
    ]);
    expect(
      filterPostsByQuery(posts, "coverage sacks", {
        one: "These looked like coverage sacks to me",
        two: "No match here",
      }).map((p) => p.slug)
    ).toEqual(["one"]);
  });

  it("detects 2025 run posts", () => {
    expect(
      is2025RunPost(
        post({
          slug: "run",
          title: "Week 18",
          season: 2025,
          category: { label: "Pros & Cons", slug: "pros-cons", color: "navy" },
        })
      )
    ).toBe(true);
    expect(
      is2025RunPost(
        post({
          slug: "ucla",
          title: "UCLA",
          season: 2025,
          category: { label: "UCLA", slug: "ucla", color: "ucla" },
        })
      )
    ).toBe(false);
  });
});
