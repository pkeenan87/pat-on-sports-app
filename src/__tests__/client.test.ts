import {
  apiPostDetailSchema,
  apiPostsFeedSchema,
} from "../../src/lib/api";
import { fetchPostDetail, fetchPostsFeed } from "../../src/lib/client";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sampleSummary = {
  slug: "week-01-pros-cons-pats-vs-seahawks",
  title: "Week 1: Patriots 10 – Seahawks 13",
  date: "2026-09-10",
  description: "A painful road loss.",
  tags: ["NFL", "Pros & Cons", "New England Patriots", "Seattle Seahawks"],
  category: { label: "Pros & Cons" as const, slug: "pros-cons", color: "navy" as const },
  heroImage: "https://patonsports.com/images/hero.jpg",
  heroAlt: "Hero",
  season: 2026,
  week: 1,
  round: null,
  opponent: "Seattle Seahawks",
  scoreUs: 10,
  scoreThem: 13,
  result: "L" as const,
  readingTimeMinutes: 3,
  audio: null,
  audioDurationSeconds: null,
  bodyHash: "abc123",
};

const sampleFeed = {
  schemaVersion: 1,
  generatedAt: "2026-09-14T00:00:00.000Z",
  site: "https://patonsports.com",
  posts: [sampleSummary],
};

const sampleDetail = {
  ...sampleSummary,
  markdown: "# Hello\n\nBody.",
  prosCons: {
    intro: [{ type: "paragraph" as const, text: "Intro copy." }],
    pros: ["Defense looked solid"],
    cons: ["Turnovers hurt"],
    hasPanels: true,
  },
  heroCaption: null,
  related: ["other-slug"],
};

describe("API client", () => {
  it("validates and returns the posts feed", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(sampleFeed));
    const feed = await fetchPostsFeed(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://patonsports.com/api/v1/posts.json"
    );
    expect(apiPostsFeedSchema.parse(feed).posts[0]?.slug).toBe(
      sampleSummary.slug
    );
  });

  it("rejects an invalid posts feed", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ bad: true }));
    await expect(fetchPostsFeed(fetchImpl)).rejects.toThrow(/Invalid posts feed/);
  });

  it("validates and returns a post detail", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(sampleDetail));
    const post = await fetchPostDetail(sampleSummary.slug, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://patonsports.com/api/v1/posts/${sampleSummary.slug}.json`
    );
    expect(apiPostDetailSchema.parse(post).prosCons?.hasPanels).toBe(true);
  });

  it("surfaces HTTP errors", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({}, 404));
    await expect(fetchPostDetail("missing", fetchImpl)).rejects.toThrow(/404/);
  });
});
