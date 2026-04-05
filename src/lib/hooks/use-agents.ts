"use client";

import { useEffect, useReducer } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { Agent, AgentStatus } from "@/types";

type AgentAction =
  | { type: "SET_ALL"; agents: Agent[] }
  | { type: "UPDATE_STATUS"; id: string; status: AgentStatus; lastSeen: number; currentTask: string | null; name?: string }
  | { type: "SET_PRESENCE"; id: string; online: boolean; lastSeen: number };

function agentReducer(state: Agent[], action: AgentAction): Agent[] {
  switch (action.type) {
    case "SET_ALL":
      return action.agents;
    case "UPDATE_STATUS":
      return state.map((a) =>
        a.id === action.id
          ? { ...a, status: action.status, lastSeen: action.lastSeen, currentTask: action.currentTask, name: action.name ?? a.name }
          : a
      );
    case "SET_PRESENCE": {
      const exists = state.find((a) => a.id === action.id);
      if (exists) {
        return state.map((a) =>
          a.id === action.id
            ? { ...a, status: action.online ? (a.status === "offline" ? "idle" : a.status) : "offline", lastSeen: action.lastSeen }
            : a
        );
      }
      return [...state, { id: action.id, name: action.id, status: action.online ? "idle" : "offline", lastSeen: action.lastSeen, currentTask: null }];
    }
    default:
      return state;
  }
}

export function useAgents() {
  const { send, on, connectionState } = useWebSocket();
  const [agents, dispatch] = useReducer(agentReducer, []);

  useEffect(() => {
    if (connectionState !== "connected") return;

    send("agents.list").then((res) => {
      if (res.ok && res.payload) {
        const list = (res.payload as { agents?: Array<Record<string, unknown>> }).agents;
        if (Array.isArray(list)) {
          dispatch({
            type: "SET_ALL",
            agents: list.map((a) => ({
              id: String(a.id ?? ""),
              name: String(a.name ?? a.id ?? ""),
              status: (a.status as AgentStatus) ?? "offline",
              lastSeen: Number(a.lastSeen ?? Date.now()),
              currentTask: (a.currentTask as string) ?? null,
            })),
          });
        }
      }
    }).catch(() => {});

    const unsub1 = on("agent.status", (payload) => {
      dispatch({
        type: "UPDATE_STATUS",
        id: String(payload.id),
        status: payload.status as AgentStatus,
        lastSeen: Number(payload.lastSeen ?? Date.now()),
        currentTask: (payload.currentTask as string) ?? null,
        name: payload.name as string | undefined,
      });
    });

    const unsub2 = on("presence", (payload) => {
      dispatch({
        type: "SET_PRESENCE",
        id: String(payload.id ?? payload.agentId),
        online: Boolean(payload.online ?? payload.status === "online"),
        lastSeen: Number(payload.lastSeen ?? Date.now()),
      });
    });

    return () => { unsub1(); unsub2(); };
  }, [connectionState, send, on]);

  const onlineCount = agents.filter((a) => a.status !== "offline").length;

  return { agents, onlineCount };
}
