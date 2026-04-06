"use client";

import { ShieldCheck } from "lucide-react";
import type { ApprovalRequest, AgentFull } from "@/types";
import { ApprovalCard } from "./approval-card";

interface ApprovalQueueProps {
  pending: ApprovalRequest[];
  agentsById: Record<string, AgentFull>;
}

export function ApprovalQueue({ pending, agentsById }: ApprovalQueueProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pending Queue
        </h3>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {pending.length}
        </span>
      </div>
      {pending.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <ShieldCheck
            className="h-5 w-5"
            style={{ color: "var(--status-green)" }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--status-green)" }}
            >
              Queue clear
            </p>
            <p className="text-xs text-muted-foreground">
              No pending approval requests.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              requester={agentsById[approval.requesterAgentId]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
