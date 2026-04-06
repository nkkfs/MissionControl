"use client";

import { Factory, CheckCircle2, Clock, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FactoryStatsProps {
  total: number;
  active: number;
  scheduled: number;
  runsToday: number;
}

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

export function FactoryStats({
  total,
  active,
  scheduled,
  runsToday,
}: FactoryStatsProps) {
  const stats: Stat[] = [
    { label: "Total", value: total, icon: Factory, color: "var(--primary)" },
    {
      label: "Active",
      value: active,
      icon: CheckCircle2,
      color: "var(--status-green)",
    },
    {
      label: "Scheduled",
      value: scheduled,
      icon: Clock,
      color: "var(--status-amber)",
    },
    {
      label: "Runs today",
      value: runsToday,
      icon: Play,
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
