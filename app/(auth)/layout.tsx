import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AFTER_AUTH_URL } from "@/lib/routes";

/** Signed-in users have no business on the auth screens. */
async function RedirectIfSignedIn() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) redirect(AFTER_AUTH_URL);
  return null;
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
