"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Anomaly, AnomalySeverity } from "@/types";
import { ANOMALY_SEVERITY_COLORS } from "@/types";

const SEVERITY_ICONS: Record<AnomalySeverity, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface AnomalyCardProps {
  anomaly: Anomaly;
}

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const color = ANOMALY_SEVERITY_COLORS[anomaly.severity];
  const Icon = SEVERITY_ICONS[anomaly.severity];
  return (
    <div
      className="rounded-lg border bg-card p-3"
      style={{ borderColor: color }}
    >
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {anomaly.title}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                color,
                backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
              }}
            >
              {anomaly.severity}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {anomaly.description}
          </p>
        </div>
      </div>
    </div>
  );
}
