"use client";

import { useSignUp } from "@clerk/nextjs";
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

type Step = "details" | "verify";

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const completeAuth = useCompleteAuth();

  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const globalError = errors.global?.[0]?.message ?? null;

  async function handleDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { error } = await signUp.password({ emailAddress: email, password, username, firstName, lastName });
    if (error) return;

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (!sendError) setStep("verify");
  }

  async function handleVerify(code: string) {
    setFormError(null);

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;

    if (signUp.status === "complete") {
      setFormError(await completeAuth((params) => signUp.finalize(params)));
    } else {
      // Clerk still needs something (e.g. a field made required in the dashboard).
      const missing = signUp.missingFields.join(", ");
      setFormError(`Sign-up incomplete${missing ? ` — missing: ${missing}` : ""}. Please try again.`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          {step === "details" ? "Get started in less than a minute" : "Verify your email"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "details" ? (
          <form onSubmit={handleDetails} className="grid gap-4">
            <GoogleButton />
            <AuthDivider />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="firstName"
                label="First name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                error={errors.fields.firstName?.message}
              />
              <FormField
                id="lastName"
                label="Last name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                error={errors.fields.lastName?.message}
              />
            </div>
            <FormField
              id="username"
              label="Username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              error={errors.fields.username?.message}
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.fields.emailAddress?.message}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.fields.password?.message}
            />

            {/* Clerk renders its bot-protection challenge here. */}
            <div id="clerk-captcha" />

            <FormError message={formError ?? globalError} />

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        ) : (
          <VerificationCodeForm
            sentTo={email}
            isSubmitting={isSubmitting}
            codeError={errors.fields.code?.message}
            formError={formError ?? globalError}
            onVerify={handleVerify}
            onResend={() => signUp.verifications.sendEmailCode()}
          />
        )}
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href={routes.signIn} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
