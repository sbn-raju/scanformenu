import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { PropertyForm } from "@/components/property/property-form";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspace } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Set up your property" };

/** Reads the session, so it streams in behind the Suspense boundary. */
async function Onboarding() {
  const { user, properties } = await getWorkspace();
  const isFirstProperty = properties.length === 0;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <>
      <div className="flex flex-col gap-2">
        {!isFirstProperty && (
          <Link
            href={routes.dashboard}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to dashboard
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {isFirstProperty
            ? `Welcome${user.firstName ? `, ${user.firstName}` : ""}! Let's set up your property`
            : "Add another property"}
        </h1>
        <p className="text-muted-foreground">
          {isFirstProperty
            ? "Tell us about your restaurant, café or hotel. You'll be its owner, and you can edit any of this later."
            : "You'll be the owner of the new property. Switch between properties from the sidebar."}
        </p>
      </div>
      <PropertyForm mode="create" defaults={{ ownerName: fullName, email: user.email }} />
    </>
  );
}

function OnboardingSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-56" />
    </>
  );
}

export default function OnboardingPage() {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <Logo />
        <SignOutButton />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        <Suspense fallback={<OnboardingSkeleton />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}
