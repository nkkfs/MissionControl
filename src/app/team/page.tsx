"use client";

import { useState } from "react";
import { useTeam } from "@/lib/hooks/use-team";
import { useSessions } from "@/lib/hooks/use-sessions";
import { MissionBanner } from "@/components/team/mission-banner";
import { AgentCard } from "@/components/team/agent-card";
import { AgentDetail } from "@/components/team/agent-detail";

export default function TeamPage() {
  const { agents, mission, loading } = useTeam();
  const { sessions } = useSessions();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Team</h2>
        <p className="text-xs text-muted-foreground">
          Agent hierarchy and configuration
        </p>
      </div>

      {/* Mission Statement */}
      <MissionBanner mission={mission} />

      {/* Agents */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agents
          </h3>
          <span className="text-xs text-muted-foreground/60">
            ({agents.length})
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex flex-col gap-3">
              <AgentCard
                agent={agent}
                expanded={expandedAgent === agent.id}
                onToggle={() =>
                  setExpandedAgent(
                    expandedAgent === agent.id ? null : agent.id
                  )
                }
              />
              {expandedAgent === agent.id && (
                <AgentDetail agent={agent} sessions={sessions} />
              )}
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground/50">
              No agents configured. Add agents to data/agents.json.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
