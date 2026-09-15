import type { ApiPostSummary } from "../lib/api";
import { buildLatestSections } from "../lib/format";

function post(
  slug: string,
  label: ApiPostSummary["category"]["label"],
  season: number,
  date: string
): ApiPostSummary {
  return {
    slug,
    title: slug,
    date,
    description: "",
    tags: [],
    category: { label, slug: label.toLowerCase(), color: "navy" },
    heroImage: null,
    heroAlt: null,
    season,
    week: null,
    round: null,
    opponent: null,
    scoreUs: null,
    scoreThem: null,
    result: null,
    readingTimeMinutes: 3,
    audio: null,
    audioDurationSeconds: null,
    bodyHash: slug,
  };
}

const posts: ApiPostSummary[] = [
  post("2026-week-1", "Pros & Cons", 2026, "2026-09-10"),
  post("ucla-1", "UCLA", 2026, "2026-09-06"),
  post("recap", "NFL", 2025, "2026-08-29"),
  post("2025-week-21", "Pros & Cons", 2025, "2026-02-08"),
  post("2025-week-20", "Pros & Cons", 2025, "2026-01-25"),
  post("2025-preview", "Preview", 2025, "2026-01-15"),
];

describe("buildLatestSections", () => {
  it("moves 2025-run posts to the shelf when All is selected", () => {
    const sections = buildLatestSections(posts, "All");
    expect(sections.featured?.slug).toBe("2026-week-1");
    expect(sections.rest.map((p) => p.slug)).toEqual(["ucla-1", "recap"]);
    expect(sections.from2025.map((p) => p.slug)).toEqual([
      "2025-week-21",
      "2025-week-20",
      "2025-preview",
    ]);
  });

  it("keeps every matching post visible when a category is selected", () => {
    const sections = buildLatestSections(posts, "Pros & Cons");
    const shown = [sections.featured?.slug, ...sections.rest.map((p) => p.slug)];
    expect(shown).toEqual(["2026-week-1", "2025-week-21", "2025-week-20"]);
    expect(sections.from2025).toEqual([]);
  });

  it("returns no featured post for an empty category", () => {
    const sections = buildLatestSections(posts, "Preview");
    expect(sections.featured?.slug).toBe("2025-preview");
    expect(buildLatestSections([], "Preview").featured).toBeUndefined();
  });
});
