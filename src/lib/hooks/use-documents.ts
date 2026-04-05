"use client";

import { useEffect, useState, useMemo } from "react";
import type { Document, DocumentType } from "@/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => setDocuments(data.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (agentFilter !== "all" && d.agentId !== agentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [documents, search, typeFilter, agentFilter]);

  const agentIds = useMemo(
    () => [...new Set(documents.map((d) => d.agentId))],
    [documents]
  );

  return {
    documents: filtered,
    allDocuments: documents,
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
