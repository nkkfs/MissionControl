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
import {
  OpenClawClient,
  clientVersion,
  type OpenClawClientConfig,
} from "./client";
import type { WsResponse } from "./types";
import type { ConnectionState } from "@/types";
import { useSettings } from "@/lib/settings/store";
import { parseAuthScopes } from "@/lib/settings/defaults";

interface WebSocketContextValue {
  send: (method: string, params?: Record<string, unknown>) => Promise<WsResponse>;
  on: (
    event: string,
    handler: (payload: Record<string, unknown>) => void,
  ) => () => void;
  connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const { settings, hydrated } = useSettings();
  const conn = settings.connection;

  // Rebuild the client whenever any connection-affecting setting changes.
  // This is what makes settings apply immediately without a page reload.
  useEffect(() => {
    if (!hydrated) {
      // Wait for localStorage to load so we do not briefly connect with
      // stale defaults.
      return;
    }

    const config: OpenClawClientConfig = {
      url: conn.wsUrl,
      clientId: conn.clientId,
      displayName: conn.displayName,
      version: clientVersion,
      mode: conn.mode,
      authRole: conn.authRole,
      authScopes: parseAuthScopes(conn.authScopes),
      minProtocol: conn.minProtocol,
      maxProtocol: conn.maxProtocol,
      heartbeatIntervalMs: conn.heartbeatIntervalMs,
      autoReconnect: conn.autoReconnect,
    };

    console.info(`[OpenClaw] connecting to ${config.url}`);
    const client = new OpenClawClient(config);
    clientRef.current = client;
    setConnectionState("connecting");

    const offConnection = client.onConnection((state) => {
      setConnectionState(
        state === "connected"
          ? "connected"
          : state === "error"
            ? "error"
            : "disconnected",
      );
    });

    client.connect();

    return () => {
      offConnection();
      client.dispose();
      if (clientRef.current === client) clientRef.current = null;
    };
  }, [
    hydrated,
    conn.wsUrl,
    conn.clientId,
    conn.displayName,
    conn.mode,
    conn.authRole,
    conn.authScopes,
    conn.minProtocol,
    conn.maxProtocol,
    conn.heartbeatIntervalMs,
    conn.autoReconnect,
  ]);

  const send = useCallback(
    (method: string, params?: Record<string, unknown>) => {
      if (!clientRef.current) return Promise.reject(new Error("No client"));
      return clientRef.current.send(method, params);
    },
    [],
  );

  const on = useCallback(
    (event: string, handler: (payload: Record<string, unknown>) => void) => {
      if (!clientRef.current) return () => {};
      return clientRef.current.on(event, handler);
    },
    [],
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
