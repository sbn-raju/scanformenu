/**
 * Menu options shared by the DB schema, server validation and client forms.
 * No server-only imports here — client components import this file.
 */
import type { MemberRole } from "@/lib/properties/constants";

/** Diet markers shown next to an item. Null means "not specified". */
export const DIETARY_TYPES = ["veg", "non_veg", "vegan", "egg"] as const;
export type DietaryType = (typeof DIETARY_TYPES)[number];

export const DIETARY_LABELS: Record<DietaryType, string> = {
  veg: "Vegetarian",
  non_veg: "Non-vegetarian",
  vegan: "Vegan",
  egg: "Contains egg",
};

export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 1000;
export const QR_LABEL_MAX = 60;

/** Largest price accepted (fits numeric(12, 2)). */
export const PRICE_MAX = 9_999_999_999.99;

/** Who can create and edit menus and QR codes. Every member can view them. */
export const MENU_EDITOR_ROLES: readonly MemberRole[] = ["owner", "manager"];

export function canManageMenus(role: MemberRole): boolean {
  return MENU_EDITOR_ROLES.includes(role);
}

/** QR colors the owner can pick from. Dark-on-light keeps codes scannable. */
export const QR_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#1e3a8a", label: "Navy" },
  { value: "#14532d", label: "Forest green" },
  { value: "#7f1d1d", label: "Maroon" },
  { value: "#4c1d95", label: "Purple" },
  { value: "#78350f", label: "Brown" },
] as const;
export const QR_COLOR_VALUES = QR_COLORS.map((c) => c.value) as [string, ...string[]];

/** Formats a stored price (numeric string) in the property's currency. */
export function formatPrice(price: string | number, currency: string): string {
  const value = typeof price === "string" ? Number(price) : price;
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
