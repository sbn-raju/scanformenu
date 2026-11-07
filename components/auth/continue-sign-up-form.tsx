"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompleteAuth } from "@/hooks/use-complete-auth";
import { routes } from "@/lib/routes";

/**
 * Shown after a Google sign-up when Clerk still needs fields Google
 * doesn't provide — in this app, a username.
 */
export function ContinueSignUpForm() {
  const { isLoaded } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const completeAuth = useCompleteAuth();

  const [username, setUsername] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message ?? null;

  if (!isLoaded) {
    return <p className="text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (signUp.status !== "missing_requirements") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nothing to continue</CardTitle>
          <CardDescription>Your sign-up session has expired or was already completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={routes.signUp} className="text-sm font-medium underline underline-offset-4">
            Back to sign up
          </Link>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { error } = await signUp.update({ username });
    if (error) return;

    if (signUp.status === "complete") {
      setFormError(await completeAuth((params) => signUp.finalize(params)));
    } else {
      setFormError(`Still missing: ${signUp.missingFields.join(", ")}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Almost there</CardTitle>
        <CardDescription>Choose a username to finish creating your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {signUp.emailAddress && (
            <p className="text-sm text-muted-foreground">
              Signing up as <span className="font-medium text-foreground">{signUp.emailAddress}</span>
            </p>
          )}
          <FormField
            id="username"
            label="Username"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={errors.fields.username?.message}
          />

          <FormError message={formError ?? globalError} />

          <Button type="submit" size="lg" disabled={isSubmitting || !username}>
            {isSubmitting ? "Creating account…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
