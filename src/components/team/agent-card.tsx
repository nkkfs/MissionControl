"use client";

import { Wrench, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { AgentFull } from "@/types";
import { STATUS_COLORS } from "@/types";

interface AgentCardProps {
  agent: AgentFull;
  expanded: boolean;
  onToggle: () => void;
}

export function AgentCard({ agent, expanded, onToggle }: AgentCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border border-border bg-card text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        expanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Color accent top border */}
      <div
        className="h-1 rounded-t-lg"
        style={{ backgroundColor: agent.avatarColor }}
      />

      <div className="p-4">
        {/* Header: status dot + name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                agent.status === "busy" && "animate-pulse-dot"
              )}
              style={{ backgroundColor: STATUS_COLORS[agent.status] }}
            />
            <span className="text-sm font-semibold text-foreground">
              {agent.displayName}
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize">
            {agent.status}
          </Badge>
        </div>

        {/* Role */}
        <p className="mt-2 text-xs text-muted-foreground">{agent.role}</p>

        {/* Model */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cpu className="h-3 w-3" />
          <span>{agent.model}</span>
        </div>

        {/* Current task (if busy) */}
        {agent.currentTask && (
          <p className="mt-2 truncate text-xs text-primary/80">
            {agent.currentTask}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground/60">
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{agent.tools.length} tools</span>
          </div>
          {agent.lastSeen > 0 && (
            <span>Last seen: {formatRelativeTime(agent.lastSeen)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
