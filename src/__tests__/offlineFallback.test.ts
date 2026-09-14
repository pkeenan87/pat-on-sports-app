import type { ApiPostDetail } from "../lib/api";
import {
  __setOpenDatabaseForTests,
  OfflineUnavailableError,
  putCachedArticle,
} from "../lib/articleCache";
import { loadPostDetail } from "../lib/client";

type Row = {
  slug: string;
  body_hash: string;
  json: string;
  updated_at: number;
};

function createMemoryDb() {
  const rows = new Map<string, Row>();
  return {
    async execAsync() {},
    async runAsync(source: string, ...params: unknown[]) {
      if (source.includes("INSERT INTO article_bodies")) {
        const [slug, bodyHash, json, updatedAt] = params as [
          string,
          string,
          string,
          number,
        ];
        rows.set(slug, {
          slug,
          body_hash: bodyHash,
          json,
          updated_at: updatedAt,
        });
      }
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]) {
      if (source.includes("FROM article_bodies WHERE slug")) {
        const slug = params[0] as string;
        return (rows.get(slug) as T) ?? null;
      }
      return null;
    },
    async getAllAsync<T>() {
      return [...rows.values()] as T[];
    },
  };
}

const detail: ApiPostDetail = {
  slug: "week-01",
  title: "Week 1",
  date: "2026-09-10",
  description: "Recap",
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
  bodyHash: "hash-1",
  markdown: "Body text",
  prosCons: null,
  heroCaption: null,
  related: [],
};

describe("offline fallback path", () => {
  beforeEach(() => {
    __setOpenDatabaseForTests(async () => createMemoryDb());
  });

  afterEach(() => {
    __setOpenDatabaseForTests(null);
  });

  it("serves cached detail when offline", async () => {
    await putCachedArticle(detail);
    const loaded = await loadPostDetail({
      slug: detail.slug,
      expectedBodyHash: "hash-1",
      isOnline: false,
      fetchImpl: jest.fn(),
    });
    expect(loaded.markdown).toBe("Body text");
  });

  it("throws OfflineUnavailableError when offline with no cache", async () => {
    await expect(
      loadPostDetail({
        slug: "missing",
        isOnline: false,
        fetchImpl: jest.fn(),
      })
    ).rejects.toBeInstanceOf(OfflineUnavailableError);
  });

  it("refetches when the feed bodyHash no longer matches the cache", async () => {
    await putCachedArticle(detail);
    const updated = { ...detail, bodyHash: "hash-2", markdown: "Corrected" };
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(updated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const loaded = await loadPostDetail({
      slug: detail.slug,
      expectedBodyHash: "hash-2",
      isOnline: true,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalled();
    expect(loaded.markdown).toBe("Corrected");
    expect(loaded.bodyHash).toBe("hash-2");
  });

  it("returns cache and does not refetch when bodyHash matches", async () => {
    await putCachedArticle(detail);
    const fetchImpl = jest.fn();

    const loaded = await loadPostDetail({
      slug: detail.slug,
      expectedBodyHash: "hash-1",
      isOnline: true,
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(loaded.markdown).toBe("Body text");
  });

  it("falls back to cache when an online fetch fails", async () => {
    await putCachedArticle(detail);
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response("{}", { status: 500 })
    );

    const loaded = await loadPostDetail({
      slug: detail.slug,
      expectedBodyHash: "hash-changed",
      isOnline: true,
      fetchImpl,
    });

    expect(loaded.markdown).toBe("Body text");
  });
});
