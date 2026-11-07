"use client";

import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";

type VerificationCodeFormProps = {
  sentTo: string;
  isSubmitting: boolean;
  codeError?: string | null;
  formError?: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
};

/** Second step shared by sign-in and sign-up: enter the code emailed to the user. */
export function VerificationCodeForm({
  sentTo,
  isSubmitting,
  codeError,
  formError,
  onVerify,
  onResend,
}: VerificationCodeFormProps) {
  const [code, setCode] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onVerify(code.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        We sent a verification code to <span className="font-medium text-foreground">{sentTo}</span>.
      </p>

      <FormField
        id="code"
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
        value={code}
        onChange={(event) => setCode(event.target.value)}
        error={codeError}
      />

      <FormError message={formError} />

      <Button type="submit" size="lg" disabled={isSubmitting || !code}>
        {isSubmitting ? "Verifying…" : "Verify"}
      </Button>
      <Button type="button" variant="ghost" onClick={onResend} disabled={isSubmitting}>
        Resend code
      </Button>
    </form>
  );
}
