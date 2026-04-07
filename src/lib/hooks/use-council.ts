"use client";

import { useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { CouncilDecision, CouncilOutcome } from "@/types";

export type CouncilDataSource = "live" | "mock" | "loading";

/**
 * Council decision log. Tries the gateway's `council.decisions` method
 * first, then falls back to the /api/council JSON fixture. Exposes a
 * `source` flag so the page can show a "Demo Mode" banner when the
 * gateway does not yet implement the method.
 */
export function useCouncil() {
  const { send, connectionState } = useWebSocket();
  const [decisions, setDecisions] = useState<CouncilDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<CouncilDataSource>("loading");

  // Try the gateway first, once connected.
  useEffect(() => {
    if (connectionState !== "connected") return;

    let cancelled = false;
    send("council.decisions")
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.payload) {
          const list = (res.payload as { decisions?: CouncilDecision[] }).decisions;
          if (Array.isArray(list)) {
            setDecisions(list);
            setSource("live");
            setLoading(false);
            return;
          }
        }
        // Shape unexpected — leave the fixture fallback in place.
      })
      .catch((err: Error) => {
        // Method not implemented or unreachable — we'll use the fixture.
        console.info(`[OpenClaw] council.decisions unavailable, using fixture: ${err.message}`);
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState, send]);

  // Fixture fallback. Always fetched so the page has data to show even
  // when the gateway is offline or the method is missing. If the live
  // path succeeds it overwrites this.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/council")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        // Only adopt the fixture if the live path did not already win.
        setDecisions((current) => (current.length === 0 ? data.decisions ?? [] : current));
        setSource((current) => (current === "live" ? current : "mock"));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

  return { decisions: sorted, stats, loading, source };
}
