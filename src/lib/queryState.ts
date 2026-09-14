/**
 * True when the feed has nothing to show because the device is offline (or
 * the query is paused) and no cached data has been restored yet.
 */
export function shouldShowOfflineEmptyState(query: {
  data: unknown;
  isPending: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
}): boolean {
  return (
    !query.data &&
    query.isPending &&
    (query.fetchStatus === "paused" || query.fetchStatus === "idle")
  );
}
