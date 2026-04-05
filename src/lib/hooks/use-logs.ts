"use client";

import { useEffect, useReducer, useState, useRef, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { LogEntry } from "@/types";

const MAX_LOGS = 500;

type LogAction =
  | { type: "ADD"; entries: LogEntry[] }
  | { type: "CLEAR" };

function logReducer(state: LogEntry[], action: LogAction): LogEntry[] {
  switch (action.type) {
    case "ADD": {
      const next = [...state, ...action.entries];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    }
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function useLogs() {
  const { send, on, connectionState } = useWebSocket();
  const [logs, dispatch] = useReducer(logReducer, []);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const pausedLogsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    if (connectionState !== "connected") return;

    send("logs.tail", { follow: true }).catch(() => {});

    const unsub = on("log", (payload) => {
      const entry: LogEntry = {
        timestamp: String(payload.timestamp ?? new Date().toISOString()),
        level: (payload.level as LogEntry["level"]) ?? "INFO",
        source: String(payload.source ?? payload.agentId ?? "system"),
        message: String(payload.message ?? payload.line ?? ""),
      };
      if (paused) {
        pausedLogsRef.current.push(entry);
      } else {
        dispatch({ type: "ADD", entries: [entry] });
      }
    });

    return unsub;
  }, [connectionState, send, on, paused]);

  const resume = useCallback(() => {
    dispatch({ type: "ADD", entries: pausedLogsRef.current });
    pausedLogsRef.current = [];
    setPaused(false);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (agentFilter && log.source !== agentFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase()) && !log.source.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return {
    logs: filteredLogs,
    allLogs: logs,
    paused,
    pendingCount: pausedLogsRef.current.length,
    filter,
    agentFilter,
    setFilter,
    setAgentFilter,
    pause: () => setPaused(true),
    resume,
    clear: () => dispatch({ type: "CLEAR" }),
  };
}
