"use client";

import { Check, X, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AgentFull,
  CouncilDecision,
  CouncilVote,
} from "@/types";
import {
  COUNCIL_OUTCOME_COLORS,
  COUNCIL_OUTCOME_LABELS,
  COUNCIL_VOTE_COLORS,
} from "@/types";

interface DecisionCardProps {
  decision: CouncilDecision;
  agentsById: Record<string, AgentFull>;
}

const VOTE_ICONS: Record<CouncilVote, LucideIcon> = {
  approve: Check,
  reject: X,
  abstain: Minus,
};

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

export function DecisionCard({ decision, agentsById }: DecisionCardProps) {
  const outcomeColor = COUNCIL_OUTCOME_COLORS[decision.outcome];
  const outcomeLabel = COUNCIL_OUTCOME_LABELS[decision.outcome];
  const initiator = agentsById[decision.initiatorAgentId];
  const initiatorName = initiator?.displayName ?? decision.initiatorAgentId;

  return (
    <div
      className="rounded-lg border bg-card p-4"
      style={{
        borderColor:
          decision.outcome === "pending" ? outcomeColor : "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: outcomeColor,
            backgroundColor: `color-mix(in oklch, ${outcomeColor} 15%, transparent)`,
          }}
        >
          {outcomeLabel}
        </span>
        <span>· {formatElapsed(decision.decidedAt)}</span>
        <span>· Initiated by {initiatorName}</span>
      </div>

      <p className="mt-2 text-sm font-semibold text-foreground">
        {decision.title}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {decision.votes.map((ballot) => {
          const color = COUNCIL_VOTE_COLORS[ballot.vote];
          const agent = agentsById[ballot.agentId];
          const name = agent?.displayName ?? ballot.agentId;
          const Icon = VOTE_ICONS[ballot.vote];
          return (
            <span
              key={`${decision.id}-${ballot.agentId}`}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                color,
                backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
                border: `1px solid color-mix(in oklch, ${color} 30%, transparent)`,
              }}
            >
              <Icon className="h-2.5 w-2.5" />
              <span className="truncate">{name}</span>
            </span>
          );
        })}
      </div>

      {decision.reason && (
        <p className="mt-3 rounded border border-border bg-background p-2 text-xs text-muted-foreground">
          “{decision.reason}”
        </p>
      )}
    </div>
  );
}
