"use client";

import { Mail } from "lucide-react";
import type { Person, Project } from "@/types";
import { PERSON_ROLE_COLORS, PERSON_ROLE_LABELS } from "@/types";

interface PersonCardProps {
  person: Person;
  projectsById: Record<string, Project>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PersonCard({ person, projectsById }: PersonCardProps) {
  const roleColor = PERSON_ROLE_COLORS[person.role];
  const roleLabel = PERSON_ROLE_LABELS[person.role];
  const projectNames = person.projectIds
    .map((id) => projectsById[id]?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            backgroundColor: `color-mix(in oklch, ${roleColor} 18%, transparent)`,
            color: roleColor,
          }}
        >
          {initials(person.name)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold text-foreground">
              {person.name}
            </p>
            {!person.active && (
              <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          <span
            className="mt-0.5 inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              color: roleColor,
              backgroundColor: `color-mix(in oklch, ${roleColor} 15%, transparent)`,
            }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Mail className="h-3 w-3" />
        <span className="truncate">{person.email}</span>
      </div>

      <div className="mt-2 border-t border-border pt-2">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </p>
        {projectNames.length === 0 ? (
          <p className="mt-1 text-[11px] text-muted-foreground/70">None</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1">
            {projectNames.map((name) => (
              <span
                key={name}
                className="truncate rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
