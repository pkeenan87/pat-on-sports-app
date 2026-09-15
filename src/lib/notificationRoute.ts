export type NotificationRoute =
  | { type: "article"; slug: string }
  | { type: "url"; url: string }
  | { type: "none" };

/**
 * Map push payload data ({slug, url}) to an in-app route.
 * Prefer slug → /article/{slug}; fall back to opening url in the in-app browser.
 */
export function routeFromNotificationData(
  data: Record<string, unknown> | null | undefined
): NotificationRoute {
  if (!data) return { type: "none" };

  const slug = data.slug;
  if (typeof slug === "string" && slug.trim().length > 0) {
    return { type: "article", slug: slug.trim() };
  }

  const url = data.url;
  if (typeof url === "string" && url.trim().length > 0) {
    return { type: "url", url: url.trim() };
  }

  return { type: "none" };
}
