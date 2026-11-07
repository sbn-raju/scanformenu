import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { properties } from "./properties";
import { users } from "./users";

/**
 * Images uploaded to a property's media library.
 *
 * The file itself lives in ImageKit; this row is the app's record of it.
 * `imagekitFileId` is what we pass to the ImageKit API (details, delete), and
 * `filePath` is what we render through the ImageKit URL endpoint so
 * transformations (resize, format, quality) can be applied on delivery.
 */
export const mediaAssets = pgTable.withRLS(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** Null only if the uploader's account was later deleted; the image stays. */
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),

    title: text("title").notNull(),
    description: text("description"),

    // ImageKit file metadata, verified server-side after the upload.
    imagekitFileId: text("imagekit_file_id").notNull().unique(),
    filePath: text("file_path").notNull(),
    url: text("url").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),

    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The media library lists a property's images newest first.
    index("media_assets_property_id_uploaded_at_idx").on(t.propertyId, t.uploadedAt.desc()),
    // Covers the uploaded_by foreign key (ON DELETE SET NULL scans it).
    index("media_assets_uploaded_by_idx").on(t.uploadedBy),
    check(
      "media_assets_dimensions_non_negative",
      sql`${t.sizeBytes} >= 0 and coalesce(${t.width}, 0) >= 0 and coalesce(${t.height}, 0) >= 0`,
    ),
  ],
);

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
