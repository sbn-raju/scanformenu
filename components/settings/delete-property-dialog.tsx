"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState, useState } from "react";

import { TextField } from "@/components/forms/fields";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { initialFormState, type FormState } from "@/lib/forms";
import { deletePropertyAction } from "@/lib/properties/actions";

export function DeletePropertyDialog({ propertyName }: { propertyName: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    deletePropertyAction,
    initialFormState,
  );
  const [confirmation, setConfirmation] = useState("");

  return (
    <AlertDialog onOpenChange={(open) => !open && setConfirmation("")}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        Delete property
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} className="contents">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {propertyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the property and everything in it for every member. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <TextField
            name="confirmation"
            label={`Type "${propertyName}" to confirm`}
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            errors={state.fieldErrors?.confirmation}
          />
          {state.status === "error" && state.message && <FieldError>{state.message}</FieldError>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || confirmation.trim() !== propertyName}
            >
              {pending && <Spinner data-icon="inline-start" />}
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
