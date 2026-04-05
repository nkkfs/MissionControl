"use client";

import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { LiveEvent } from "@/types";

const MAX_EVENTS = 200;
let eventCounter = 0;

type EventAction =
  | { type: "ADD"; event: LiveEvent }
  | { type: "CLEAR" };

function eventReducer(state: LiveEvent[], action: EventAction): LiveEvent[] {
  switch (action.type) {
    case "ADD": {
      const next = [...state, action.event];
      return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
    }
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function useEventStream() {
  const { on, connectionState } = useWebSocket();
  const [events, dispatch] = useReducer(eventReducer, []);
  const [paused, setPaused] = useState(false);
  const pausedEventsRef = useRef<LiveEvent[]>([]);

  useEffect(() => {
    if (connectionState !== "connected") return;

    function addEvent(
      agentId: string,
      type: LiveEvent["type"],
      summary: string
    ) {
      const event: LiveEvent = {
        id: `evt-${++eventCounter}`,
        timestamp: Date.now(),
        agentId,
        type,
        summary,
      };
      if (paused) {
        pausedEventsRef.current.push(event);
      } else {
        dispatch({ type: "ADD", event });
      }
    }

    const unsubs = [
      on("session.tool", (p) =>
        addEvent(String(p.agentId ?? "system"), "session.tool", `tool: ${p.tool ?? p.method ?? "unknown"}`)
      ),
      on("session.message", (p) =>
        addEvent(String(p.agentId ?? "system"), "session.message", String(p.content ?? p.message ?? ""))
      ),
      on("agent.status", (p) =>
        addEvent(String(p.id ?? "system"), "agent.status", `status → ${p.status}`)
      ),
      on("presence", (p) =>
        addEvent(String(p.id ?? p.agentId ?? "system"), "presence", `${p.online ? "connected" : "disconnected"}`)
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [connectionState, on, paused]);

  const resume = useCallback(() => {
    pausedEventsRef.current.forEach((e) => dispatch({ type: "ADD", event: e }));
    pausedEventsRef.current = [];
    setPaused(false);
  }, []);

  return {
    events,
    paused,
    pendingCount: pausedEventsRef.current.length,
    pause: () => setPaused(true),
    resume,
    clear: () => dispatch({ type: "CLEAR" }),
  };
}
