"use client";

import { useEffect, useState, useMemo } from "react";
import type { ScheduleEvent } from "@/types";

interface DayGroup {
  label: string;
  date: string;
  events: ScheduleEvent[];
}

function getDayLabel(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return "Upcoming";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function useSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo((): DayGroup[] => {
    const sorted = [...events].sort((a, b) => a.scheduledAt - b.scheduledAt);
    const groups = new Map<string, DayGroup>();

    for (const event of sorted) {
      const label = getDayLabel(event.scheduledAt);
      const date = formatDate(event.scheduledAt);
      const key = `${label}-${date}`;
      if (!groups.has(key)) {
        groups.set(key, { label, date, events: [] });
      }
      groups.get(key)!.events.push(event);
    }

    return Array.from(groups.values());
  }, [events]);

  return { events, grouped, loading };
}
