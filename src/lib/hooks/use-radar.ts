"use client";

import { useMemo } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import { useAgents } from "@/lib/hooks/use-agents";
import { useSessions } from "@/lib/hooks/use-sessions";
import { useEventStream } from "@/lib/hooks/use-event-stream";
import { useLogs } from "@/lib/hooks/use-logs";
import type { Anomaly, LiveEvent } from "@/types";

const OFFLINE_THRESHOLD_MS = 60_000;
const STUCK_SESSION_MS = 10 * 60_000;
const ERROR_SPIKE_WINDOW_MS = 5 * 60_000;
const ERROR_SPIKE_THRESHOLD = 3;

export interface RadarState {
  anomalies: Anomaly[];
  signals: LiveEvent[];
}

export function useRadar(): RadarState {
  const { connectionState } = useWebSocket();
  const { agents } = useAgents();
  const { sessions } = useSessions();
  const { events } = useEventStream();
  const { allLogs } = useLogs();

  const anomalies = useMemo<Anomaly[]>(() => {
    const now = Date.now();
    const out: Anomaly[] = [];

    // 1) Gateway disconnected
    if (connectionState !== "connected") {
      out.push({
        id: "gateway-disconnected",
        severity: "critical",
        title: "Gateway disconnected",
        description:
          connectionState === "connecting"
            ? "Attempting to reach the OpenClaw gateway…"
            : `Connection state: ${connectionState}`,
        timestamp: now,
      });
    }

    // 2) Agents in error state
    for (const agent of agents) {
      if (agent.status === "error") {
        out.push({
          id: `agent-error-${agent.id}`,
          severity: "critical",
          title: `Agent error · ${agent.name}`,
          description: "Agent is reporting an error state.",
          timestamp: agent.lastSeen,
        });
      }
    }

    // 3) Agents offline beyond threshold
    for (const agent of agents) {
      if (
        agent.status === "offline" &&
        now - agent.lastSeen > OFFLINE_THRESHOLD_MS
      ) {
        const seconds = Math.floor((now - agent.lastSeen) / 1000);
        const label =
          seconds >= 60 ? `${Math.floor(seconds / 60)}m` : `${seconds}s`;
        out.push({
          id: `agent-offline-${agent.id}`,
          severity: "warning",
          title: `Agent offline · ${agent.name}`,
          description: `Last seen ${label} ago.`,
          timestamp: agent.lastSeen,
        });
      }
    }

    // 4) Stuck sessions
    for (const session of sessions) {
      if (
        session.status === "active" &&
        now - session.startedAt > STUCK_SESSION_MS
      ) {
        const minutes = Math.floor((now - session.startedAt) / 60_000);
        out.push({
          id: `stuck-session-${session.key}`,
          severity: "warning",
          title: `Stuck session · ${session.key}`,
          description: `Active for ${minutes} min with no recent progress.`,
          timestamp: session.startedAt,
        });
      }
    }

    // 5) Error spike in logs
    const recentErrors = allLogs.filter((l) => {
      if (l.level !== "ERROR") return false;
      const t = Date.parse(l.timestamp);
      if (Number.isNaN(t)) return true;
      return now - t < ERROR_SPIKE_WINDOW_MS;
    });
    if (recentErrors.length > ERROR_SPIKE_THRESHOLD) {
      out.push({
        id: "error-spike",
        severity: "critical",
        title: "Error spike detected",
        description: `${recentErrors.length} errors in the last 5 minutes.`,
        timestamp: now,
      });
    }

    // Sort: critical first, then by recency
    return out.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === "critical" ? -1 : 1;
      }
      return b.timestamp - a.timestamp;
    });
  }, [connectionState, agents, sessions, allLogs]);

  // Most recent 100 signals, newest first
  const signals = useMemo(() => [...events].reverse().slice(0, 100), [events]);

  return { anomalies, signals };
}

export function classifySignal(event: LiveEvent): "critical" | "warning" | "info" {
  if (event.type === "agent.status" && event.summary.includes("error")) {
    return "warning";
  }
  if (event.type === "presence" && event.summary.includes("disconnected")) {
    return "warning";
  }
  return "info";
}
