"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface AgentStatusCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentStatusCard({ agent, onClick }: AgentStatusCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-md border border-border p-3 text-left transition-colors",
        "hover:border-border-hover hover:bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              agent.status === "busy" && "animate-pulse-dot"
            )}
            style={{ backgroundColor: STATUS_COLORS[agent.status] }}
          />
          <span className="text-xs font-medium text-foreground">{agent.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground capitalize">{agent.status}</span>
      </div>
      <p className="truncate text-[11px] text-muted-foreground">
        {agent.currentTask ?? "—"}
      </p>
      <p className="text-[10px] text-muted-foreground/50">
        Last seen: {formatRelativeTime(agent.lastSeen)}
      </p>
    </button>
  );
}
