"use client";

import { FileText, Newspaper, BarChart3, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Document, DocumentType } from "@/types";

interface DocCardProps {
  doc: Document;
  agentName: string;
  projectName: string;
  expanded: boolean;
  onToggle: () => void;
}

const TYPE_ICONS: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
  report: FileText,
  newsletter: Newspaper,
  analysis: BarChart3,
  note: StickyNote,
};

const TYPE_COLORS: Record<DocumentType, string> = {
  report: "border-status-blue text-status-blue",
  newsletter: "border-status-green text-status-green",
  analysis: "border-status-purple text-status-purple",
  note: "border-status-amber text-status-amber",
};

export function DocCard({ doc, agentName, projectName, expanded, onToggle }: DocCardProps) {
  const Icon = TYPE_ICONS[doc.type];

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        expanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{doc.title}</h3>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] capitalize", TYPE_COLORS[doc.type])}
        >
          {doc.type}
        </Badge>
      </div>

      {/* Agent + project */}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {agentName}
        {projectName && <> · proj: {projectName}</>}
      </p>

      {/* Summary */}
      <p className={cn(
        "mt-2 text-xs text-foreground/70 leading-relaxed",
        !expanded && "line-clamp-2"
      )}>
        {doc.summary}
      </p>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground/60">
        <span>{doc.wordCount.toLocaleString()} words</span>
        <span>Updated: {formatRelativeTime(doc.updatedAt)}</span>
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {doc.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground/60">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
