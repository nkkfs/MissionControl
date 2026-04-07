"use client";

import {
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const inputBaseClass =
  "h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30";

interface FieldShellProps {
  id: string;
  label: string;
  help?: string;
  children: ReactNode;
}

function FieldShell({ id, label, help, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {help && <p className="text-[11px] text-muted-foreground/80">{help}</p>}
    </div>
  );
}

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url";
};

export function TextField({
  label,
  help,
  value,
  onChange,
  className,
  type = "text",
  ...rest
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={cn(inputBaseClass, className)}
        spellCheck={false}
        autoComplete="off"
        {...rest}
      />
    </FieldShell>
  );
}

type NumberFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export function NumberField({
  label,
  help,
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  ...rest
}: NumberFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        className={cn(inputBaseClass, className)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectOption<T extends string> = { value: T; label: string };

type SelectFieldProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> & {
  label: string;
  help?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({
  label,
  help,
  value,
  options,
  onChange,
  className,
  ...rest
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <select
        id={id}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onChange(e.target.value as T)
        }
        className={cn(inputBaseClass, "appearance-none pr-6", className)}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ToggleFieldProps {
  label: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleField({
  label,
  help,
  value,
  onChange,
}: ToggleFieldProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label
          htmlFor={id}
          className="block text-xs font-medium text-foreground"
        >
          {label}
        </label>
        {help && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{help}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          value ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow-sm transition-transform",
            value ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
