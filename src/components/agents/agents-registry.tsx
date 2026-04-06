"use client";

import { useMemo } from "react";
import { useTeam } from "@/lib/hooks/use-team";
import { AgentsStats } from "./agents-stats";
import { AgentRegistryCard } from "./agent-registry-card";

export function AgentsRegistry() {
  const { agents, loading } = useTeam();

  const stats = useMemo(() => {
    const models = new Set(agents.map((a) => a.model).filter(Boolean));
    const roles = new Set(agents.map((a) => a.role).filter(Boolean));
    const tools = new Set<string>();
    for (const a of agents) {
      for (const t of a.tools) tools.add(t);
    }
    return {
      total: agents.length,
      uniqueModels: models.size,
      uniqueTools: tools.size,
      uniqueRoles: roles.size,
    };
  }, [agents]);

  const sorted = useMemo(
    () => [...agents].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [agents],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading agents…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AgentsStats
        total={stats.total}
        uniqueModels={stats.uniqueModels}
        uniqueTools={stats.uniqueTools}
        uniqueRoles={stats.uniqueRoles}
      />
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No agents registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((agent) => (
            <AgentRegistryCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
