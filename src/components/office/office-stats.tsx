"use client";

import { Users, Activity, Circle, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgentFull } from "@/types";

interface OfficeStatsProps {
  agents: AgentFull[];
}

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  colorVar: string;
}

export function OfficeStats({ agents }: OfficeStatsProps) {
  const total = agents.length;
  const busy = agents.filter((a) => a.status === "busy").length;
  const idle = agents.filter((a) => a.status === "idle").length;
  const offline = agents.filter(
    (a) => a.status === "offline" || a.status === "paused"
  ).length;

  const stats: Stat[] = [
    { label: "Total", value: total, icon: Users, colorVar: "var(--primary)" },
    { label: "Busy", value: busy, icon: Activity, colorVar: "var(--status-amber)" },
    { label: "Idle", value: idle, icon: Circle, colorVar: "var(--status-green)" },
    { label: "Offline", value: offline, icon: Moon, colorVar: "var(--status-gray)" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
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
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: stat.colorVar }}
              />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums"
              style={{ color: stat.colorVar }}
            >
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
