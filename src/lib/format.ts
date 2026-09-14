import type { ApiPostSummary } from "./api";

export const CATEGORY_ORDER = ["Pros & Cons", "Preview", "NFL", "UCLA"] as const;

export type CategoryLabel = (typeof CATEGORY_ORDER)[number];

const CATEGORY_TAG_NAMES = new Set([
  "nfl",
  "ncaaf",
  "pros & cons",
  "pro & cons",
  "preview",
  "ucla",
  "ucla bruins",
  "college football",
  "new england patriots",
]);

export function formatScoreline(
  result: "W" | "L" | "T",
  scoreUs: number,
  scoreThem: number
): string {
  return `${result} ${scoreUs}–${scoreThem}`;
}

export function formatDisplayDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const iso = date.slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getOpponentTags(tags: string[]): string[] {
  return tags.filter((tag) => !CATEGORY_TAG_NAMES.has(tag.toLowerCase()));
}

/** Weekly/playoff recaps from the 2025 Super Bowl run (homepage shelf). */
export function is2025RunPost(post: ApiPostSummary): boolean {
  if (post.season !== 2025) return false;
  const label = post.category.label;
  return label === "Pros & Cons" || label === "Preview";
}

export function groupPostsBySeason(
  posts: ApiPostSummary[]
): { season: number | null; posts: ApiPostSummary[] }[] {
  const map = new Map<number | null, ApiPostSummary[]>();
  for (const post of posts) {
    const key = post.season;
    const list = map.get(key) ?? [];
    list.push(post);
    map.set(key, list);
  }

  const seasons = [...map.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return b - a;
  });

  return seasons.map((season) => ({
    season,
    posts: map.get(season) ?? [],
  }));
}

/**
 * Search title, description, tags, opponent, category, and optionally cached
 * article Markdown bodies keyed by slug.
 */
export function filterPostsByQuery(
  posts: ApiPostSummary[],
  query: string,
  cachedBodies: Record<string, string> = {}
): ApiPostSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return posts;
  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.description,
      ...post.tags,
      post.opponent ?? "",
      post.category.label,
      cachedBodies[post.slug] ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterPostsByCategory(
  posts: ApiPostSummary[],
  category: CategoryLabel | "All"
): ApiPostSummary[] {
  if (category === "All") return posts;
  return posts.filter((post) => post.category.label === category);
}
