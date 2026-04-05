"use client";

import { BookOpen, StickyNote, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Memory, MemoryType } from "@/types";

interface MemoryCardProps {
  memory: Memory;
  agentName: string;
  expanded: boolean;
  onToggle: () => void;
}

const TYPE_ICONS: Record<MemoryType, React.ComponentType<{ className?: string }>> = {
  knowledge: BookOpen,
  note: StickyNote,
  context: Layers,
};

const TYPE_COLORS: Record<MemoryType, string> = {
  knowledge: "border-status-blue text-status-blue",
  note: "border-status-amber text-status-amber",
  context: "border-status-purple text-status-purple",
};

export function MemoryCard({ memory, agentName, expanded, onToggle }: MemoryCardProps) {
  const Icon = TYPE_ICONS[memory.type];

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
          <h3 className="text-sm font-semibold text-foreground">{memory.title}</h3>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] capitalize", TYPE_COLORS[memory.type])}
        >
          {memory.type}
        </Badge>
      </div>

      {/* Agent + time */}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {agentName} · {formatRelativeTime(memory.createdAt)}
      </p>

      {/* Content preview or full */}
      <p className={cn(
        "mt-2 text-xs text-foreground/70 leading-relaxed",
        !expanded && "line-clamp-2"
      )}>
        {memory.content}
      </p>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
