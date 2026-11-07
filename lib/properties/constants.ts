/**
 * Property options shared by the DB schema, server validation and client forms.
 * No server-only imports here — client components import this file.
 */

export const PROPERTY_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "hotel",
  "resort",
  "bakery",
  "cloud_kitchen",
  "food_court",
  "other",
] as const;

export const PROPERTY_SCALES = ["small", "medium", "large", "enterprise"] as const;

export const MEMBER_ROLES = ["owner", "manager", "staff"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyScale = (typeof PROPERTY_SCALES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  bar: "Bar / Pub",
  hotel: "Hotel",
  resort: "Resort",
  bakery: "Bakery",
  cloud_kitchen: "Cloud kitchen",
  food_court: "Food court",
  other: "Other",
};

export const PROPERTY_SCALE_LABELS: Record<PropertyScale, string> = {
  small: "Small · up to 30 seats",
  medium: "Medium · 30–100 seats",
  large: "Large · 100–300 seats",
  enterprise: "Enterprise · 300+ seats or multiple outlets",
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

/** What each role can do, shown when adding a member or changing their role. */
export const MEMBER_ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "Full access, including team management and deleting the property.",
  manager: "Edits menus, media, QR codes and property details.",
  staff: "Views menus, media and QR codes. Can't make changes.",
};

/** Only owners add, remove or change the role of other members. */
export function canManageTeam(role: MemberRole): boolean {
  return role === "owner";
}

/** Property types that have guest rooms, so we ask for a room count. */
export const LODGING_TYPES: readonly PropertyType[] = ["hotel", "resort"];

export const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "MYR", label: "Malaysian Ringgit (MYR)" },
  { code: "THB", label: "Thai Baht (THB)" },
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CNY", label: "Chinese Yuan (CNY)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
  { code: "NZD", label: "New Zealand Dollar (NZD)" },
] as const;

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [string, ...string[]];

/** Every IANA time zone the runtime knows, e.g. "Asia/Kolkata". */
export function listTimeZones(): string[] {
  return Intl.supportedValuesOf("timeZone");
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
