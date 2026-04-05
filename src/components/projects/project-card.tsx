"use client";

import { Users, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project & { sessionCount: number; totalTokens: number };
  expanded: boolean;
  onToggle: () => void;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: "border-status-green text-status-green",
  paused: "border-status-amber text-status-amber",
  completed: "border-status-gray text-status-gray",
};

export function ProjectCard({ project, expanded, onToggle }: ProjectCardProps) {
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
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        <Badge
          variant="outline"
          className={cn("text-[10px] capitalize", STATUS_BADGE_STYLES[project.status])}
        >
          {project.status}
        </Badge>
      </div>

      {/* Description */}
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
        {project.description}
      </p>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{project.agentIds.length} agent{project.agentIds.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{project.sessionCount} session{project.sessionCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{formatTokens(project.totalTokens)} tokens</span>
        </div>
      </div>

      {/* Updated */}
      <p className="mt-2 text-[10px] text-muted-foreground/40">
        Updated: {formatRelativeTime(project.updatedAt)}
      </p>
    </button>
  );
}
