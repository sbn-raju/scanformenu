import { z } from "zod";

import {
  DESCRIPTION_MAX,
  DIETARY_TYPES,
  NAME_MAX,
  PRICE_MAX,
  QR_COLOR_VALUES,
  QR_LABEL_MAX,
} from "@/lib/menus/constants";

const name = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, { error: `${label} is required` })
    .max(NAME_MAX, { error: `Must be ${NAME_MAX} characters or fewer` });

/** Empty or missing → null. */
const description = z.preprocess(
  (value) => value ?? "",
  z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, { error: `Must be ${DESCRIPTION_MAX} characters or fewer` })
    .transform((value) => value || null),
);

/** A checkbox or switch: present ("on") when checked, missing when not. */
const checkbox = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

export const uuidSchema = z.uuid({ error: "Invalid reference" });

const optionalUuid = z.preprocess(
  (value) => (value === "" || value == null || value === "none" ? null : value),
  uuidSchema.nullable(),
);

export const menuSchema = z.object({
  name: name("Menu name"),
  description,
  isActive: checkbox,
});

/** Categories and sub-categories share the same fields. */
export const sectionSchema = z.object({
  name: name("Name"),
  description,
});

export const createCategorySchema = sectionSchema.extend({ menuId: uuidSchema });
export const createSubcategorySchema = sectionSchema.extend({ categoryId: uuidSchema });

export const itemSchema = z.object({
  name: name("Item name"),
  description,
  price: z
    .string({ error: "Price is required" })
    .trim()
    .min(1, { error: "Price is required" })
    .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a price like 120 or 4.50" })
    .refine((value) => Number(value) <= PRICE_MAX, { error: "That price looks too large" }),
  dietary: z.preprocess(
    (value) => (value === "" || value == null || value === "none" ? null : value),
    z.enum(DIETARY_TYPES, { error: "Choose a diet type" }).nullable(),
  ),
  imageId: optionalUuid,
  isAvailable: checkbox,
  isFeatured: checkbox,
});

export const createItemSchema = itemSchema.extend({ subcategoryId: uuidSchema });

export const qrCodeSchema = z.object({
  menuId: z.uuid({ error: "Choose a menu" }),
  label: z
    .string({ error: "Label is required" })
    .trim()
    .min(1, { error: "Label is required" })
    .max(QR_LABEL_MAX, { error: `Must be ${QR_LABEL_MAX} characters or fewer` }),
  color: z.enum(QR_COLOR_VALUES, { error: "Choose a color" }).default("#000000"),
});

export type MenuInput = z.infer<typeof menuSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type QrCodeInput = z.infer<typeof qrCodeSchema>;
