"use client";

import { useEffect, useReducer } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { Session, SessionStatus } from "@/types";
import { SESSION_STATUS_TO_COLUMN } from "@/types";

type SessionAction =
  | { type: "SET_ALL"; sessions: Session[] }
  | { type: "UPDATE"; session: Partial<Session> & { key: string } }
  | { type: "REMOVE"; key: string };

function sessionReducer(state: Session[], action: SessionAction): Session[] {
  switch (action.type) {
    case "SET_ALL":
      return action.sessions;
    case "UPDATE": {
      const exists = state.find((s) => s.key === action.session.key);
      if (exists) {
        return state.map((s) =>
          s.key === action.session.key ? { ...s, ...action.session } : s
        );
      }
      return [...state, {
        key: action.session.key,
        agentId: action.session.agentId ?? "unknown",
        status: action.session.status ?? "queued",
        startedAt: action.session.startedAt ?? Date.now(),
        lastActivity: action.session.lastActivity ?? "",
        description: action.session.description,
        usage: action.session.usage ?? { tokens: 0 },
      } as Session];
    }
    case "REMOVE":
      return state.filter((s) => s.key !== action.key);
    default:
      return state;
  }
}

export function useSessions() {
  const { send, on, connectionState } = useWebSocket();
  const [sessions, dispatch] = useReducer(sessionReducer, []);

  useEffect(() => {
    if (connectionState !== "connected") return;

    send("sessions.list").then((res) => {
      if (res.ok && res.payload) {
        const list = (res.payload as { sessions?: Array<Record<string, unknown>> }).sessions;
        if (Array.isArray(list)) {
          dispatch({
            type: "SET_ALL",
            sessions: list.map((s) => ({
              key: String(s.key ?? ""),
              agentId: String(s.agentId ?? ""),
              status: (s.status as SessionStatus) ?? "queued",
              startedAt: Number(s.startedAt ?? Date.now()),
              lastActivity: String(s.lastActivity ?? ""),
              description: s.description as string | undefined,
              usage: {
                tokens: Number((s.usage as Record<string, unknown>)?.tokens ?? 0),
                toolCalls: Number((s.usage as Record<string, unknown>)?.toolCalls ?? 0),
              },
            })),
          });
        }
      }
    }).catch(() => {});

    const unsub1 = on("sessions.changed", (payload) => {
      dispatch({
        type: "UPDATE",
        session: {
          key: String(payload.key ?? payload.sessionKey),
          agentId: payload.agentId as string | undefined,
          status: payload.status as SessionStatus | undefined,
          lastActivity: payload.lastActivity as string | undefined,
          description: payload.description as string | undefined,
          usage: payload.usage as Session["usage"] | undefined,
        },
      });
    });

    const unsub2 = on("session.tool", (payload) => {
      const key = String(payload.sessionKey ?? payload.key);
      if (key) {
        dispatch({
          type: "UPDATE",
          session: {
            key,
            lastActivity: `tool: ${payload.tool ?? payload.method ?? "unknown"}`,
          },
        });
      }
    });

    const unsub3 = on("session.message", (payload) => {
      const key = String(payload.sessionKey ?? payload.key);
      if (key) {
        dispatch({
          type: "UPDATE",
          session: {
            key,
            lastActivity: String(payload.content ?? payload.message ?? "message"),
          },
        });
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [connectionState, send, on]);

  const sessionsByColumn = sessions.reduce<Record<string, Session[]>>(
    (acc, session) => {
      const column = SESSION_STATUS_TO_COLUMN[session.status] ?? "Backlog";
      if (!acc[column]) acc[column] = [];
      acc[column].push(session);
      return acc;
    },
    {}
  );

  return { sessions, sessionsByColumn };
}
