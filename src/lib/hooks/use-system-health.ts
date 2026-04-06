"use client";

import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import { useAgents } from "@/lib/hooks/use-agents";
import { useSessions } from "@/lib/hooks/use-sessions";
import { useEventStream } from "@/lib/hooks/use-event-stream";
import { useLogs } from "@/lib/hooks/use-logs";
import { COLUMN_ORDER, SESSION_STATUS_TO_COLUMN } from "@/types";
import type { ColumnName } from "@/types";

const GATEWAY_URL = "ws://127.0.0.1:18789";
const EVENT_WINDOW_MS = 60_000;
const ERROR_WINDOW_MS = 60 * 60 * 1000;

export interface SystemHealth {
  connectionState: "connecting" | "connected" | "disconnected" | "error";
  gatewayUrl: string;
  uptimeSeconds: number;
  totalAgents: number;
  onlineAgents: number;
  activeSessions: number;
  pipelineCounts: Record<ColumnName, number>;
  totalTokens: number;
  eventsPerMinute: number;
  errorCount: number;
}

export function useSystemHealth(): SystemHealth {
  const { connectionState } = useWebSocket();
  const { agents, onlineCount } = useAgents();
  const { sessions } = useSessions();
  const { events } = useEventStream();
  const { allLogs } = useLogs();

  const connectedAtRef = useRef<number | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    if (connectionState === "connected") {
      if (connectedAtRef.current === null) {
        connectedAtRef.current = Date.now();
      }
    } else {
      connectedAtRef.current = null;
      setUptimeSeconds(0);
    }
  }, [connectionState]);

  useEffect(() => {
    if (connectionState !== "connected") return;
    const tick = () => {
      if (connectedAtRef.current !== null) {
        setUptimeSeconds(Math.floor((Date.now() - connectedAtRef.current) / 1000));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connectionState]);

  const pipelineCounts = COLUMN_ORDER.reduce<Record<ColumnName, number>>(
    (acc, col) => {
      acc[col] = 0;
      return acc;
    },
    {} as Record<ColumnName, number>
  );
  for (const s of sessions) {
    const col = (SESSION_STATUS_TO_COLUMN[s.status] ?? "Backlog") as ColumnName;
    pipelineCounts[col] = (pipelineCounts[col] ?? 0) + 1;
  }

  const activeSessions = sessions.filter(
    (s) => s.status === "active" || s.status === "review"
  ).length;

  const totalTokens = sessions.reduce((sum, s) => sum + (s.usage?.tokens ?? 0), 0);

  const now = Date.now();
  const eventsPerMinute = events.filter((e) => now - e.timestamp < EVENT_WINDOW_MS).length;

  const errorCount = allLogs.filter((l) => {
    if (l.level !== "ERROR") return false;
    const t = Date.parse(l.timestamp);
    if (Number.isNaN(t)) return true;
    return now - t < ERROR_WINDOW_MS;
  }).length;

  return {
    connectionState,
    gatewayUrl: GATEWAY_URL,
    uptimeSeconds,
    totalAgents: agents.length,
    onlineAgents: onlineCount,
    activeSessions,
    pipelineCounts,
    totalTokens,
    eventsPerMinute,
    errorCount,
  };
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
