"use client";

import { Target } from "lucide-react";

interface MissionBannerProps {
  mission: string;
}

export function MissionBanner({ mission }: MissionBannerProps) {
  if (!mission) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 border-l-4 border-l-primary">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mission Statement
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{mission}</p>
    </div>
  );
}
