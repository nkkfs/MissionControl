"use client";

import { Gavel, CheckCircle2, Clock, Users } from "lucide-react";

interface CouncilStatsProps {
  total: number;
  approvalRate: number;
  pending: number;
  maxQuorum: number;
}

export function CouncilStats({
  total,
  approvalRate,
  pending,
  maxQuorum,
}: CouncilStatsProps) {
  const stats = [
    {
      label: "Decisions",
      value: total.toString(),
      icon: Gavel,
      color: "var(--primary)",
    },
    {
      label: "Approval",
      value: total === 0 ? "—" : `${Math.round(approvalRate * 100)}%`,
      icon: CheckCircle2,
      color: "var(--status-green)",
    },
    {
      label: "Pending",
      value: pending.toString(),
      icon: Clock,
      color: "var(--status-amber)",
    },
    {
      label: "Peak quorum",
      value: maxQuorum.toString(),
      icon: Users,
      color: "var(--status-blue)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
