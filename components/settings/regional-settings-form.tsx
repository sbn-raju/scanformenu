"use client";

import { useActionState } from "react";

import { SelectField, useFormStateToast } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState, type FormState } from "@/lib/forms";
import { updateRegionalSettingsAction } from "@/lib/properties/actions";
import { CURRENCIES, listTimeZones } from "@/lib/properties/constants";

const currencyOptions = CURRENCIES.map(({ code, label }) => ({ value: code, label }));

export function RegionalSettingsForm({
  currency,
  timezone,
  disabled,
}: {
  currency: string;
  timezone: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateRegionalSettingsAction,
    initialFormState,
  );
  useFormStateToast(state);
  const errors = state.fieldErrors ?? {};
  const timeZoneOptions = listTimeZones().map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }));

  return (
    <form action={formAction} className="contents">
      <CardContent>
        <fieldset disabled={disabled || pending} className="contents">
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="currency"
              label="Currency"
              description="Used for menu prices."
              options={currencyOptions}
              defaultValue={currency}
              errors={errors.currency}
            />
            <SelectField
              name="timezone"
              label="Time zone"
              description="Used for opening hours and reports."
              options={timeZoneOptions}
              defaultValue={timezone}
              errors={errors.timezone}
            />
          </FieldGroup>
        </fieldset>
      </CardContent>
      {!disabled && (
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Save
          </Button>
        </CardFooter>
      )}
    </form>
  );
}
