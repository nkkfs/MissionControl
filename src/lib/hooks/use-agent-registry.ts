"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import { useTeam } from "./use-team";
import type { AgentFull, AgentMeta, AgentStatus } from "@/types";

export type DataSource = "live" | "mock" | "loading";

/**
 * Registry view of all agents for the Agents page. Tries the gateway's
 * `agents.registry` method first and falls back to the /api/team JSON
 * fixture (via useTeam) when the method is unavailable or the gateway
 * is not connected. Exposes a `source` flag so the page can render a
 * "Demo Mode" banner when live data is not available.
 */
export function useAgentRegistry() {
  const { send, connectionState } = useWebSocket();
  const teamFallback = useTeam();

  const [liveAgents, setLiveAgents] = useState<AgentFull[] | null>(null);
  const [source, setSource] = useState<DataSource>("loading");

  useEffect(() => {
    if (connectionState !== "connected") {
      // Fall through to the fixture-backed useTeam data.
      return;
    }

    let cancelled = false;
    send("agents.registry")
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.payload) {
          const list = (res.payload as { agents?: Array<Record<string, unknown>> }).agents;
          if (Array.isArray(list)) {
            const mapped: AgentFull[] = list.map((a) => {
              const meta = a as Partial<AgentMeta> & { status?: AgentStatus; lastSeen?: number; currentTask?: string | null; name?: string };
              return {
                id: String(meta.id ?? ""),
                name: String(meta.name ?? meta.displayName ?? meta.id ?? ""),
                displayName: String(meta.displayName ?? meta.name ?? meta.id ?? ""),
                role: String(meta.role ?? "Unknown"),
                description: String(meta.description ?? ""),
                model: String(meta.model ?? "Unknown"),
                tools: Array.isArray(meta.tools) ? meta.tools.map(String) : [],
                avatarColor: String(meta.avatarColor ?? "#6B7280"),
                status: (meta.status as AgentStatus) ?? "offline",
                lastSeen: Number(meta.lastSeen ?? 0),
                currentTask: (meta.currentTask as string | null) ?? null,
              };
            });
            setLiveAgents(mapped);
            setSource("live");
            return;
          }
        }
        // Method responded but shape unexpected — treat as unavailable.
        setLiveAgents(null);
        setSource("mock");
      })
      .catch((err: Error) => {
        // Method is unknown or timed out — this is expected when the
        // gateway does not implement agents.registry yet. Log and fall
        // back to the fixture quietly.
        console.info(`[OpenClaw] agents.registry unavailable, using fixture: ${err.message}`);
        if (cancelled) return;
        setLiveAgents(null);
        setSource("mock");
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState, send]);

  if (source === "live" && liveAgents) {
    return {
      agents: liveAgents,
      loading: false,
      source: "live" as const,
    };
  }

  // Fixture fallback (or still loading initial team fetch).
  return {
    agents: teamFallback.agents,
    loading: teamFallback.loading && source === "loading",
    source: teamFallback.loading && source === "loading" ? ("loading" as const) : ("mock" as const),
  };
}
