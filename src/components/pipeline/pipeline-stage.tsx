"use client";

import type { PipelineStage as PipelineStageType } from "@/types";

interface PipelineStageProps {
  stage: PipelineStageType;
}

export function PipelineStage({ stage }: PipelineStageProps) {
  const busy = stage.count > 0;
  const color = busy ? "var(--status-amber)" : "var(--status-gray)";

  return (
    <div
      className="flex min-w-[7rem] flex-col items-center rounded-lg border bg-card px-4 py-3"
      style={{ borderColor: busy ? color : "var(--border)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {stage.label}
      </span>
      <span
        className="mt-1 text-2xl font-semibold tabular-nums"
        style={{ color }}
      >
        {stage.count === 0 ? "—" : stage.count}
      </span>
    </div>
  );
}
