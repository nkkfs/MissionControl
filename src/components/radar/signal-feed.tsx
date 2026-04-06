"use client";

import { useState } from "react";
import type { LiveEvent, AnomalySeverity } from "@/types";
import { classifySignal } from "@/lib/hooks/use-radar";
import { SignalRow } from "./signal-row";

interface SignalFeedProps {
  signals: LiveEvent[];
}

type Filter = "all" | AnomalySeverity;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

export function SignalFeed({ signals }: SignalFeedProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? signals
      : signals.filter((e) => classifySignal(e) === filter);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Signal Feed
        </h3>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                filter === f.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No signals match the current filter.
          </p>
        </div>
      ) : (
        <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
          {filtered.map((event) => (
            <SignalRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
