import "server-only";

import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import { cache } from "react";

import { cached, cacheKeys, invalidate, TTL } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  mediaAssets,
  menuCategories,
  menuItems,
  menus,
  menuSubcategories,
  properties,
  qrCodes,
  type Menu,
  type MenuCategory,
  type MenuItem,
  type MenuSubcategory,
} from "@/lib/db/schema";
import type { ItemInput, MenuInput, SectionInput } from "@/lib/menus/validation";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } })?.cause ?? error;
  return (cause as { code?: string })?.code === UNIQUE_VIOLATION;
}

function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `${base || "menu"}-${suffix}`;
}

export type Direction = "up" | "down";

/** Sibling ids after moving `id` one step, or null if it can't move. */
function reorder(ids: string[], id: string, direction: Direction): string[] | null {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ─── Cache invalidation ─────────────────────────────────────────────────────

/** Drops one menu's cached tree and guest page, and the property's menu list. */
export async function invalidateMenu(propertyId: string, menuId: string, slug: string): Promise<void> {
  await invalidate(cacheKeys.menuTree(menuId), cacheKeys.publicMenu(slug), cacheKeys.menuList(propertyId));
}

/** Drops the cache for every menu of a property, e.g. after its details or images change. */
export async function invalidatePropertyMenus(propertyId: string): Promise<void> {
  const rows = await db
    .select({ id: menus.id, slug: menus.slug })
    .from(menus)
    .where(eq(menus.propertyId, propertyId));
  await invalidate(
    cacheKeys.menuList(propertyId),
    ...rows.flatMap((row) => [cacheKeys.menuTree(row.id), cacheKeys.publicMenu(row.slug)]),
  );
}

// ─── Menus ──────────────────────────────────────────────────────────────────

export type MenuSummary = Menu & {
  categoryCount: number;
  itemCount: number;
  qrCodeCount: number;
};

/** The property's menus, oldest first, with how much is in each. */
export async function listMenusForProperty(propertyId: string): Promise<MenuSummary[]> {
  return cached(cacheKeys.menuList(propertyId), { ttl: TTL.tenMinutes }, () =>
    loadMenusForProperty(propertyId),
  );
}

async function loadMenusForProperty(propertyId: string): Promise<MenuSummary[]> {
  const rows = await db
    .select({
      menu: menus,
      categoryCount: sql<number>`(
        select count(*) from ${menuCategories} where ${menuCategories.menuId} = ${menus.id}
      )`.mapWith(Number),
      itemCount: sql<number>`(
        select count(*) from ${menuItems}
        join ${menuSubcategories} on ${menuSubcategories.id} = ${menuItems.subcategoryId}
        join ${menuCategories} on ${menuCategories.id} = ${menuSubcategories.categoryId}
        where ${menuCategories.menuId} = ${menus.id}
      )`.mapWith(Number),
      qrCodeCount: sql<number>`(
        select count(*) from ${qrCodes} where ${qrCodes.menuId} = ${menus.id}
      )`.mapWith(Number),
    })
    .from(menus)
    .where(eq(menus.propertyId, propertyId))
    .orderBy(asc(menus.createdAt), asc(menus.id));

  return rows.map(({ menu, ...counts }) => ({ ...menu, ...counts }));
}

/** A menu, only if it belongs to the property. */
export async function getMenu(propertyId: string, menuId: string): Promise<Menu | null> {
  const [row] = await db
    .select()
    .from(menus)
    .where(and(eq(menus.id, menuId), eq(menus.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

export async function createMenu(propertyId: string, createdBy: string, input: MenuInput): Promise<Menu> {
  // The random slug suffix makes collisions very unlikely; retry just in case.
  for (let attempt = 0; ; attempt++) {
    try {
      const [row] = await db
        .insert(menus)
        .values({ ...input, propertyId, createdBy, slug: slugify(input.name) })
        .returning();
      await invalidate(cacheKeys.menuList(propertyId));
      return row;
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }
}

export async function updateMenu(propertyId: string, menuId: string, input: MenuInput): Promise<boolean> {
  const rows = await db
    .update(menus)
    .set(input)
    .where(and(eq(menus.id, menuId), eq(menus.propertyId, propertyId)))
    .returning({ id: menus.id, slug: menus.slug });
  if (rows.length === 0) return false;
  await invalidateMenu(propertyId, menuId, rows[0].slug);
  return true;
}

export async function setMenuActive(propertyId: string, menuId: string, isActive: boolean): Promise<boolean> {
  const rows = await db
    .update(menus)
    .set({ isActive })
    .where(and(eq(menus.id, menuId), eq(menus.propertyId, propertyId)))
    .returning({ id: menus.id, slug: menus.slug });
  if (rows.length === 0) return false;
  await invalidateMenu(propertyId, menuId, rows[0].slug);
  return true;
}

/** Categories, sub-categories, items and QR codes go with it (ON DELETE CASCADE). */
export async function deleteMenu(propertyId: string, menuId: string): Promise<boolean> {
  // Read the codes first: the cascade takes them with the menu.
  const codes = await db
    .select({ code: qrCodes.code })
    .from(qrCodes)
    .where(and(eq(qrCodes.menuId, menuId), eq(qrCodes.propertyId, propertyId)));
  const rows = await db
    .delete(menus)
    .where(and(eq(menus.id, menuId), eq(menus.propertyId, propertyId)))
    .returning({ id: menus.id, slug: menus.slug });
  if (rows.length === 0) return false;
  await Promise.all([
    invalidateMenu(propertyId, menuId, rows[0].slug),
    invalidate(...codes.map(({ code }) => cacheKeys.qrTarget(code))),
  ]);
  return true;
}

// ─── The full tree ─────────────────────────────────────────────────────────

export type MenuItemWithImage = MenuItem & {
  image: { filePath: string; title: string } | null;
};
export type SubcategoryWithItems = MenuSubcategory & { items: MenuItemWithImage[] };
export type CategoryWithChildren = MenuCategory & { subcategories: SubcategoryWithItems[] };

/** Everything in a menu, in display order. The caller must have checked the menu's property. */
export async function getMenuTree(menuId: string): Promise<CategoryWithChildren[]> {
  return cached(cacheKeys.menuTree(menuId), { ttl: TTL.hour }, () => loadMenuTree(menuId));
}

async function loadMenuTree(menuId: string): Promise<CategoryWithChildren[]> {
  const categories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.menuId, menuId))
    .orderBy(asc(menuCategories.position), asc(menuCategories.createdAt));
  if (categories.length === 0) return [];

  const subcategories = await db
    .select()
    .from(menuSubcategories)
    .where(
      inArray(
        menuSubcategories.categoryId,
        categories.map((c) => c.id),
      ),
    )
    .orderBy(asc(menuSubcategories.position), asc(menuSubcategories.createdAt));

  const items =
    subcategories.length === 0
      ? []
      : await db
          .select({
            item: menuItems,
            image: { filePath: mediaAssets.filePath, title: mediaAssets.title },
          })
          .from(menuItems)
          .leftJoin(mediaAssets, eq(mediaAssets.id, menuItems.imageId))
          .where(
            inArray(
              menuItems.subcategoryId,
              subcategories.map((s) => s.id),
            ),
          )
          .orderBy(asc(menuItems.position), asc(menuItems.createdAt));

  const itemsBySub = new Map<string, MenuItemWithImage[]>();
  for (const { item, image } of items) {
    const list = itemsBySub.get(item.subcategoryId) ?? [];
    list.push({ ...item, image });
    itemsBySub.set(item.subcategoryId, list);
  }

  const subsByCategory = new Map<string, SubcategoryWithItems[]>();
  for (const sub of subcategories) {
    const list = subsByCategory.get(sub.categoryId) ?? [];
    list.push({ ...sub, items: itemsBySub.get(sub.id) ?? [] });
    subsByCategory.set(sub.categoryId, list);
  }

  return categories.map((category) => ({
    ...category,
    subcategories: subsByCategory.get(category.id) ?? [],
  }));
}

// ─── Ownership checks ─────────────────────────────────────────────────────
// Each returns the row's parent ids only when it sits in a menu of this property.

async function findCategory(propertyId: string, categoryId: string) {
  const [row] = await db
    .select({ id: menuCategories.id, menuId: menuCategories.menuId, slug: menus.slug })
    .from(menuCategories)
    .innerJoin(menus, eq(menus.id, menuCategories.menuId))
    .where(and(eq(menuCategories.id, categoryId), eq(menus.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

async function findSubcategory(propertyId: string, subcategoryId: string) {
  const [row] = await db
    .select({
      id: menuSubcategories.id,
      categoryId: menuSubcategories.categoryId,
      menuId: menuCategories.menuId,
      slug: menus.slug,
    })
    .from(menuSubcategories)
    .innerJoin(menuCategories, eq(menuCategories.id, menuSubcategories.categoryId))
    .innerJoin(menus, eq(menus.id, menuCategories.menuId))
    .where(and(eq(menuSubcategories.id, subcategoryId), eq(menus.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

async function findItem(propertyId: string, itemId: string) {
  const [row] = await db
    .select({
      id: menuItems.id,
      subcategoryId: menuItems.subcategoryId,
      menuId: menuCategories.menuId,
      slug: menus.slug,
    })
    .from(menuItems)
    .innerJoin(menuSubcategories, eq(menuSubcategories.id, menuItems.subcategoryId))
    .innerJoin(menuCategories, eq(menuCategories.id, menuSubcategories.categoryId))
    .innerJoin(menus, eq(menus.id, menuCategories.menuId))
    .where(and(eq(menuItems.id, itemId), eq(menus.propertyId, propertyId)))
    .limit(1);
  return row ?? null;
}

/** True if the image is in this property's media library (items may only use those). */
async function isPropertyImage(propertyId: string, imageId: string | null): Promise<boolean> {
  if (!imageId) return true;
  const [row] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, imageId), eq(mediaAssets.propertyId, propertyId)))
    .limit(1);
  return Boolean(row);
}

// ─── Categories ───────────────────────────────────────────────────────────

export async function createCategory(propertyId: string, menuId: string, input: SectionInput) {
  const menu = await getMenu(propertyId, menuId);
  if (!menu) return null;
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(${max(menuCategories.position)} + 1, 0)`.mapWith(Number) })
    .from(menuCategories)
    .where(eq(menuCategories.menuId, menuId));
  const [row] = await db.insert(menuCategories).values({ ...input, menuId, position: next }).returning();
  await invalidateMenu(propertyId, menu.id, menu.slug);
  return row;
}

export async function updateCategory(propertyId: string, categoryId: string, input: SectionInput) {
  const found = await findCategory(propertyId, categoryId);
  if (!found) return false;
  await db.update(menuCategories).set(input).where(eq(menuCategories.id, categoryId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function deleteCategory(propertyId: string, categoryId: string) {
  const found = await findCategory(propertyId, categoryId);
  if (!found) return false;
  await db.delete(menuCategories).where(eq(menuCategories.id, categoryId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function moveCategory(propertyId: string, categoryId: string, direction: Direction) {
  const found = await findCategory(propertyId, categoryId);
  if (!found) return false;
  await db.transaction(async (tx) => {
    const siblings = await tx
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.menuId, found.menuId))
      .orderBy(asc(menuCategories.position), asc(menuCategories.createdAt));
    const order = reorder(siblings.map((s) => s.id), categoryId, direction);
    if (!order) return;
    for (const [position, id] of order.entries()) {
      await tx.update(menuCategories).set({ position }).where(eq(menuCategories.id, id));
    }
  });
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

// ─── Sub-categories ───────────────────────────────────────────────────────

export async function createSubcategory(propertyId: string, categoryId: string, input: SectionInput) {
  const found = await findCategory(propertyId, categoryId);
  if (!found) return null;
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(${max(menuSubcategories.position)} + 1, 0)`.mapWith(Number) })
    .from(menuSubcategories)
    .where(eq(menuSubcategories.categoryId, categoryId));
  const [row] = await db
    .insert(menuSubcategories)
    .values({ ...input, categoryId, position: next })
    .returning();
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return row;
}

export async function updateSubcategory(propertyId: string, subcategoryId: string, input: SectionInput) {
  const found = await findSubcategory(propertyId, subcategoryId);
  if (!found) return false;
  await db.update(menuSubcategories).set(input).where(eq(menuSubcategories.id, subcategoryId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function deleteSubcategory(propertyId: string, subcategoryId: string) {
  const found = await findSubcategory(propertyId, subcategoryId);
  if (!found) return false;
  await db.delete(menuSubcategories).where(eq(menuSubcategories.id, subcategoryId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function moveSubcategory(propertyId: string, subcategoryId: string, direction: Direction) {
  const found = await findSubcategory(propertyId, subcategoryId);
  if (!found) return false;
  await db.transaction(async (tx) => {
    const siblings = await tx
      .select({ id: menuSubcategories.id })
      .from(menuSubcategories)
      .where(eq(menuSubcategories.categoryId, found.categoryId))
      .orderBy(asc(menuSubcategories.position), asc(menuSubcategories.createdAt));
    const order = reorder(siblings.map((s) => s.id), subcategoryId, direction);
    if (!order) return;
    for (const [position, id] of order.entries()) {
      await tx.update(menuSubcategories).set({ position }).where(eq(menuSubcategories.id, id));
    }
  });
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

// ─── Items ────────────────────────────────────────────────────────────────

export type ItemWriteResult = "ok" | "not_found" | "bad_image";

export async function createItem(
  propertyId: string,
  subcategoryId: string,
  input: ItemInput,
): Promise<ItemWriteResult> {
  const found = await findSubcategory(propertyId, subcategoryId);
  if (!found) return "not_found";
  if (!(await isPropertyImage(propertyId, input.imageId))) return "bad_image";
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(${max(menuItems.position)} + 1, 0)`.mapWith(Number) })
    .from(menuItems)
    .where(eq(menuItems.subcategoryId, subcategoryId));
  await db.insert(menuItems).values({ ...input, subcategoryId, position: next });
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return "ok";
}

export async function updateItem(
  propertyId: string,
  itemId: string,
  input: ItemInput,
): Promise<ItemWriteResult> {
  const found = await findItem(propertyId, itemId);
  if (!found) return "not_found";
  if (!(await isPropertyImage(propertyId, input.imageId))) return "bad_image";
  await db.update(menuItems).set(input).where(eq(menuItems.id, itemId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return "ok";
}

export async function setItemAvailability(propertyId: string, itemId: string, isAvailable: boolean) {
  const found = await findItem(propertyId, itemId);
  if (!found) return false;
  await db.update(menuItems).set({ isAvailable }).where(eq(menuItems.id, itemId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function deleteItem(propertyId: string, itemId: string) {
  const found = await findItem(propertyId, itemId);
  if (!found) return false;
  await db.delete(menuItems).where(eq(menuItems.id, itemId));
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

export async function moveItem(propertyId: string, itemId: string, direction: Direction) {
  const found = await findItem(propertyId, itemId);
  if (!found) return false;
  await db.transaction(async (tx) => {
    const siblings = await tx
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.subcategoryId, found.subcategoryId))
      .orderBy(asc(menuItems.position), asc(menuItems.createdAt));
    const order = reorder(siblings.map((s) => s.id), itemId, direction);
    if (!order) return;
    for (const [position, id] of order.entries()) {
      await tx.update(menuItems).set({ position }).where(eq(menuItems.id, id));
    }
  });
  await invalidateMenu(propertyId, found.menuId, found.slug);
  return true;
}

// ─── Public menu ──────────────────────────────────────────────────────────

export type PublicMenu = {
  menu: Menu;
  property: {
    name: string;
    description: string | null;
    currency: string;
    city: string;
    country: string;
    phone: string | null;
    website: string | null;
  };
  categories: CategoryWithChildren[];
};

/**
 * What a guest sees at /m/<slug>. Null if the menu doesn't exist or is switched off.
 * The hottest read in the app, so the whole page is one cache entry; React's
 * `cache` lets the page and its metadata share one lookup per request.
 */
export const getPublicMenu = cache(
  (slug: string): Promise<PublicMenu | null> =>
    cached(cacheKeys.publicMenu(slug), { ttl: TTL.hour, nullTtl: TTL.minute }, () => loadPublicMenu(slug)),
);

async function loadPublicMenu(slug: string): Promise<PublicMenu | null> {
  const [row] = await db
    .select({
      menu: menus,
      property: {
        name: properties.name,
        description: properties.description,
        currency: properties.currency,
        city: properties.city,
        country: properties.country,
        phone: properties.phone,
        website: properties.website,
      },
    })
    .from(menus)
    .innerJoin(properties, eq(properties.id, menus.propertyId))
    .where(and(eq(menus.slug, slug), eq(menus.isActive, true)))
    .limit(1);
  if (!row) return null;
  return { ...row, categories: await loadMenuTree(row.menu.id) };
}
