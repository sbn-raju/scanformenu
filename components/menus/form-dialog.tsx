"use client";

import { useActionState, useEffect, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { initialFormState, type FormState } from "@/lib/forms";

type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export type FieldHelpers = {
  errors: Record<string, string[] | undefined>;
  /** The last submitted value, else the default — so input survives a failed submit. */
  value: (name: string, fallback?: string | null) => string;
  /** True after a failed submit, when `value` returns what was sent. */
  submitted: boolean;
};

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  action: FormAction;
  submitLabel: string;
  /** Sent with the form but not shown, e.g. the id being edited. */
  hidden?: Record<string, string>;
  className?: string;
  children: (helpers: FieldHelpers) => ReactNode;
};

/**
 * A dialog wrapping a Server Action form. Controlled, so it can be opened from
 * a dropdown item. The form mounts fresh each time the dialog opens, and the
 * dialog closes itself once the action succeeds.
 */
export function FormDialog({ open, onOpenChange, className, ...formProps }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className ?? "sm:max-w-lg"}>
        {open && <DialogForm {...formProps} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogForm({
  title,
  description,
  action,
  submitLabel,
  hidden,
  children,
  onDone,
}: Omit<FormDialogProps, "open" | "onOpenChange" | "className"> & { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, initialFormState);

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.message) toast.add({ title: state.message, type: "success" });
    onDone();
    // onDone is a fresh closure each render; only react to a new result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const helpers: FieldHelpers = {
    errors: state.fieldErrors ?? {},
    value: (name, fallback) => state.values?.[name] ?? fallback ?? "",
    submitted: state.values !== undefined,
  };

  return (
    <form action={formAction} className="contents">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <fieldset disabled={pending} className="contents">
        <FieldGroup className="gap-5">{children(helpers)}</FieldGroup>
      </fieldset>

      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
