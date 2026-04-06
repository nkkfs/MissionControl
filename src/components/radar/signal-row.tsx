"use client";

import type { LiveEvent } from "@/types";
import { ANOMALY_SEVERITY_COLORS } from "@/types";
import { classifySignal } from "@/lib/hooks/use-radar";

interface SignalRowProps {
  event: LiveEvent;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function SignalRow({ event }: SignalRowProps) {
  const severity = classifySignal(event);
  const color = ANOMALY_SEVERITY_COLORS[severity];

  return (
    <li className="flex items-center gap-3 px-4 py-1.5 font-mono text-[11px] hover:bg-accent/30">
      <span className="tabular-nums text-muted-foreground">
        {formatTime(event.timestamp)}
      </span>
      <span
        className="w-12 shrink-0 text-[9px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {severity}
      </span>
      <span className="w-24 shrink-0 truncate text-foreground">
        {event.agentId}
      </span>
      <span className="flex-1 truncate text-muted-foreground">
        {event.summary}
      </span>
    </li>
  );
}
