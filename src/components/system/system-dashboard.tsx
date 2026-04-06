"use client";

import { useSystemHealth } from "@/lib/hooks/use-system-health";
import { ConnectionCard } from "./connection-card";
import { MetricGrid } from "./metric-grid";
import { AgentHealthList } from "./agent-health-list";
import { PipelineBar } from "./pipeline-bar";

export function SystemDashboard() {
  const health = useSystemHealth();

  return (
    <div className="flex flex-col gap-6">
      <ConnectionCard
        connectionState={health.connectionState}
        gatewayUrl={health.gatewayUrl}
        uptimeSeconds={health.uptimeSeconds}
      />
      <MetricGrid health={health} />
      <AgentHealthList />
      <PipelineBar
        pipelineCounts={health.pipelineCounts}
        totalTokens={health.totalTokens}
      />
    </div>
  );
}
