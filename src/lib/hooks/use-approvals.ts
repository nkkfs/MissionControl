"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApprovalRequest } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function useApprovals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((data) => {
        setApprovals(data.approvals ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = useMemo(
    () =>
      approvals
        .filter((a) => a.status === "pending")
        .sort((a, b) => {
          // high priority first, then oldest request first
          if (a.priority !== b.priority) {
            return a.priority === "high" ? -1 : 1;
          }
          return a.requestedAt - b.requestedAt;
        }),
    [approvals]
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const approvedToday = approvals.filter(
      (a) =>
        a.status === "approved" &&
        a.decidedAt !== null &&
        now - a.decidedAt < DAY_MS
    ).length;
    const rejectedToday = approvals.filter(
      (a) =>
        a.status === "rejected" &&
        a.decidedAt !== null &&
        now - a.decidedAt < DAY_MS
    ).length;
    return {
      pending: pending.length,
      approvedToday,
      rejectedToday,
    };
  }, [approvals, pending.length]);

  return { approvals, pending, stats, loading };
}
