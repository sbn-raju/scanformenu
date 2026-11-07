"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const noopSubscribe = () => () => {};

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; render nothing selected on the server.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  return (
    <ToggleGroup
      variant="outline"
      value={mounted && theme ? [theme] : []}
      onValueChange={(value) => value[0] && setTheme(value[0] as string)}
      aria-label="Theme"
    >
      <ToggleGroupItem value="light">
        <SunIcon />
        Light
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <MoonIcon />
        Dark
      </ToggleGroupItem>
      <ToggleGroupItem value="system">
        <MonitorIcon />
        System
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
