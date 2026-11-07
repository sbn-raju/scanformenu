"use client";

import { useOptimistic, useTransition } from "react";

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { updatePreferenceAction } from "@/lib/users/actions";

type Preferences = {
  emailProductUpdates: boolean;
  emailWeeklySummary: boolean;
  emailSecurityAlerts: boolean;
};

const OPTIONS: { key: keyof Preferences; label: string; description: string }[] = [
  {
    key: "emailWeeklySummary",
    label: "Weekly summary",
    description: "A Monday email with menu views and scans from the past week.",
  },
  {
    key: "emailProductUpdates",
    label: "Product updates",
    description: "New features and improvements to ScanForMenu.",
  },
  {
    key: "emailSecurityAlerts",
    label: "Security alerts",
    description: "New sign-ins and changes to your account.",
  },
];

/** Each switch saves as soon as it's flipped. */
export function NotificationSettings({ preferences }: { preferences: Preferences }) {
  const [optimistic, setOptimistic] = useOptimistic(preferences);
  const [, startTransition] = useTransition();

  function toggle(key: keyof Preferences, value: boolean) {
    startTransition(async () => {
      setOptimistic((current) => ({ ...current, [key]: value }));
      const { ok } = await updatePreferenceAction(key, value);
      toast.add(
        ok
          ? { title: "Preferences saved", type: "success" }
          : { title: "Couldn't save your preference", type: "error" },
      );
    });
  }

  return (
    <FieldGroup>
      {OPTIONS.map(({ key, label, description }) => (
        <Field key={key} orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={key}>{label}</FieldLabel>
            <FieldDescription>{description}</FieldDescription>
          </FieldContent>
          <Switch id={key} checked={optimistic[key]} onCheckedChange={(checked) => toggle(key, checked)} />
        </Field>
      ))}
    </FieldGroup>
  );
}
