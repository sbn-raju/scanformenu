import { UtensilsCrossedIcon } from "lucide-react";

/** Shown for unknown menus and menus the property has switched off. */
export default function MenuNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <UtensilsCrossedIcon className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">This menu isn&apos;t available right now</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been updated or taken down. Please ask a member of staff for the current menu.
      </p>
    </main>
  );
}
