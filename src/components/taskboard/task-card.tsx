"use client";

import { Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens } from "@/lib/utils";
import type { Session, Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface TaskCardProps {
  session: Session;
  agent?: Agent;
  onClick?: () => void;
}

export function TaskCard({ session, agent, onClick }: TaskCardProps) {
  const agentStatus = agent?.status ?? "offline";
  const isActive = session.status === "active";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    >
      {/* Header: agent dot + name + session key */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn("h-2 w-2 rounded-full", isActive && "animate-pulse-dot")}
            style={{ backgroundColor: STATUS_COLORS[agentStatus] }}
          />
          <span className="text-xs text-muted-foreground">
            {agent?.name ?? session.agentId}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60">
          #{session.key.slice(-6)}
        </span>
      </div>

      {/* Title */}
      <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">
        {session.description ?? session.lastActivity ?? "Untitled session"}
      </p>

      {/* Last activity */}
      {session.lastActivity && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span className="truncate">{session.lastActivity}</span>
          <span className="ml-auto shrink-0">{formatRelativeTime(session.startedAt)}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{formatTokens(session.usage.tokens)} tokens</span>
        </div>
        {session.usage.toolCalls !== undefined && session.usage.toolCalls > 0 && (
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{session.usage.toolCalls} tools</span>
          </div>
        )}
      </div>
    </button>
  );
}
