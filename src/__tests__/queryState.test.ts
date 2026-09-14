import { shouldShowOfflineEmptyState } from "../lib/queryState";

describe("shouldShowOfflineEmptyState", () => {
  it("is true when pending with paused/idle and no data", () => {
    expect(
      shouldShowOfflineEmptyState({
        data: undefined,
        isPending: true,
        fetchStatus: "paused",
      })
    ).toBe(true);
    expect(
      shouldShowOfflineEmptyState({
        data: undefined,
        isPending: true,
        fetchStatus: "idle",
      })
    ).toBe(true);
  });

  it("is false when data exists or a fetch is in flight", () => {
    expect(
      shouldShowOfflineEmptyState({
        data: { posts: [] },
        isPending: false,
        fetchStatus: "paused",
      })
    ).toBe(false);
    expect(
      shouldShowOfflineEmptyState({
        data: undefined,
        isPending: true,
        fetchStatus: "fetching",
      })
    ).toBe(false);
  });
});
