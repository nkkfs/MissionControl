"use client";

import type { ContentItem, ContentStage, AgentFull, Project } from "@/types";
import { CONTENT_STAGE_COLORS, CONTENT_STAGE_LABELS } from "@/types";
import { ContentCard } from "./content-card";

interface ContentColumnProps {
  stage: ContentStage;
  items: ContentItem[];
  agentsById: Record<string, AgentFull>;
  projectsById: Record<string, Project>;
}

export function ContentColumn({
  stage,
  items,
  agentsById,
  projectsById,
}: ContentColumnProps) {
  const color = CONTENT_STAGE_COLORS[stage];
  const label = CONTENT_STAGE_LABELS[stage];

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-border bg-card">
      <div
        className="flex items-center justify-between border-b border-border px-3 py-2"
        style={{ borderColor: color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
            {label}
          </h3>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
          style={{
            color,
            backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
          }}
        >
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {items.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
            Empty
          </p>
        ) : (
          items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              agent={agentsById[item.agentId]}
              project={projectsById[item.projectId]}
            />
          ))
        )}
      </div>
    </div>
  );
}
