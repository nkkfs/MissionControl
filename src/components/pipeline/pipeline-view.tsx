"use client";

import { usePipelines } from "@/lib/hooks/use-pipelines";
import { PipelineStats } from "./pipeline-stats";
import { PipelineFlow } from "./pipeline-flow";

export function PipelineView() {
  const { pipelines, stats, loading } = usePipelines();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading pipelines…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PipelineStats
        flowCount={stats.flowCount}
        itemsInFlight={stats.itemsInFlight}
        totalThroughput={stats.totalThroughput}
      />
      {pipelines.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">No active pipelines.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pipelines.map((pipeline) => (
            <PipelineFlow key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}
    </div>
  );
}
