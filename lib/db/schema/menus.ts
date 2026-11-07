import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { DIETARY_TYPES } from "@/lib/menus/constants";

import { mediaAssets } from "./media";
import { properties } from "./properties";
import { users } from "./users";

export const dietaryType = pgEnum("dietary_type", DIETARY_TYPES);

/**
 * A menu belongs to a property (e.g. "Breakfast", "Diwali special").
 * The hierarchy is menu → categories → sub-categories → items.
 * `slug` is globally unique and makes the public link: /m/<slug>.
 */
export const menus = pgTable.withRLS(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    /** Inactive menus are hidden from guests; their QR codes show "unavailable". */
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("menus_property_id_created_at_idx").on(t.propertyId, t.createdAt),
    index("menus_created_by_idx").on(t.createdBy),
  ],
);

/** Top-level section of a menu, e.g. "Beverages". */
export const menuCategories = pgTable.withRLS(
  "menu_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** Display order within the menu, ascending. */
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("menu_categories_menu_id_position_idx").on(t.menuId, t.position)],
);

/** Section inside a category, e.g. Beverages → "Hot coffee". */
export const menuSubcategories = pgTable.withRLS(
  "menu_subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("menu_subcategories_category_id_position_idx").on(t.categoryId, t.position)],
);

/** A dish or drink, e.g. Hot coffee → "Cappuccino". */
export const menuItems = pgTable.withRLS(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subcategoryId: uuid("subcategory_id")
      .notNull()
      .references(() => menuSubcategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** In the property's currency. String mode keeps decimals exact. */
    price: numeric("price", { precision: 12, scale: 2, mode: "string" }).notNull(),
    dietary: dietaryType("dietary"),
    /** Optional photo from the property's media library; cleared if the image is deleted. */
    imageId: uuid("image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    isAvailable: boolean("is_available").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("menu_items_subcategory_id_position_idx").on(t.subcategoryId, t.position),
    // Covers the image_id foreign key (ON DELETE SET NULL scans it).
    index("menu_items_image_id_idx").on(t.imageId),
    check("menu_items_price_non_negative", sql`${t.price} >= 0`),
  ],
);

/**
 * A generated QR code pointing at a menu. A property can print several per
 * menu (one per table, the entrance, a flyer…), each with its own label.
 *
 * The code encodes `targetUrl` (/q/<code>), which redirects to the menu, so the
 * printed code keeps working if the menu's link changes and scans are counted.
 * The rendered SVG is stored so the exact printed artwork can be re-downloaded.
 */
export const qrCodes = pgTable.withRLS(
  "qr_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    /** Short, URL-safe and unguessable: the path segment in /q/<code>. */
    code: text("code").notNull().unique(),
    label: text("label").notNull(),
    targetUrl: text("target_url").notNull(),
    color: text("color").notNull().default("#000000"),
    svg: text("svg").notNull(),
    scanCount: integer("scan_count").notNull().default(0),
    lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("qr_codes_property_id_created_at_idx").on(t.propertyId, t.createdAt.desc()),
    index("qr_codes_menu_id_idx").on(t.menuId),
    index("qr_codes_created_by_idx").on(t.createdBy),
    check("qr_codes_scan_count_non_negative", sql`${t.scanCount} >= 0`),
  ],
);

export type Menu = typeof menus.$inferSelect;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuSubcategory = typeof menuSubcategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type { DietaryType } from "@/lib/menus/constants";
