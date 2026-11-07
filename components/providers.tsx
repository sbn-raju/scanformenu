"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

// next-themes inlines a <script> that applies the theme before first paint. It
// only needs to run from the server HTML; marking it inert on the client stops
// React 19's "Encountered a script tag" warning.
const themeScriptProps = typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={themeScriptProps}
    >
      <TooltipProvider>
        <Toaster>{children}</Toaster>
      </TooltipProvider>
    </ThemeProvider>
  );
}
