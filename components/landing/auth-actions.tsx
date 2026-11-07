import { Show } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Size = "default" | "lg";

function SignedOut({ size, showSignIn }: { size: Size; showSignIn: boolean }) {
  return (
    <>
      {showSignIn && (
        <Link href={routes.signIn} className={buttonVariants({ variant: "ghost", size })}>
          Sign in
        </Link>
      )}
      <Link href={routes.signUp} className={buttonVariants({ size })}>
        Get started
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    </>
  );
}

/**
 * Auth-aware calls to action. The signed-out buttons are the Suspense fallback,
 * so they ship in the static shell and swap to "Dashboard" only for members.
 */
export function AuthActions({
  size = "default",
  showSignIn = true,
  className,
}: {
  size?: Size;
  showSignIn?: boolean;
  className?: string;
}) {
  const signedOut = <SignedOut size={size} showSignIn={showSignIn} />;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Suspense fallback={signedOut}>
        <Show when="signed-in" fallback={signedOut}>
          <Link href={routes.dashboard} className={buttonVariants({ size })}>
            Go to dashboard
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Show>
      </Suspense>
    </div>
  );
}
