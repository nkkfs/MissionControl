"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useMemories } from "@/lib/hooks/use-memories";
import { useTeam } from "@/lib/hooks/use-team";
import { MemoryCard } from "./memory-card";
import type { MemoryType } from "@/types";

const MEMORY_TYPES: { value: MemoryType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "knowledge", label: "Knowledge" },
  { value: "note", label: "Note" },
  { value: "context", label: "Context" },
];

export function MemoryList() {
  const {
    memories,
    loading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    agentFilter,
    setAgentFilter,
    agentIds,
  } = useMemories();
  const { agents } = useTeam();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const agentNameMap = new Map(agents.map((a) => [a.id, a.displayName]));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading memories...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MemoryType | "all")}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {MEMORY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Agents</option>
          {agentIds.map((id) => (
            <option key={id} value={id}>
              {agentNameMap.get(id) ?? id}
            </option>
          ))}
        </select>
      </div>

      {/* Memory cards */}
      <div className="flex flex-col gap-3">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            agentName={agentNameMap.get(memory.agentId) ?? memory.agentId}
            expanded={expandedId === memory.id}
            onToggle={() =>
              setExpandedId(expandedId === memory.id ? null : memory.id)
            }
          />
        ))}

        {memories.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground/50">
              {search || typeFilter !== "all" || agentFilter !== "all"
                ? "No memories match your filters."
                : "No memories found. Add memories to data/memories.json."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
