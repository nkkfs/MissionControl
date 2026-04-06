"use client";

import { Clock, Check, X } from "lucide-react";

interface ApprovalsStatsProps {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
}

export function ApprovalsStats({
  pending,
  approvedToday,
  rejectedToday,
}: ApprovalsStatsProps) {
  const stats = [
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "var(--status-amber)",
    },
    {
      label: "Approved today",
      value: approvedToday,
      icon: Check,
      color: "var(--status-green)",
    },
    {
      label: "Rejected today",
      value: rejectedToday,
      icon: X,
      color: "var(--status-red)",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
