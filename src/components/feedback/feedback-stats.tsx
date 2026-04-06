"use client";

import { Inbox, Star, CheckCircle2, MessageSquare } from "lucide-react";

interface FeedbackStatsProps {
  total: number;
  newCount: number;
  addressedCount: number;
  avgRating: number;
}

export function FeedbackStats({
  total,
  newCount,
  addressedCount,
  avgRating,
}: FeedbackStatsProps) {
  const stats = [
    {
      label: "New",
      value: newCount.toString(),
      icon: Inbox,
      color: "var(--status-amber)",
    },
    {
      label: "Avg rating",
      value: avgRating === 0 ? "—" : avgRating.toFixed(1),
      icon: Star,
      color: "var(--status-blue)",
    },
    {
      label: "Addressed",
      value: addressedCount.toString(),
      icon: CheckCircle2,
      color: "var(--status-green)",
    },
    {
      label: "Total",
      value: total.toString(),
      icon: MessageSquare,
      color: "var(--primary)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
            </div>
            <p
              className="mt-2 text-2xl font-semibold tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
