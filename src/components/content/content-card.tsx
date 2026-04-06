"use client";

import { FileText, Newspaper, BarChart3, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContentItem, ContentType, AgentFull, Project } from "@/types";

const TYPE_ICONS: Record<ContentType, LucideIcon> = {
  article: FileText,
  newsletter: Newspaper,
  report: BarChart3,
  post: StickyNote,
};

interface ContentCardProps {
  item: ContentItem;
  agent: AgentFull | undefined;
  project: Project | undefined;
}

export function ContentCard({ item, agent, project }: ContentCardProps) {
  const Icon = TYPE_ICONS[item.type];
  const authorName = agent?.displayName ?? item.agentId;
  const projectName = project?.name ?? "—";

  return (
    <div className="rounded-md border border-border bg-background p-3 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-2">
        <Icon
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--primary)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">
            {item.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
            {item.summary}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{authorName}</span>
        <span className="tabular-nums">{item.wordCount.toLocaleString()} w</span>
      </div>
      <div className="mt-1 truncate text-[10px] text-muted-foreground/70">
        {projectName}
      </div>
    </div>
  );
}
