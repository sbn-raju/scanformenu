import type { z } from "zod";

/** What a form Server Action returns to `useActionState`. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** The submitted values, so the form keeps them after React resets it. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

/** String fields of a FormData, minus React's internal `$ACTION_` keys. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$ACTION_")) values[key] = value;
  }
  return values;
}

export function validationError(error: z.ZodError, values: Record<string, string>): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values };
}
