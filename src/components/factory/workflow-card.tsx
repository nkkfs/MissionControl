"use client";

import { Settings2, Clock, Hand, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkflowTemplate, TriggerType, AgentFull } from "@/types";
import { WORKFLOW_STATUS_COLORS, TRIGGER_COLORS } from "@/types";

const TRIGGER_ICONS: Record<TriggerType, LucideIcon> = {
  manual: Hand,
  scheduled: Clock,
  event: Zap,
};

interface WorkflowCardProps {
  template: WorkflowTemplate;
  agentsById: Record<string, AgentFull>;
}

function formatLastRun(timestamp: number | null): string {
  if (timestamp === null) return "never";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function WorkflowCard({ template, agentsById }: WorkflowCardProps) {
  const statusColor = WORKFLOW_STATUS_COLORS[template.status];
  const triggerColor = TRIGGER_COLORS[template.trigger];
  const TriggerIcon = TRIGGER_ICONS[template.trigger];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Settings2
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--primary)" }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {template.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {template.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: statusColor,
            backgroundColor: `color-mix(in oklch, ${statusColor} 15%, transparent)`,
          }}
        >
          {template.status}
        </span>
        <div
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            color: triggerColor,
            backgroundColor: `color-mix(in oklch, ${triggerColor} 15%, transparent)`,
          }}
        >
          <TriggerIcon className="h-3 w-3" />
          <span>{template.triggerDetail}</span>
        </div>
      </div>

      <ol className="mt-3 flex flex-col gap-1 rounded border border-border bg-background p-2">
        {template.steps.map((step) => {
          const agent = agentsById[step.agentId];
          return (
            <li
              key={step.order}
              className="flex items-center gap-2 text-[11px]"
            >
              <span
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  color: "var(--primary)",
                  backgroundColor:
                    "color-mix(in oklch, var(--primary) 15%, transparent)",
                }}
              >
                {step.order}
              </span>
              <span className="flex-1 truncate text-foreground">
                {step.title}
              </span>
              <span className="truncate text-muted-foreground">
                {agent?.displayName ?? step.agentId}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          <span className="tabular-nums text-foreground">
            {template.runCount}
          </span>{" "}
          runs
        </span>
        <span>last run {formatLastRun(template.lastRunAt)}</span>
      </div>
    </div>
  );
}
