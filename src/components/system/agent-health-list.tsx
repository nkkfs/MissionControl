"use client";

import { useTeam } from "@/lib/hooks/use-team";
import { STATUS_COLORS } from "@/types";

function formatLastSeen(lastSeen: number): string {
  const diff = Date.now() - lastSeen;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function AgentHealthList() {
  const { agents, loading } = useTeam();

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Loading agents…</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">No agents in workforce.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Agent Health
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {agents.map((agent) => {
          const color = STATUS_COLORS[agent.status];
          return (
            <li
              key={agent.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {agent.displayName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {agent.model}
                </p>
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color }}
              >
                {agent.status}
              </span>
              <span className="w-24 text-right font-mono text-[11px] text-muted-foreground">
                {formatLastSeen(agent.lastSeen)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
