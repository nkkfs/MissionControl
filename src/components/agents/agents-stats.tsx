"use client";

import { Bot, Cpu, Wrench, Users } from "lucide-react";

interface AgentsStatsProps {
  total: number;
  uniqueModels: number;
  uniqueTools: number;
  uniqueRoles: number;
}

export function AgentsStats({
  total,
  uniqueModels,
  uniqueTools,
  uniqueRoles,
}: AgentsStatsProps) {
  const stats = [
    {
      label: "Agents",
      value: total,
      icon: Bot,
      color: "var(--primary)",
    },
    {
      label: "Models",
      value: uniqueModels,
      icon: Cpu,
      color: "var(--status-blue)",
    },
    {
      label: "Tools",
      value: uniqueTools,
      icon: Wrench,
      color: "var(--status-amber)",
    },
    {
      label: "Roles",
      value: uniqueRoles,
      icon: Users,
      color: "var(--status-purple)",
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
