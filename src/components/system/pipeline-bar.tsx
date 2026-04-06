"use client";

import { COLUMN_ORDER, COLUMN_COLORS } from "@/types";
import type { ColumnName } from "@/types";

interface PipelineBarProps {
  pipelineCounts: Record<ColumnName, number>;
  totalTokens: number;
}

export function PipelineBar({ pipelineCounts, totalTokens }: PipelineBarProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Session Pipeline
        </h3>
        <div className="text-[11px] text-muted-foreground">
          <span className="tabular-nums text-foreground">
            {totalTokens.toLocaleString()}
          </span>
          <span className="ml-1">tokens</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {COLUMN_ORDER.map((column) => {
          const count = pipelineCounts[column] ?? 0;
          const color = COLUMN_COLORS[column];
          return (
            <div
              key={column}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium text-foreground">
                {column}
              </span>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
