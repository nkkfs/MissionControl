"use client";

import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { LiveEvent } from "@/types";

interface EventStreamProps {
  events: LiveEvent[];
  paused: boolean;
  pendingCount: number;
  onPause: () => void;
  onResume: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "session.tool": "tool",
  "session.message": "msg",
  "agent.status": "status",
  presence: "presence",
  system: "sys",
};

export function EventStream({ events, paused, pendingCount, onPause, onResume }: EventStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events.length, paused]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live Events
        </span>
        <div className="flex items-center gap-1">
          {paused && pendingCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {pendingCount} new
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={paused ? onResume : onPause}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Events */}
      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1.5 pb-2">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col gap-0.5 rounded-md p-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className={cn(
                  "text-[10px] font-medium",
                  event.type === "session.tool" && "text-status-amber",
                  event.type === "session.message" && "text-status-blue",
                  event.type === "agent.status" && "text-status-green",
                  event.type === "presence" && "text-status-purple"
                )}>
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{event.agentId}</span>
                <span className="text-[11px] text-foreground/80 truncate">{event.summary}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
