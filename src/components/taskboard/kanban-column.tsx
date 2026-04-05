"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Session, Agent, ColumnName } from "@/types";
import { COLUMN_COLORS } from "@/types";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  name: ColumnName;
  sessions: Session[];
  agents: Agent[];
  onCardClick?: (session: Session) => void;
}

export function KanbanColumn({ name, sessions, agents, onCardClick }: KanbanColumnProps) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: COLUMN_COLORS[name] }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {name}
        </h3>
        <span className="text-xs text-muted-foreground/60">{sessions.length}</span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-1 pb-4">
          {sessions.map((session) => (
            <TaskCard
              key={session.key}
              session={session}
              agent={agentMap.get(session.agentId)}
              onClick={() => onCardClick?.(session)}
            />
          ))}
          {sessions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground/40">
              No sessions
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
