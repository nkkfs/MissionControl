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
import { OpenClawClient } from "./client";
import type { WsResponse } from "./types";
import type { ConnectionState } from "@/types";

interface WebSocketContextValue {
  send: (method: string, params?: Record<string, unknown>) => Promise<WsResponse>;
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => () => void;
  connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  url = "ws://127.0.0.1:18789",
  children,
}: {
  url?: string;
  children: ReactNode;
}) {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const client = new OpenClawClient(url);
    clientRef.current = client;

    client.onConnection((state) => {
      setConnectionState(state === "connected" ? "connected" : state === "error" ? "error" : "disconnected");
    });

    client.connect();

    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, [url]);

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
