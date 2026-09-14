import { NetworkStateType } from "expo-network";
import { Image } from "expo-image";

import type { ApiPostSummary } from "../lib/api";
import { prefetchNewestArticles } from "../lib/prefetch";

jest.mock("../lib/client", () => ({
  fetchPostDetail: jest.fn(),
}));

jest.mock("../lib/articleCache", () => ({
  getCachedBodyHash: jest.fn(async () => null),
  putCachedArticle: jest.fn(async () => undefined),
}));

const { fetchPostDetail } = jest.requireMock("../lib/client") as {
  fetchPostDetail: jest.Mock;
};

function post(slug: string): ApiPostSummary {
  return {
    slug,
    title: slug,
    date: "2026-09-10",
    description: "Recap",
    tags: ["NFL"],
    category: { label: "NFL", slug: "nfl", color: "navy-muted" },
    heroImage: `https://patonsports.com/images/${slug}.jpg`,
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
  };
}

describe("prefetchNewestArticles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches nothing on cellular", async () => {
    await prefetchNewestArticles([post("a"), post("b")], {
      isOnline: true,
      networkType: NetworkStateType.CELLULAR,
      fetchImpl: jest.fn(),
    });

    expect(fetchPostDetail).not.toHaveBeenCalled();
    expect(Image.prefetch).not.toHaveBeenCalled();
  });

  it("fetches nothing when offline", async () => {
    await prefetchNewestArticles([post("a"), post("b")], {
      isOnline: false,
      networkType: NetworkStateType.WIFI,
      fetchImpl: jest.fn(),
    });

    expect(fetchPostDetail).not.toHaveBeenCalled();
    expect(Image.prefetch).not.toHaveBeenCalled();
  });
});
