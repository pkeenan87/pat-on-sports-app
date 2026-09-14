/**
 * API contract copied from pat-on-sports/src/lib/api.ts.
 * Schemas and types only — site-side builders stay in the site repo.
 */
import { z } from "zod";

/** Bump when the JSON shape changes in a breaking way. */
export const API_SCHEMA_VERSION = 1;

export type CategoryColorToken = "navy" | "red" | "navy-muted" | "ucla";

export const apiCategorySchema = z.object({
  label: z.enum(["Pros & Cons", "Preview", "NFL", "UCLA"]),
  slug: z.string(),
  color: z.enum(["navy", "red", "navy-muted", "ucla"]),
});

export const apiPostSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  category: apiCategorySchema,
  heroImage: z.url().nullable(),
  heroAlt: z.string().nullable(),
  season: z.number().int().nullable(),
  week: z.number().int().nullable(),
  round: z.string().nullable(),
  opponent: z.string().nullable(),
  scoreUs: z.number().int().nullable(),
  scoreThem: z.number().int().nullable(),
  result: z.enum(["W", "L", "T"]).nullable(),
  readingTimeMinutes: z.number().int().positive(),
  audio: z.url().nullable(),
  audioDurationSeconds: z.number().int().positive().nullable(),
  bodyHash: z.string(),
});

export const apiPostDetailSchema = apiPostSummarySchema.extend({
  markdown: z.string(),
  prosCons: z
    .object({
      intro: z.array(
        z.union([
          z.object({ type: z.literal("heading"), text: z.string() }),
          z.object({ type: z.literal("paragraph"), text: z.string() }),
          z.object({
            type: z.literal("list"),
            items: z.array(z.string()),
          }),
        ])
      ),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      hasPanels: z.boolean(),
    })
    .nullable(),
  heroCaption: z.string().nullable(),
  related: z.array(z.string()).max(3),
});

export const apiPostsFeedSchema = z.object({
  schemaVersion: z.number().int().positive(),
  generatedAt: z.string(),
  site: z.url(),
  posts: z.array(apiPostSummarySchema),
});

export const apiManifestSchema = z.object({
  schemaVersion: z.number().int().positive(),
  minSupportedSchemaVersion: z.number().int().positive(),
  commentsApiBase: z.url().nullable(),
  message: z.string().nullable(),
  site: z.url(),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiPostSummary = z.infer<typeof apiPostSummarySchema>;
export type ApiPostDetail = z.infer<typeof apiPostDetailSchema>;
export type ApiPostsFeed = z.infer<typeof apiPostsFeedSchema>;
export type ApiManifest = z.infer<typeof apiManifestSchema>;
export type ProsConsSections = NonNullable<ApiPostDetail["prosCons"]>;
