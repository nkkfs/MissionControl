import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Card-style wrapper for a group of related settings. Keeps the Settings
 * page visually calm by giving every section the same shape.
 */
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
