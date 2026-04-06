"use client";

import { FileText } from "lucide-react";
import type { ContentStage } from "@/types";
import {
  CONTENT_STAGE_ORDER,
  CONTENT_STAGE_COLORS,
  CONTENT_STAGE_LABELS,
} from "@/types";

interface ContentStatsProps {
  total: number;
  counts: Record<ContentStage, number>;
}

export function ContentStats({ total, counts }: ContentStatsProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <FileText
            className="h-3.5 w-3.5"
            style={{ color: "var(--primary)" }}
          />
        </div>
        <p
          className="mt-2 text-2xl font-semibold tabular-nums"
          style={{ color: "var(--primary)" }}
        >
          {total}
        </p>
      </div>
      {CONTENT_STAGE_ORDER.map((stage) => {
        const color = CONTENT_STAGE_COLORS[stage];
        return (
          <div
            key={stage}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CONTENT_STAGE_LABELS[stage]}
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums"
              style={{ color }}
            >
              {counts[stage] ?? 0}
            </p>
          </div>
        );
      })}
    </div>
  );
}
