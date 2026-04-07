import type { WsMessage, WsRequest, WsResponse, WsEvent } from "./types";
import { version as clientVersion } from "../../../package.json";

type EventHandler = (payload: Record<string, unknown>) => void;
type ConnectionHandler = (state: "connected" | "disconnected" | "error") => void;

/**
 * Full runtime configuration for an OpenClaw client instance. All values
 * are normally sourced from the user settings store, so changing any of
 * them causes the provider to dispose the old client and create a new one.
 */
export interface OpenClawClientConfig {
  url: string;
  clientId: string;
  displayName: string;
  version: string;
  mode: string;
  authRole: string;
  authScopes: string[];
  minProtocol: number;
  maxProtocol: number;
  heartbeatIntervalMs: number;
  autoReconnect: boolean;
}

/**
 * Fallback URL used only when no stored or env-provided URL is available.
 * The Settings page lets non-technical users change this without editing
 * any code.
 */
export const DEFAULT_WS_URL = "ws://127.0.0.1:18789";

/** Convenience for call-sites that only know the URL (e.g. test utilities). */
export function buildDefaultConfig(
  overrides: Partial<OpenClawClientConfig> = {},
): OpenClawClientConfig {
  return {
    url: DEFAULT_WS_URL,
    clientId: "mission-control",
    displayName: "Mission Control",
    version: clientVersion,
    mode: "control-ui",
    authRole: "operator",
    authScopes: ["operator.read", "operator.write"],
    minProtocol: 3,
    maxProtocol: 3,
    heartbeatIntervalMs: 15000,
    autoReconnect: true,
    ...overrides,
  };
}

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private config: OpenClawClientConfig;
  private pendingRequests = new Map<
    string,
    {
      resolve: (res: WsResponse) => void;
      reject: (err: Error) => void;
    }
  >();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: number;
  private deviceToken: string | null = null;
  private requestId = 0;
  private disposed = false;

  constructor(config: OpenClawClientConfig) {
    this.config = config;
    this.heartbeatInterval = config.heartbeatIntervalMs;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("mc-device-token")
        : null;
    if (stored) this.deviceToken = stored;
  }

  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    try {
      this.ws = new WebSocket(this.config.url);
    } catch (err) {
      console.error("[OpenClaw] failed to construct WebSocket:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
    };

    this.ws.onmessage = (event) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("[OpenClaw] failed to parse message:", err, event.data);
        return;
      }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.notifyConnection("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = (event) => {
      console.error("[OpenClaw] WebSocket error:", event);
      this.notifyConnection("error");
    };
  }

  private handleMessage(msg: WsMessage): void {
    if (msg.type === "event") {
      this.handleEvent(msg as WsEvent);
    } else if (msg.type === "res") {
      this.handleResponse(msg as WsResponse);
    }
  }

  private handleEvent(event: WsEvent): void {
    if (event.event === "connect.challenge") {
      this.handleChallenge(event.payload);
      return;
    }
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      handlers.forEach((h) => h(event.payload));
    }
    // Also notify wildcard subscribers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) =>
        h({ event: event.event, ...event.payload }),
      );
    }
  }

  private handleResponse(res: WsResponse): void {
    const pending = this.pendingRequests.get(res.id);
    if (pending) {
      this.pendingRequests.delete(res.id);
      if (res.ok) {
        if (res.payload?.type === "hello-ok") {
          this.onHelloOk(res.payload);
        }
        pending.resolve(res);
      } else {
        pending.reject(new Error(res.error?.message ?? "Request failed"));
      }
    }
  }

  /**
   * Respond to the gateway's `connect.challenge` with a protocol-v3
   * `connect` request whose shape is driven entirely by the user-provided
   * configuration so nothing about identity or auth is hardcoded.
   */
  private handleChallenge(payload: Record<string, unknown>): void {
    this.send("connect", {
      minProtocol: this.config.minProtocol,
      maxProtocol: this.config.maxProtocol,
      client: {
        id: this.config.clientId,
        displayName: this.config.displayName,
        version: this.config.version,
        platform: "web",
        mode: this.config.mode,
      },
      auth: {
        role: this.config.authRole,
        scopes: this.config.authScopes,
        deviceToken: this.deviceToken,
        nonce: payload.nonce,
      },
    }).then(
      (res) => {
        if (!res.ok) {
          console.error("[OpenClaw] connect rejected:", res.error);
        }
      },
      (err: Error) => {
        console.error("[OpenClaw] connect request failed:", err.message);
      },
    );
  }

  private onHelloOk(payload: Record<string, unknown>): void {
    const auth = payload.auth as { deviceToken?: string } | undefined;
    if (auth?.deviceToken) {
      this.deviceToken = auth.deviceToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("mc-device-token", auth.deviceToken);
      }
    }
    const policy = payload.policy as { tickIntervalMs?: number } | undefined;
    if (policy?.tickIntervalMs) {
      this.heartbeatInterval = policy.tickIntervalMs;
    }
    this.startHeartbeat();
    this.notifyConnection("connected");
  }

  send(method: string, params?: Record<string, unknown>): Promise<WsResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const id = `req-${++this.requestId}`;
      const req: WsRequest = { type: "req", id, method, params };
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(req));

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 10000);
    });
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnection(state: "connected" | "disconnected" | "error"): void {
    this.connectionHandlers.forEach((h) => h(state));
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "req",
            id: `hb-${Date.now()}`,
            method: "ping",
          }),
        );
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed || !this.config.autoReconnect) return;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.cleanup();
    this.pendingRequests.forEach(({ reject }) =>
      reject(new Error("Client disposed")),
    );
    this.pendingRequests.clear();
    this.eventHandlers.clear();
    this.connectionHandlers.clear();
  }
}

export { clientVersion };
