import { cookies } from "next/headers";
import { Suspense } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireWorkspace } from "@/lib/auth/session";

/**
 * The shell reads the Clerk session and the user's properties on every request,
 * so navigations *into* the dashboard can't be instant. This tells Next.js that's
 * expected (it otherwise flags the session read in dev, and re-validates on every
 * render). Navigations between dashboard pages still stream behind loading.tsx.
 */
export const instant = false;

/** Written by SidebarProvider when the sidebar is toggled. */
const SIDEBAR_COOKIE = "sidebar_state";

/** Reads the session, so it streams in behind the Suspense boundary below. */
async function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, properties, activeProperty } = await requireWorkspace();
  const sidebarOpen = (await cookies()).get(SIDEBAR_COOKIE)?.value !== "false";

  const sessionUser = {
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email,
    email: user.email,
    imageUrl: user.imageUrl,
  };

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar
        user={sessionUser}
        properties={properties.map(({ id, name, type, role }) => ({ id, name, type, role }))}
        activePropertyId={activeProperty.id}
      />
      <SidebarInset>
        <SiteHeader user={sessionUser} propertyName={activeProperty.name} />
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full bg-sidebar">
      <div className="hidden w-64 shrink-0 flex-col gap-4 p-4 md:flex">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="m-0 flex flex-1 flex-col gap-6 bg-background p-6 md:m-2 md:rounded-xl">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
