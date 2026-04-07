"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { OpenClawClient, DEFAULT_WS_URL } from "./client";
import type { WsResponse } from "./types";
import type { ConnectionState } from "@/types";

interface WebSocketContextValue {
  send: (method: string, params?: Record<string, unknown>) => Promise<WsResponse>;
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => () => void;
  connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// Resolve the gateway URL from NEXT_PUBLIC_OPENCLAW_WS_URL so non-technical
// users can point Mission Control at a remote OpenClaw instance by setting
// an env var instead of editing code. Falls back to loopback for dev.
const ENV_WS_URL =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_OPENCLAW_WS_URL : undefined;

export function WebSocketProvider({
  url,
  children,
}: {
  url?: string;
  children: ReactNode;
}) {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  const effectiveUrl = url ?? ENV_WS_URL ?? DEFAULT_WS_URL;

  useEffect(() => {
    console.info(`[OpenClaw] connecting to ${effectiveUrl}`);
    const client = new OpenClawClient(effectiveUrl);
    clientRef.current = client;

    client.onConnection((state) => {
      setConnectionState(state === "connected" ? "connected" : state === "error" ? "error" : "disconnected");
    });

    client.connect();

    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, [effectiveUrl]);

  const send = useCallback(
    (method: string, params?: Record<string, unknown>) => {
      if (!clientRef.current) return Promise.reject(new Error("No client"));
      return clientRef.current.send(method, params);
    },
    []
  );

  const on = useCallback(
    (event: string, handler: (payload: Record<string, unknown>) => void) => {
      if (!clientRef.current) return () => {};
      return clientRef.current.on(event, handler);
    },
    []
  );

  return (
    <WebSocketContext.Provider value={{ send, on, connectionState }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
