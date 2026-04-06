"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentFull } from "@/types";

interface AgentTileProps {
  agent: AgentFull;
}

export function AgentTile({ agent }: AgentTileProps) {
  const isBusy = agent.status === "busy";

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background p-3 transition-colors hover:border-border-hover">
      {/* Avatar dot */}
      <div className="relative mt-0.5 shrink-0">
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            isBusy && "animate-pulse-dot"
          )}
          style={{ backgroundColor: agent.avatarColor }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-foreground">
            {agent.displayName}
          </span>
          <Badge variant="secondary" className="shrink-0 text-[9px] capitalize">
            {agent.status}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {agent.model}
        </p>
        {agent.currentTask && (
          <p className="mt-1 truncate text-[10px] text-primary/80">
            {agent.currentTask}
          </p>
        )}
      </div>
    </div>
  );
}
