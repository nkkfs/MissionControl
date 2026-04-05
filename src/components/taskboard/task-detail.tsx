"use client";

import { X, Clock, Zap, Wrench, CheckCircle, AlertCircle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens, formatTimestamp } from "@/lib/utils";
import type { Session, Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface TaskDetailProps {
  session: Session;
  agent?: Agent;
  onClose: () => void;
}

export function TaskDetail({ session, agent, onClose }: TaskDetailProps) {
  const agentStatus = agent?.status ?? "offline";
  const duration = Date.now() - session.startedAt;
  const durationMin = Math.floor(duration / 60000);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[agentStatus] }}
          />
          <span className="text-sm font-semibold">
            {agent?.name ?? session.agentId}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            #{session.key.slice(-6)}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Title */}
        <h3 className="text-base font-medium text-foreground">
          {session.description ?? session.lastActivity ?? "Untitled session"}
        </h3>

        {/* Status badge */}
        <div className="mt-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs capitalize",
              session.status === "active" && "border-status-amber text-status-amber",
              session.status === "completed" && "border-status-green text-status-green",
              session.status === "review" && "border-status-purple text-status-purple",
              session.status === "queued" && "border-status-gray text-status-gray",
              session.status === "pending" && "border-status-blue text-status-blue"
            )}
          >
            {session.status}
          </Badge>
        </div>

        <Separator className="my-4" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <p className="mt-1 text-sm font-medium">{durationMin}m</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Tokens
            </div>
            <p className="mt-1 text-sm font-medium">{formatTokens(session.usage.tokens)}</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              Tool Calls
            </div>
            <p className="mt-1 text-sm font-medium">{session.usage.toolCalls ?? 0}</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Started
            </div>
            <p className="mt-1 text-sm font-medium">{formatTimestamp(session.startedAt)}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Last Activity */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Last Activity
          </h4>
          <p className="mt-2 text-sm text-foreground">{session.lastActivity || "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(session.startedAt)}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Action buttons (disabled placeholders for Phase 1) */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Review
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs text-destructive">
              <Pause className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            Actions available in a future update.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
