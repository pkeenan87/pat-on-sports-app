import type { ApiPostDetail } from "../lib/api";
import {
  __setOpenDatabaseForTests,
  getAllCachedMarkdown,
  getCachedArticle,
  getCachedBodyHash,
  putCachedArticle,
} from "../lib/articleCache";

type Row = {
  slug: string;
  body_hash: string;
  json: string;
  updated_at: number;
};

function createMemoryDb() {
  const rows = new Map<string, Row>();

  return {
    async execAsync() {
      // no-op schema setup
    },
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

const sampleDetail: ApiPostDetail = {
  slug: "week-01-pros-cons-pats-vs-seahawks",
  title: "Week 1",
  date: "2026-09-10",
  description: "A painful road loss.",
  tags: ["NFL", "Pros & Cons"],
  category: { label: "Pros & Cons", slug: "pros-cons", color: "navy" },
  heroImage: "https://patonsports.com/images/hero.jpg",
  heroAlt: "Hero",
  season: 2026,
  week: 1,
  round: null,
  opponent: "Seattle Seahawks",
  scoreUs: 10,
  scoreThem: 13,
  result: "L",
  readingTimeMinutes: 3,
  audio: null,
  audioDurationSeconds: null,
  bodyHash: "abc123",
  markdown: "Defense looked solid.",
  prosCons: null,
  heroCaption: null,
  related: [],
};

describe("article SQLite cache", () => {
  beforeEach(() => {
    __setOpenDatabaseForTests(async () => createMemoryDb());
  });

  afterEach(() => {
    __setOpenDatabaseForTests(null);
  });

  it("stores and reads a post detail by slug", async () => {
    await putCachedArticle(sampleDetail);
    const cached = await getCachedArticle(sampleDetail.slug);
    expect(cached?.bodyHash).toBe("abc123");
    expect(cached?.detail.title).toBe("Week 1");
    expect(await getCachedBodyHash(sampleDetail.slug)).toBe("abc123");
  });

  it("indexes markdown for archive body search", async () => {
    await putCachedArticle(sampleDetail);
    const bodies = await getAllCachedMarkdown();
    expect(bodies[sampleDetail.slug]).toContain("Defense looked solid");
  });

  it("recovers after a failed open so a later open can succeed", async () => {
    let attempts = 0;
    __setOpenDatabaseForTests(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("disk full");
      }
      return createMemoryDb();
    });

    await expect(getCachedArticle("missing")).rejects.toThrow("disk full");
    await putCachedArticle(sampleDetail);
    const cached = await getCachedArticle(sampleDetail.slug);
    expect(cached?.bodyHash).toBe("abc123");
    expect(attempts).toBe(2);
  });
});
