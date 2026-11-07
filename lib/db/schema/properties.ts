import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { MEMBER_ROLES, PROPERTY_SCALES, PROPERTY_TYPES } from "@/lib/properties/constants";

import { users } from "./users";

export const propertyType = pgEnum("property_type", PROPERTY_TYPES);
export const propertyScale = pgEnum("property_scale", PROPERTY_SCALES);
export const memberRole = pgEnum("member_role", MEMBER_ROLES);

/**
 * A property (restaurant, hotel, café…) is the tenant: every menu, QR code
 * and order will hang off a property. Users reach a property through
 * `property_members`; whoever creates it becomes its `owner`.
 */
export const properties = pgTable.withRLS(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** URL-safe identifier for public menu links, e.g. /m/the-grand-cafe-x7k2. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: propertyType("type").notNull(),
    description: text("description"),

    // Ownership & legal
    ownerName: text("owner_name").notNull(),
    legalName: text("legal_name"),
    taxId: text("tax_id"),
    establishedOn: date("established_on", { mode: "string" }),

    // Scale
    scale: propertyScale("scale").notNull(),
    seatingCapacity: integer("seating_capacity"),
    roomCount: integer("room_count"),
    floorCount: integer("floor_count"),
    staffCount: integer("staff_count"),
    areaSqFt: integer("area_sq_ft"),

    // Contact
    email: text("email"),
    phone: text("phone"),
    website: text("website"),

    // Address
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").notNull(),

    // Regional preferences
    currency: text("currency").notNull().default("USD"),
    timezone: text("timezone").notNull().default("UTC"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "properties_counts_non_negative",
      sql`coalesce(${t.seatingCapacity}, 0) >= 0
        and coalesce(${t.roomCount}, 0) >= 0
        and coalesce(${t.floorCount}, 0) >= 0
        and coalesce(${t.staffCount}, 0) >= 0
        and coalesce(${t.areaSqFt}, 0) >= 0`,
    ),
  ],
);

/** Who can access a property, and with what role. */
export const propertyMembers = pgTable.withRLS(
  "property_members",
  {
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("staff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.propertyId, t.userId] }),
    // The PK covers lookups by property; this covers "which properties does this user have".
    index("property_members_user_id_idx").on(t.userId),
  ],
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type { MemberRole, PropertyScale, PropertyType } from "@/lib/properties/constants";
