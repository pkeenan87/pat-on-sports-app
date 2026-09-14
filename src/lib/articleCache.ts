import type { ApiPostDetail } from "./api";

export const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export class OfflineUnavailableError extends Error {
  constructor(message = "This article isn’t available offline yet.") {
    super(message);
    this.name = "OfflineUnavailableError";
  }
}

export function isOfflineUnavailableError(
  error: unknown
): error is OfflineUnavailableError {
  return (
    error instanceof OfflineUnavailableError ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: unknown }).name === "OfflineUnavailableError")
  );
}

export type CachedArticleRow = {
  slug: string;
  bodyHash: string;
  json: string;
  updatedAt: number;
};

type DbLike = {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
};

type OpenDatabase = (name: string) => Promise<DbLike>;

let dbPromise: Promise<DbLike> | null = null;
let openDatabaseImpl: OpenDatabase | null = null;

export function __setOpenDatabaseForTests(open: OpenDatabase | null) {
  openDatabaseImpl = open;
  dbPromise = null;
}

async function getDb(): Promise<DbLike> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const open =
          openDatabaseImpl ??
          (async (name: string) => {
            const SQLite = await import("expo-sqlite");
            return SQLite.openDatabaseAsync(name) as Promise<DbLike>;
          });
        const db = await open("pat-on-sports-articles.db");
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS article_bodies (
            slug TEXT PRIMARY KEY NOT NULL,
            body_hash TEXT NOT NULL,
            json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `);
        return db;
      } catch (error) {
        dbPromise = null;
        throw error;
      }
    })();
  }
  return dbPromise;
}

export async function getCachedArticle(
  slug: string
): Promise<{ detail: ApiPostDetail; bodyHash: string } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    slug: string;
    body_hash: string;
    json: string;
  }>("SELECT slug, body_hash, json FROM article_bodies WHERE slug = ?", slug);
  if (!row) return null;
  try {
    const detail = JSON.parse(row.json) as ApiPostDetail;
    return { detail, bodyHash: row.body_hash };
  } catch {
    return null;
  }
}

export async function putCachedArticle(detail: ApiPostDetail): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO article_bodies (slug, body_hash, json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       body_hash = excluded.body_hash,
       json = excluded.json,
       updated_at = excluded.updated_at`,
    detail.slug,
    detail.bodyHash,
    JSON.stringify(detail),
    Date.now()
  );
}

export async function getCachedBodyHash(slug: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ body_hash: string }>(
    "SELECT body_hash FROM article_bodies WHERE slug = ?",
    slug
  );
  return row?.body_hash ?? null;
}

export async function getAllCachedMarkdown(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ slug: string; json: string }>(
    "SELECT slug, json FROM article_bodies"
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    try {
      const detail = JSON.parse(row.json) as ApiPostDetail;
      if (detail.markdown) {
        map[row.slug] = detail.markdown;
      }
    } catch {
      // Skip corrupt rows.
    }
  }
  return map;
}
