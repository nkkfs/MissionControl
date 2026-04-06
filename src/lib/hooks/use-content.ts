"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentItem, ContentStage } from "@/types";
import { CONTENT_STAGE_ORDER } from "@/types";

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byStage = useMemo(() => {
    const grouped: Record<ContentStage, ContentItem[]> = {
      draft: [],
      review: [],
      approved: [],
      published: [],
    };
    for (const item of items) {
      if (grouped[item.stage]) {
        grouped[item.stage].push(item);
      }
    }
    // Sort each stage by most recent first
    for (const stage of CONTENT_STAGE_ORDER) {
      grouped[stage].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return grouped;
  }, [items]);

  const counts = useMemo(() => {
    const c: Record<ContentStage, number> = {
      draft: 0,
      review: 0,
      approved: 0,
      published: 0,
    };
    for (const item of items) c[item.stage] = (c[item.stage] ?? 0) + 1;
    return c;
  }, [items]);

  return { items, byStage, counts, total: items.length, loading };
}
