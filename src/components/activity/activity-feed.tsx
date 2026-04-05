"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAgents } from "@/lib/hooks/use-agents";
import { useEventStream } from "@/lib/hooks/use-event-stream";
import { AgentStatusCard } from "./agent-status-card";
import { EventStream } from "./event-stream";

interface ActivityFeedProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ActivityFeed({ collapsed, onToggle }: ActivityFeedProps) {
  const { agents, onlineCount } = useAgents();
  const eventStream = useEventStream();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-border bg-surface py-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-foreground">Activity</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Agent cards */}
      <div className="border-b border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agents Online
          </span>
          <span className="text-[10px] text-muted-foreground">
            {onlineCount}/{agents.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
          {agents.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">
              No agents connected
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Event stream */}
      <EventStream
        events={eventStream.events}
        paused={eventStream.paused}
        pendingCount={eventStream.pendingCount}
        onPause={eventStream.pause}
        onResume={eventStream.resume}
      />
    </div>
  );
}
