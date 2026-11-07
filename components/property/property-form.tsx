"use client";

import { useActionState, useState, useSyncExternalStore, type ReactNode } from "react";

import { SelectField, TextareaField, TextField, useFormStateToast } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { Property } from "@/lib/db/schema";
import { initialFormState, type FormState } from "@/lib/forms";
import { createPropertyAction, updatePropertyAction } from "@/lib/properties/actions";
import {
  CURRENCIES,
  LODGING_TYPES,
  listTimeZones,
  PROPERTY_SCALE_LABELS,
  PROPERTY_SCALES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  type PropertyType,
} from "@/lib/properties/constants";

const typeOptions = PROPERTY_TYPES.map((value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }));
const scaleOptions = PROPERTY_SCALES.map((value) => ({ value, label: PROPERTY_SCALE_LABELS[value] }));
const currencyOptions = CURRENCIES.map(({ code, label }) => ({ value: code, label }));

const noopSubscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

type Defaults = Partial<Property>;

type PropertyFormProps =
  | { mode: "create"; defaults?: Defaults; readOnly?: never }
  | { mode: "edit"; defaults: Defaults; readOnly?: boolean };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">{children}</FieldGroup>
      </CardContent>
    </Card>
  );
}

export function PropertyForm({ mode, defaults = {}, readOnly = false }: PropertyFormProps) {
  const action = mode === "create" ? createPropertyAction : updatePropertyAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, initialFormState);
  useFormStateToast(state);

  const [type, setType] = useState<PropertyType | null>(
    (state.values?.type as PropertyType) ?? (defaults.type as PropertyType) ?? null,
  );

  // Pre-select the browser's time zone; render "UTC" on the server to avoid a mismatch.
  const detectedTimeZone = useSyncExternalStore(noopSubscribe, browserTimeZone, () => "UTC");
  const [timeZone, setTimeZone] = useState<string | null>(null);

  const errors = state.fieldErrors ?? {};
  /** Last submitted value wins, so the form keeps input after a failed submit. */
  const value = (name: keyof Property) => state.values?.[name] ?? defaults[name]?.toString() ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const isLodging = type !== null && LODGING_TYPES.includes(type);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset disabled={readOnly || pending} className="contents">
        <Section title="Basics" description="How guests will see your property.">
          <TextField
            name="name"
            label="Property name"
            placeholder="The Grand Café"
            defaultValue={value("name")}
            errors={errors.name}
            autoFocus={mode === "create"}
          />
          <SelectField
            name="type"
            label="Property type"
            placeholder="Choose a type"
            options={typeOptions}
            value={type}
            onValueChange={(next) => setType(next as PropertyType | null)}
            errors={errors.type}
          />
          <TextareaField
            name="description"
            label="Short description"
            optional
            placeholder="Wood-fired pizzas and coffee in the heart of the old town."
            defaultValue={value("description")}
            errors={errors.description}
            className="sm:col-span-2"
          />
        </Section>

        <Section title="Ownership" description="Who owns the property and its legal details.">
          <TextField
            name="ownerName"
            label="Owner's full name"
            autoComplete="name"
            defaultValue={value("ownerName")}
            errors={errors.ownerName}
          />
          <TextField
            name="establishedOn"
            label="Operating since"
            optional
            type="date"
            max={today}
            defaultValue={value("establishedOn")}
            errors={errors.establishedOn}
            description="When the property opened or came under your ownership."
          />
          <TextField
            name="legalName"
            label="Registered business name"
            optional
            autoComplete="organization"
            defaultValue={value("legalName")}
            errors={errors.legalName}
          />
          <TextField
            name="taxId"
            label="Tax / GST / VAT number"
            optional
            defaultValue={value("taxId")}
            errors={errors.taxId}
          />
        </Section>

        <Section title="Size & capacity" description="Helps us tailor menus, tables and QR codes to your scale.">
          <SelectField
            name="scale"
            label="Property size"
            placeholder="Choose a size"
            options={scaleOptions}
            defaultValue={value("scale") || null}
            errors={errors.scale}
            className="sm:col-span-2"
          />
          <TextField
            name="seatingCapacity"
            label="Seating capacity"
            optional
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={value("seatingCapacity")}
            errors={errors.seatingCapacity}
          />
          {isLodging && (
            <TextField
              name="roomCount"
              label="Guest rooms"
              optional
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={value("roomCount")}
              errors={errors.roomCount}
            />
          )}
          <TextField
            name="floorCount"
            label="Floors"
            optional
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={value("floorCount")}
            errors={errors.floorCount}
          />
          <TextField
            name="staffCount"
            label="Staff members"
            optional
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={value("staffCount")}
            errors={errors.staffCount}
          />
          <TextField
            name="areaSqFt"
            label="Total area (sq ft)"
            optional
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={value("areaSqFt")}
            errors={errors.areaSqFt}
          />
        </Section>

        <Section title="Location" description="The property's street address.">
          <TextField
            name="addressLine1"
            label="Street address"
            autoComplete="address-line1"
            defaultValue={value("addressLine1")}
            errors={errors.addressLine1}
            className="sm:col-span-2"
          />
          <TextField
            name="addressLine2"
            label="Apartment, suite, landmark"
            optional
            autoComplete="address-line2"
            defaultValue={value("addressLine2")}
            errors={errors.addressLine2}
            className="sm:col-span-2"
          />
          <TextField
            name="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={value("city")}
            errors={errors.city}
          />
          <TextField
            name="state"
            label="State / province"
            optional
            autoComplete="address-level1"
            defaultValue={value("state")}
            errors={errors.state}
          />
          <TextField
            name="postalCode"
            label="Postal code"
            optional
            autoComplete="postal-code"
            defaultValue={value("postalCode")}
            errors={errors.postalCode}
          />
          <TextField
            name="country"
            label="Country"
            autoComplete="country-name"
            defaultValue={value("country")}
            errors={errors.country}
          />
        </Section>

        <Section title="Contact" description="How guests and our team can reach the property.">
          <TextField
            name="email"
            label="Business email"
            optional
            type="email"
            autoComplete="email"
            defaultValue={value("email")}
            errors={errors.email}
          />
          <TextField
            name="phone"
            label="Phone"
            optional
            type="tel"
            autoComplete="tel"
            defaultValue={value("phone")}
            errors={errors.phone}
          />
          <TextField
            name="website"
            label="Website"
            optional
            inputMode="url"
            placeholder="example.com"
            defaultValue={value("website")}
            errors={errors.website}
            className="sm:col-span-2"
          />
        </Section>

        {mode === "create" && (
          <Section title="Regional settings" description="Used for menu prices and opening hours. You can change these later.">
            <SelectField
              name="currency"
              label="Currency"
              placeholder="Choose a currency"
              options={currencyOptions}
              defaultValue={state.values?.currency ?? null}
              errors={errors.currency}
            />
            <SelectField
              name="timezone"
              label="Time zone"
              options={listTimeZones().map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }))}
              value={timeZone ?? state.values?.timezone ?? detectedTimeZone}
              onValueChange={setTimeZone}
              errors={errors.timezone}
            />
          </Section>
        )}
      </fieldset>

      {!readOnly && (
        <div className="flex flex-col gap-3">
          {state.status === "error" && state.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {mode === "create" ? "Create property" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
