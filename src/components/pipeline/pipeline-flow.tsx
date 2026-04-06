"use client";

import { ChevronRight } from "lucide-react";
import type { Pipeline } from "@/types";
import { PipelineStage } from "./pipeline-stage";

interface PipelineFlowProps {
  pipeline: Pipeline;
}

export function PipelineFlow({ pipeline }: PipelineFlowProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {pipeline.name}
        </h3>
        <div className="text-[11px] text-muted-foreground">
          <span
            className="tabular-nums"
            style={{ color: "var(--status-blue)" }}
          >
            {pipeline.throughputPerMinute.toFixed(1)}
          </span>
          <span className="ml-1">/ min</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto">
        {pipeline.stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-2">
            <PipelineStage stage={stage} />
            {index < pipeline.stages.length - 1 && (
              <ChevronRight
                className="h-5 w-5 text-muted-foreground"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
