"use client";

import { useActionState } from "react";

import { TextField, useFormStateToast } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState, type FormState } from "@/lib/forms";
import { updateProfileAction } from "@/lib/users/actions";

export function ProfileForm({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    initialFormState,
  );
  useFormStateToast(state);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="contents">
      <CardContent>
        <FieldGroup className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="firstName"
            label="First name"
            autoComplete="given-name"
            defaultValue={state.values?.firstName ?? firstName ?? ""}
            errors={errors.firstName}
          />
          <TextField
            name="lastName"
            label="Last name"
            optional
            autoComplete="family-name"
            defaultValue={state.values?.lastName ?? lastName ?? ""}
            errors={errors.lastName}
          />
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Save
        </Button>
      </CardFooter>
    </form>
  );
}
