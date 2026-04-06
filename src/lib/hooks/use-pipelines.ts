"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pipeline } from "@/types";

export function usePipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipelines")
      .then((r) => r.json())
      .then((data) => setPipelines(data.pipelines ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const itemsInFlight = pipelines.reduce(
      (sum, p) => sum + p.stages.reduce((s, stage) => s + stage.count, 0),
      0
    );
    const totalThroughput = pipelines.reduce(
      (sum, p) => sum + p.throughputPerMinute,
      0
    );
    return {
      flowCount: pipelines.length,
      itemsInFlight,
      totalThroughput,
    };
  }, [pipelines]);

  return { pipelines, stats, loading };
}
