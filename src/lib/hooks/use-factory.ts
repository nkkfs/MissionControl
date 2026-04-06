"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkflowTemplate } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function useFactory() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/factory")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = templates.filter((t) => t.status === "active").length;
    const scheduled = templates.filter(
      (t) => t.status === "active" && t.trigger === "scheduled"
    ).length;
    const runsToday = templates.reduce((sum, t) => {
      if (t.lastRunAt !== null && now - t.lastRunAt < DAY_MS) {
        return sum + 1;
      }
      return sum;
    }, 0);
    return {
      total: templates.length,
      active,
      scheduled,
      runsToday,
    };
  }, [templates]);

  return { templates, stats, loading };
}
