"use client";

import { useEffect, useMemo, useState } from "react";
import type { CouncilDecision, CouncilOutcome } from "@/types";

export function useCouncil() {
  const [decisions, setDecisions] = useState<CouncilDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/council")
      .then((r) => r.json())
      .then((data) => {
        setDecisions(data.decisions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...decisions].sort((a, b) => b.decidedAt - a.decidedAt),
    [decisions],
  );

  const byOutcome = useMemo(() => {
    const counts: Record<CouncilOutcome, number> = {
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    for (const d of decisions) counts[d.outcome] = (counts[d.outcome] ?? 0) + 1;
    return counts;
  }, [decisions]);

  const stats = useMemo(() => {
    const total = decisions.length;
    const decided = byOutcome.approved + byOutcome.rejected;
    const approvalRate = decided === 0 ? 0 : byOutcome.approved / decided;
    const maxQuorum = decisions.reduce(
      (max, d) => Math.max(max, d.votes.length),
      0,
    );
    return {
      total,
      approved: byOutcome.approved,
      rejected: byOutcome.rejected,
      pending: byOutcome.pending,
      approvalRate,
      maxQuorum,
    };
  }, [decisions, byOutcome]);

  return { decisions: sorted, stats, loading };
}
