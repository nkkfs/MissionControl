"use client";

import { AlertTriangle } from "lucide-react";
import type { ApprovalRequest, AgentFull } from "@/types";
import { APPROVAL_PRIORITY_COLORS } from "@/types";

interface ApprovalCardProps {
  approval: ApprovalRequest;
  requester: AgentFull | undefined;
}

function formatElapsed(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

export function ApprovalCard({ approval, requester }: ApprovalCardProps) {
  const color = APPROVAL_PRIORITY_COLORS[approval.priority];
  const requesterName = requester?.displayName ?? approval.requesterAgentId;

  return (
    <div
      className="rounded-lg border bg-card p-4"
      style={{
        borderColor: approval.priority === "high" ? color : "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {approval.priority === "high" && (
              <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />
            )}
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                color,
                backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
              }}
            >
              {approval.priority}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {approval.title}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Requested by {requesterName} · {formatElapsed(approval.requestedAt)}
          </p>
          <p className="mt-2 rounded border border-border bg-background p-2 text-xs text-muted-foreground">
            {approval.message}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Reject
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Approve
        </button>
      </div>
    </div>
  );
}
