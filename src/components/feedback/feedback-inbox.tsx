"use client";

import { useMemo, useState } from "react";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { usePeople } from "@/lib/hooks/use-people";
import { useContent } from "@/lib/hooks/use-content";
import type { ContentItem, FeedbackStatus, Person } from "@/types";
import { cn } from "@/lib/utils";
import { FeedbackStats } from "./feedback-stats";
import { FeedbackCard } from "./feedback-card";

type Filter = "all" | FeedbackStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "addressed", label: "Addressed" },
];

export function FeedbackInbox() {
  const { entries, stats, loading } = useFeedback();
  const { people } = usePeople();
  const { items } = useContent();
  const [filter, setFilter] = useState<Filter>("all");

  const peopleById = useMemo(() => {
    const map: Record<string, Person> = {};
    for (const p of people) map[p.id] = p;
    return map;
  }, [people]);

  const contentById = useMemo(() => {
    const map: Record<string, ContentItem> = {};
    for (const c of items) map[c.id] = c;
    return map;
  }, [items]);

  const visible = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.status === filter);
  }, [entries, filter]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading feedback…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FeedbackStats
        total={stats.total}
        newCount={stats.newCount}
        addressedCount={stats.addressedCount}
        avgRating={stats.avgRating}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inbox
          </h3>
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  filter === f.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No feedback{filter === "all" ? "" : ` in “${filter}”`}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((entry) => (
              <FeedbackCard
                key={entry.id}
                entry={entry}
                author={peopleById[entry.authorId]}
                content={contentById[entry.contentId]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
