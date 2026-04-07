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

interface WebSocketContextValue {
  send: (method: string, params?: Record<string, unknown>) => Promise<WsResponse>;
  on: (
    event: string,
    handler: (payload: Record<string, unknown>) => void,
  ) => () => void;
  connectionState: ConnectionState;
  /** Force-rebuild the underlying client (e.g. after clearing the device token). */
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  // Bumping this counter forces the connection effect to tear down and
  // re-create the client even when no settings field has changed.
  const [reconnectNonce, setReconnectNonce] = useState(0);

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
    reconnectNonce,
    conn.wsUrl,
    conn.clientId,
    conn.displayName,
    conn.mode,
    conn.minProtocol,
    conn.maxProtocol,
    conn.heartbeatIntervalMs,
    conn.autoReconnect,
  ]);

  const reconnect = useCallback(() => {
    setReconnectNonce((n) => n + 1);
  }, []);

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
    <WebSocketContext.Provider value={{ send, on, connectionState, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
