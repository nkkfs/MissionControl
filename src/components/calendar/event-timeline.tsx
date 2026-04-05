"use client";

import { useSchedule } from "@/lib/hooks/use-schedule";
import { useTeam } from "@/lib/hooks/use-team";
import { useProjects } from "@/lib/hooks/use-projects";
import { EventCard } from "./event-card";

export function EventTimeline() {
  const { grouped, loading } = useSchedule();
  const { agents } = useTeam();
  const { projects } = useProjects();

  const agentNameMap = new Map(agents.map((a) => [a.id, a.displayName]));
  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading schedule...</p>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-xs text-muted-foreground/50">
          No events scheduled. Add events to data/schedule.json.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map((group) => (
        <div key={`${group.label}-${group.date}`}>
          {/* Day header */}
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            <span className="text-xs text-muted-foreground/60">
              {group.date}
            </span>
          </div>

          {/* Events */}
          <div className="flex flex-col gap-2">
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                agentName={agentNameMap.get(event.agentId) ?? event.agentId}
                projectName={projectNameMap.get(event.projectId) ?? ""}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
