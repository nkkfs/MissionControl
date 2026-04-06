"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeedbackEntry, FeedbackStatus } from "@/types";

export function useFeedback() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.feedback ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.submittedAt - a.submittedAt),
    [entries],
  );

  const byStatus = useMemo(() => {
    const counts: Record<FeedbackStatus, number> = {
      new: 0,
      read: 0,
      addressed: 0,
    };
    for (const e of entries) counts[e.status] = (counts[e.status] ?? 0) + 1;
    return counts;
  }, [entries]);

  const stats = useMemo(() => {
    const total = entries.length;
    const avgRating =
      total === 0
        ? 0
        : entries.reduce((sum, e) => sum + e.rating, 0) / total;
    return {
      total,
      newCount: byStatus.new,
      readCount: byStatus.read,
      addressedCount: byStatus.addressed,
      avgRating,
    };
  }, [entries, byStatus]);

  return { entries: sorted, stats, loading };
}
