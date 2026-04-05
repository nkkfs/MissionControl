"use client";

import { useEffect, useState, useMemo } from "react";
import type { Memory, MemoryType } from "@/types";

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/memories")
      .then((r) => r.json())
      .then((data) => setMemories(data.memories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (agentFilter !== "all" && m.agentId !== agentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [memories, search, typeFilter, agentFilter]);

  const agentIds = useMemo(
    () => [...new Set(memories.map((m) => m.agentId))],
    [memories]
  );

  return {
    memories: filtered,
    allMemories: memories,
    loading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    agentFilter,
    setAgentFilter,
    agentIds,
  };
}
