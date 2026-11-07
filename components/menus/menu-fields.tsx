"use client";

import { SelectField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import type { FieldHelpers } from "@/components/menus/form-dialog";
import { DESCRIPTION_MAX, DIETARY_LABELS, DIETARY_TYPES, NAME_MAX } from "@/lib/menus/constants";

/** Switches submit nothing when off, so after a failed submit a missing value means "off". */
function checked({ value, submitted }: FieldHelpers, name: string, fallback: boolean) {
  return submitted ? value(name) === "on" : fallback;
}

export type MenuDefaults = { name: string; description: string | null; isActive: boolean };

export function MenuFields({
  helpers,
  defaults,
}: {
  helpers: FieldHelpers;
  defaults?: MenuDefaults;
}) {
  const { errors, value } = helpers;
  return (
    <>
      <TextField
        name="name"
        label="Menu name"
        placeholder="e.g. Chef's special, Breakfast, Weekend brunch"
        maxLength={NAME_MAX}
        defaultValue={value("name", defaults?.name)}
        errors={errors.name}
        autoFocus
      />
      <TextareaField
        name="description"
        label="Description"
        optional
        rows={3}
        maxLength={DESCRIPTION_MAX}
        placeholder="Shown to guests at the top of the menu."
        defaultValue={value("description", defaults?.description)}
        errors={errors.description}
      />
      <SwitchField
        name="isActive"
        label="Live for guests"
        description="When off, the menu and its QR codes show “not available”."
        defaultChecked={checked(helpers, "isActive", defaults?.isActive ?? true)}
      />
    </>
  );
}

export type SectionDefaults = { name: string; description: string | null };

export function SectionFields({
  helpers,
  defaults,
  kind,
}: {
  helpers: FieldHelpers;
  defaults?: SectionDefaults;
  kind: "category" | "subcategory";
}) {
  const { errors, value } = helpers;
  return (
    <>
      <TextField
        name="name"
        label={kind === "category" ? "Category name" : "Sub-category name"}
        placeholder={kind === "category" ? "e.g. Beverages, Starters, Mains" : "e.g. Hot coffee, Fresh juices"}
        maxLength={NAME_MAX}
        defaultValue={value("name", defaults?.name)}
        errors={errors.name}
        autoFocus
      />
      <TextareaField
        name="description"
        label="Description"
        optional
        rows={2}
        maxLength={DESCRIPTION_MAX}
        defaultValue={value("description", defaults?.description)}
        errors={errors.description}
      />
    </>
  );
}

export type ItemDefaults = {
  name: string;
  description: string | null;
  price: string;
  dietary: string | null;
  imageId: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

export type ImageOption = { value: string; label: string };

const dietaryOptions = [
  { value: "none", label: "Not specified" },
  ...DIETARY_TYPES.map((value) => ({ value, label: DIETARY_LABELS[value] })),
];

export function ItemFields({
  helpers,
  defaults,
  currency,
  images,
}: {
  helpers: FieldHelpers;
  defaults?: ItemDefaults;
  currency: string;
  images: ImageOption[];
}) {
  const { errors, value } = helpers;
  const imageOptions = [{ value: "none", label: "No image" }, ...images];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        name="name"
        label="Item name"
        placeholder="e.g. Cappuccino"
        maxLength={NAME_MAX}
        defaultValue={value("name", defaults?.name)}
        errors={errors.name}
        className="sm:col-span-2"
        autoFocus
      />
      <TextareaField
        name="description"
        label="Description"
        optional
        rows={2}
        maxLength={DESCRIPTION_MAX}
        placeholder="Ingredients, portion size, allergens…"
        defaultValue={value("description", defaults?.description)}
        errors={errors.description}
        className="sm:col-span-2"
      />
      <TextField
        name="price"
        label={`Price (${currency})`}
        inputMode="decimal"
        placeholder="0.00"
        defaultValue={value("price", defaults?.price)}
        errors={errors.price}
      />
      <SelectField
        name="dietary"
        label="Diet"
        optional
        options={dietaryOptions}
        defaultValue={value("dietary", defaults?.dietary ?? "none") || "none"}
        errors={errors.dietary}
      />
      <SelectField
        name="imageId"
        label="Photo"
        optional
        options={imageOptions}
        defaultValue={value("imageId", defaults?.imageId ?? "none") || "none"}
        errors={errors.imageId}
        description={images.length === 0 ? "Upload photos in the Media library to use them here." : undefined}
        className="sm:col-span-2"
      />
      <SwitchField
        name="isAvailable"
        label="Available"
        description="Turn off when it's sold out."
        defaultChecked={checked(helpers, "isAvailable", defaults?.isAvailable ?? true)}
        className="sm:col-span-2"
      />
      <SwitchField
        name="isFeatured"
        label="Featured"
        description="Highlighted as a chef's pick."
        defaultChecked={checked(helpers, "isFeatured", defaults?.isFeatured ?? false)}
        className="sm:col-span-2"
      />
    </div>
  );
}
