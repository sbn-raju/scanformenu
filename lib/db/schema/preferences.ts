import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/** Per-user notification settings. A missing row means "all defaults". */
export const userPreferences = pgTable.withRLS("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailProductUpdates: boolean("email_product_updates").notNull().default(true),
  emailWeeklySummary: boolean("email_weekly_summary").notNull().default(true),
  emailSecurityAlerts: boolean("email_security_alerts").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
