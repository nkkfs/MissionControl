"use client";

import { UserCircle } from "lucide-react";
import type { PersonRole } from "@/types";
import { PERSON_ROLE_COLORS, PERSON_ROLE_LABELS } from "@/types";

interface PeopleStatsProps {
  total: number;
  active: number;
  byRole: Record<PersonRole, number>;
}

const ROLE_ORDER: PersonRole[] = ["client", "reviewer", "owner", "observer"];

export function PeopleStats({ total, active, byRole }: PeopleStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <UserCircle
            className="h-3.5 w-3.5"
            style={{ color: "var(--primary)" }}
          />
        </div>
        <p
          className="mt-2 text-2xl font-semibold tabular-nums"
          style={{ color: "var(--primary)" }}
        >
          {total}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active
          </span>
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--status-green)" }}
          />
        </div>
        <p
          className="mt-2 text-2xl font-semibold tabular-nums"
          style={{ color: "var(--status-green)" }}
        >
          {active}
        </p>
      </div>

      {ROLE_ORDER.map((role) => {
        const color = PERSON_ROLE_COLORS[role];
        return (
          <div
            key={role}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {PERSON_ROLE_LABELS[role]}
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums"
              style={{ color }}
            >
              {byRole[role] ?? 0}
            </p>
          </div>
        );
      })}
    </div>
  );
}
