"use client";

import { useState } from "react";
import { useAgents } from "@/lib/hooks/use-agents";
import { useSessions } from "@/lib/hooks/use-sessions";
import { COLUMN_ORDER } from "@/types";
import type { Session } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { FilterBar } from "./filter-bar";
import { TaskDetail } from "./task-detail";

export function KanbanBoard() {
  const { agents } = useAgents();
  const { sessions, sessionsByColumn } = useSessions();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filteredByColumn = Object.fromEntries(
    COLUMN_ORDER.map((col) => {
      const colSessions = sessionsByColumn[col] ?? [];
      return [
        col,
        selectedAgent
          ? colSessions.filter((s) => s.agentId === selectedAgent)
          : colSessions,
      ];
    })
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">TaskBoard</h2>
          <span className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <FilterBar
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {COLUMN_ORDER.map((column) => (
          <KanbanColumn
            key={column}
            name={column}
            sessions={filteredByColumn[column] ?? []}
            agents={agents}
            onCardClick={setSelectedSession}
          />
        ))}
      </div>

      {/* Detail slide-over */}
      {selectedSession && (
        <TaskDetail
          session={selectedSession}
          agent={agents.find((a) => a.id === selectedSession.agentId)}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
