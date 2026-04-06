"use client";

import { Users, Activity, Zap, AlertTriangle } from "lucide-react";
import { MetricCard } from "./metric-card";
import type { SystemHealth } from "@/lib/hooks/use-system-health";

interface MetricGridProps {
  health: SystemHealth;
}

export function MetricGrid({ health }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard
        label="Agents"
        value={`${health.onlineAgents} / ${health.totalAgents}`}
        sub="online / total"
        icon={Users}
        colorVar="var(--primary)"
      />
      <MetricCard
        label="Sessions"
        value={health.activeSessions}
        sub="active + review"
        icon={Activity}
        colorVar="var(--status-amber)"
      />
      <MetricCard
        label="Events"
        value={`${health.eventsPerMinute} / m`}
        sub="last 60 seconds"
        icon={Zap}
        colorVar="var(--status-blue)"
      />
      <MetricCard
        label="Errors"
        value={health.errorCount}
        sub="last hour"
        icon={AlertTriangle}
        colorVar={
          health.errorCount > 0 ? "var(--status-red)" : "var(--status-green)"
        }
      />
    </div>
  );
}
