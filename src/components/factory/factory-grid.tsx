"use client";

import { useMemo } from "react";
import { useFactory } from "@/lib/hooks/use-factory";
import { useTeam } from "@/lib/hooks/use-team";
import type { AgentFull } from "@/types";
import { FactoryStats } from "./factory-stats";
import { WorkflowCard } from "./workflow-card";

export function FactoryGrid() {
  const { templates, stats, loading } = useFactory();
  const { agents } = useTeam();

  const agentsById = useMemo(() => {
    const map: Record<string, AgentFull> = {};
    for (const a of agents) map[a.id] = a;
    return map;
  }, [agents]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workflows…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FactoryStats
        total={stats.total}
        active={stats.active}
        scheduled={stats.scheduled}
        runsToday={stats.runsToday}
      />
      {templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No workflow templates defined.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <WorkflowCard
              key={template.id}
              template={template}
              agentsById={agentsById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
