"use client";

import { Star } from "lucide-react";
import type { FeedbackEntry, Person, ContentItem } from "@/types";
import { FEEDBACK_STATUS_COLORS, FEEDBACK_STATUS_LABELS } from "@/types";

interface FeedbackCardProps {
  entry: FeedbackEntry;
  author: Person | undefined;
  content: ContentItem | undefined;
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

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rating;
        return (
          <Star
            key={i}
            className="h-3 w-3"
            style={{
              color: filled ? "var(--status-amber)" : "var(--border)",
              fill: filled ? "var(--status-amber)" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

export function FeedbackCard({ entry, author, content }: FeedbackCardProps) {
  const statusColor = FEEDBACK_STATUS_COLORS[entry.status];
  const statusLabel = FEEDBACK_STATUS_LABELS[entry.status];
  const authorName = author?.name ?? entry.authorId;
  const contentTitle = content?.title ?? entry.contentId;

  return (
    <div
      className="rounded-lg border bg-card p-4"
      style={{
        borderColor: entry.status === "new" ? statusColor : "var(--border)",
      }}
    >
      <div className="flex items-center gap-2">
        <Stars rating={entry.rating} />
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: statusColor,
            backgroundColor: `color-mix(in oklch, ${statusColor} 15%, transparent)`,
          }}
        >
          {statusLabel}
        </span>
        <span className="text-[11px] text-muted-foreground">
          · {authorName} · {formatElapsed(entry.submittedAt)}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-foreground">
        {contentTitle}
      </p>
      <p className="mt-1 rounded border border-border bg-background p-2 text-xs text-muted-foreground">
        “{entry.comment}”
      </p>
    </div>
  );
}
