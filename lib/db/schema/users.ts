import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Application users, mirrored from Clerk.
 *
 * Clerk owns authentication; this table stores the profile data the app
 * needs to reference users from its own tables. RLS is enabled with no
 * policies so Supabase's public Data API cannot read it — the server
 * connects directly as the database owner.
 */
export const users = pgTable.withRLS("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
