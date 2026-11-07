import { z } from "zod";

import {
  CURRENCY_CODES,
  isValidTimeZone,
  PROPERTY_SCALES,
  PROPERTY_TYPES,
} from "@/lib/properties/constants";

/** Fields the form didn't send (e.g. hidden for this property type) count as blank. */
const blank = <T extends z.ZodType>(schema: T) => z.preprocess((value) => value ?? "", schema);

/** Empty strings from the form become null. */
const optionalText = (max: number) =>
  blank(
    z
      .string()
      .trim()
      .max(max, { error: `Must be ${max} characters or fewer` })
      .transform((value) => value || null),
  );

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, { error: `${label} is required` })
    .max(max, { error: `Must be ${max} characters or fewer` });

/** A whole number ≥ 0, or null when left blank. */
const optionalCount = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z
    .number({ error: "Enter a number" })
    .int({ error: "Enter a whole number" })
    .min(0, { error: "Can't be negative" })
    .max(10_000_000, { error: "That number looks too large" })
    .nullable(),
);

const optionalEmail = blank(
  z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.email({ error: "Enter a valid email address" }).nullable()),
);

const optionalUrl = blank(
  z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return null;
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    })
    .pipe(z.url({ error: "Enter a valid website address" }).nullable()),
);

const optionalPastDate = blank(
  z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(
      z.iso
        .date({ error: "Enter a valid date" })
        .refine((value) => value <= new Date().toISOString().slice(0, 10), {
          error: "Date can't be in the future",
        })
        .nullable(),
    ),
);

/** Everything on the property profile (create and edit). */
export const propertyDetailsSchema = z.object({
  name: requiredText("Property name", 120).pipe(
    z.string().min(2, { error: "Use at least 2 characters" }),
  ),
  type: z.enum(PROPERTY_TYPES, { error: "Choose a property type" }),
  description: optionalText(1000),

  ownerName: requiredText("Owner name", 120),
  legalName: optionalText(200),
  taxId: optionalText(50),
  establishedOn: optionalPastDate,

  scale: z.enum(PROPERTY_SCALES, { error: "Choose the size of your property" }),
  seatingCapacity: optionalCount,
  roomCount: optionalCount,
  floorCount: optionalCount,
  staffCount: optionalCount,
  areaSqFt: optionalCount,

  email: optionalEmail,
  phone: optionalText(30),
  website: optionalUrl,

  addressLine1: requiredText("Street address", 200),
  addressLine2: optionalText(200),
  city: requiredText("City", 100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: requiredText("Country", 100),
});

/** Currency and time zone, edited from Settings. */
export const regionalSettingsSchema = z.object({
  currency: z.enum(CURRENCY_CODES, { error: "Choose a currency" }),
  timezone: z
    .string({ error: "Choose a time zone" })
    .refine(isValidTimeZone, { error: "Choose a valid time zone" }),
});

export const createPropertySchema = propertyDetailsSchema.extend(regionalSettingsSchema.shape);

export type PropertyDetailsInput = z.infer<typeof propertyDetailsSchema>;
export type RegionalSettingsInput = z.infer<typeof regionalSettingsSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
