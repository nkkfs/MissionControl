"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/types";
import { EVENT_TYPE_COLORS, EVENT_STATUS_COLORS } from "@/types";

interface EventCardProps {
  event: ScheduleEvent;
  agentName: string;
  projectName: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export function EventCard({ event, agentName, projectName }: EventCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-hover">
      {/* Time */}
      <div className="w-12 shrink-0 text-right">
        <span className="text-xs font-medium text-foreground">
          {formatTime(event.scheduledAt)}
        </span>
      </div>

      {/* Dot */}
      <div className="mt-1.5 shrink-0">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            event.status === "in_progress" && "animate-pulse-dot"
          )}
          style={{ backgroundColor: EVENT_TYPE_COLORS[event.type] }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {event.title}
          </h4>
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] capitalize"
          >
            {event.type}
          </Badge>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {agentName}
          {projectName && <> · {projectName}</>}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          {formatDuration(event.duration) && (
            <span className="text-[10px] text-muted-foreground/60">
              {formatDuration(event.duration)}
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] capitalize",
              event.status === "completed" && "border-status-green text-status-green",
              event.status === "overdue" && "border-status-red text-status-red",
              event.status === "in_progress" && "border-status-amber text-status-amber",
              event.status === "scheduled" && "border-status-gray text-status-gray"
            )}
          >
            {event.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
    </div>
  );
}
