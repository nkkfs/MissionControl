"use client";

import { GitBranch, Package, Gauge } from "lucide-react";

interface PipelineStatsProps {
  flowCount: number;
  itemsInFlight: number;
  totalThroughput: number;
}

export function PipelineStats({
  flowCount,
  itemsInFlight,
  totalThroughput,
}: PipelineStatsProps) {
  const stats = [
    {
      label: "Flows",
      value: flowCount.toString(),
      icon: GitBranch,
      color: "var(--primary)",
    },
    {
      label: "In flight",
      value: itemsInFlight.toString(),
      icon: Package,
      color: "var(--status-amber)",
    },
    {
      label: "Throughput",
      value: `${totalThroughput.toFixed(1)} / m`,
      icon: Gauge,
      color: "var(--status-blue)",
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
