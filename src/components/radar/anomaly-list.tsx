"use client";

import { ShieldCheck } from "lucide-react";
import type { Anomaly } from "@/types";
import { AnomalyCard } from "./anomaly-card";

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Anomalies
        </h3>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {anomalies.length}
        </span>
      </div>
      {anomalies.length === 0 ? (
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
              All clear
            </p>
            <p className="text-xs text-muted-foreground">
              No anomalies detected.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {anomalies.map((a) => (
            <AnomalyCard key={a.id} anomaly={a} />
          ))}
        </div>
      )}
    </div>
  );
}
