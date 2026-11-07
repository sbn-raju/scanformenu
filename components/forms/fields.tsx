"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { toast } from "@/components/ui/toast";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";

type FieldChrome = {
  name: string;
  label: string;
  description?: ReactNode;
  errors?: string[];
  optional?: boolean;
  className?: string;
};

function FieldShell({
  name,
  label,
  description,
  errors,
  optional,
  className,
  children,
}: FieldChrome & { children: ReactNode }) {
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined} className={className}>
      <FieldLabel htmlFor={name}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </FieldLabel>
      {children}
      {description && !invalid && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors?.map((message) => ({ message }))} />
    </Field>
  );
}

export function TextField({
  name,
  label,
  description,
  errors,
  optional,
  className,
  ...inputProps
}: FieldChrome & Omit<ComponentProps<typeof Input>, "name" | "id">) {
  return (
    <FieldShell {...{ name, label, description, errors, optional, className }}>
      <Input
        id={name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        required={!optional && inputProps.required !== false}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function TextareaField({
  name,
  label,
  description,
  errors,
  optional,
  className,
  ...textareaProps
}: FieldChrome & Omit<ComponentProps<typeof Textarea>, "name" | "id">) {
  return (
    <FieldShell {...{ name, label, description, errors, optional, className }}>
      <Textarea
        id={name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        {...textareaProps}
      />
    </FieldShell>
  );
}

export type SelectOption = { value: string; label: string };

type SelectFieldProps = FieldChrome & {
  options: readonly SelectOption[];
  placeholder?: string;
  defaultValue?: string | null;
  /** Pass `value` + `onValueChange` to control the select. */
  value?: string | null;
  onValueChange?: (value: string | null) => void;
};

export function SelectField({
  name,
  label,
  description,
  errors,
  optional,
  className,
  options,
  placeholder = "Select…",
  defaultValue,
  value,
  onValueChange,
}: SelectFieldProps) {
  const controlled = value !== undefined;
  return (
    <FieldShell {...{ name, label, description, errors, optional, className }}>
      <Select
        name={name}
        items={options}
        required={!optional}
        {...(controlled ? { value } : { defaultValue: defaultValue ?? null })}
        onValueChange={(next) => onValueChange?.((next as string | null) ?? null)}
      >
        <SelectTrigger id={name} className="w-full" aria-invalid={errors?.length ? true : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** An on/off setting. Submits "on" when checked and nothing when off, like a checkbox. */
export function SwitchField({
  name,
  label,
  description,
  defaultChecked,
  className,
}: {
  name: string;
  label: string;
  description?: ReactNode;
  defaultChecked?: boolean;
  className?: string;
}) {
  return (
    <Field orientation="horizontal" className={className}>
      <FieldContent>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch id={name} name={name} defaultChecked={defaultChecked} />
    </Field>
  );
}

/** Shows a toast whenever a form action finishes with a message. */
export function useFormStateToast(state: FormState) {
  const last = useRef(state);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.status === "success" && state.message) {
      toast.add({ title: state.message, type: "success" });
    } else if (state.status === "error" && state.message) {
      toast.add({ title: state.message, type: "error" });
    }
  }, [state]);
}
