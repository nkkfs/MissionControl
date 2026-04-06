"use client";

import { useMemo } from "react";
import { useApprovals } from "@/lib/hooks/use-approvals";
import { useTeam } from "@/lib/hooks/use-team";
import type { AgentFull } from "@/types";
import { ApprovalsStats } from "./approvals-stats";
import { ApprovalQueue } from "./approval-queue";

export function ApprovalsView() {
  const { pending, stats, loading } = useApprovals();
  const { agents } = useTeam();

  const agentsById = useMemo(() => {
    const map: Record<string, AgentFull> = {};
    for (const a of agents) map[a.id] = a;
    return map;
  }, [agents]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading approvals…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ApprovalsStats
        pending={stats.pending}
        approvedToday={stats.approvedToday}
        rejectedToday={stats.rejectedToday}
      />
      <ApprovalQueue pending={pending} agentsById={agentsById} />
    </div>
  );
}
