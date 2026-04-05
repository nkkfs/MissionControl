"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useDocuments } from "@/lib/hooks/use-documents";
import { useTeam } from "@/lib/hooks/use-team";
import { useProjects } from "@/lib/hooks/use-projects";
import { DocCard } from "./doc-card";
import type { DocumentType } from "@/types";

const DOC_TYPES: { value: DocumentType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "report", label: "Report" },
  { value: "newsletter", label: "Newsletter" },
  { value: "analysis", label: "Analysis" },
  { value: "note", label: "Note" },
];

export function DocList() {
  const {
    documents,
    loading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    agentFilter,
    setAgentFilter,
    agentIds,
  } = useDocuments();
  const { agents } = useTeam();
  const { projects } = useProjects();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const agentNameMap = new Map(agents.map((a) => [a.id, a.displayName]));
  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading documents...</p>
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
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentType | "all")}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {DOC_TYPES.map((t) => (
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

      {/* Document cards */}
      <div className="flex flex-col gap-3">
        {documents.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            agentName={agentNameMap.get(doc.agentId) ?? doc.agentId}
            projectName={projectNameMap.get(doc.projectId) ?? ""}
            expanded={expandedId === doc.id}
            onToggle={() =>
              setExpandedId(expandedId === doc.id ? null : doc.id)
            }
          />
        ))}

        {documents.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground/50">
              {search || typeFilter !== "all" || agentFilter !== "all"
                ? "No documents match your filters."
                : "No documents found. Add documents to data/documents.json."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
