"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { FormError } from "@/components/auth/form-error";
import { FormField } from "@/components/auth/form-field";
import { GoogleButton } from "@/components/auth/google-button";
import { VerificationCodeForm } from "@/components/auth/verification-code-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompleteAuth } from "@/hooks/use-complete-auth";
import { routes } from "@/lib/routes";

type Step = "credentials" | "verify";

export function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const completeAuth = useCompleteAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message ?? null;

  async function finish() {
    setFormError(await completeAuth((params) => signIn.finalize(params)));
  }

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { error } = await signIn.password({ identifier, password });
    if (error) return;

    if (signIn.status === "complete") {
      await finish();
      return;
    }

    // New device or second factor: Clerk asks for an emailed code.
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (!sendError) setStep("verify");
      return;
    }

    setFormError("This sign-in requires a step we don't support yet. Please contact support.");
  }

  async function handleVerify(code: string) {
    setFormError(null);

    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) return;

    if (signIn.status === "complete") {
      await finish();
    } else {
      setFormError("Verification incomplete. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          {step === "credentials" ? "Sign in to your account" : "Confirm it's you"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "credentials" ? (
          <form onSubmit={handleCredentials} className="grid gap-4">
            <GoogleButton />
            <AuthDivider />

            <FormField
              id="identifier"
              label="Email or username"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              error={errors.fields.identifier?.message}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.fields.password?.message}
            />

            <FormError message={formError ?? globalError} />

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <VerificationCodeForm
            sentTo={identifier.includes("@") ? identifier : "your email address"}
            isSubmitting={isSubmitting}
            codeError={errors.fields.code?.message}
            formError={formError ?? globalError}
            onVerify={handleVerify}
            onResend={() => signIn.mfa.sendEmailCode()}
          />
        )}
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href={routes.signUp} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
