"use client";

import { useMemo, useState } from "react";
import { useCouncil } from "@/lib/hooks/use-council";
import { useTeam } from "@/lib/hooks/use-team";
import type { AgentFull, CouncilOutcome } from "@/types";
import { cn } from "@/lib/utils";
import { CouncilStats } from "./council-stats";
import { DecisionCard } from "./decision-card";

type Filter = "all" | CouncilOutcome;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "pending", label: "Pending" },
];

export function CouncilLog() {
  const { decisions, stats, loading } = useCouncil();
  const { agents } = useTeam();
  const [filter, setFilter] = useState<Filter>("all");

  const agentsById = useMemo(() => {
    const map: Record<string, AgentFull> = {};
    for (const a of agents) map[a.id] = a;
    return map;
  }, [agents]);

  const visible = useMemo(() => {
    if (filter === "all") return decisions;
    return decisions.filter((d) => d.outcome === filter);
  }, [decisions, filter]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading decisions…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CouncilStats
        total={stats.total}
        approvalRate={stats.approvalRate}
        pending={stats.pending}
        maxQuorum={stats.maxQuorum}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Decisions
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
              No decisions{filter === "all" ? "" : ` in “${filter}”`}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                agentsById={agentsById}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
