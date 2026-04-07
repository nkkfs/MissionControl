import type { WsMessage, WsRequest, WsResponse, WsEvent } from "./types";
import { version as clientVersion } from "../../../package.json";

type EventHandler = (payload: Record<string, unknown>) => void;
type ConnectionHandler = (state: "connected" | "disconnected" | "error") => void;

/**
 * Full runtime configuration for an OpenClaw client instance. All values
 * are normally sourced from the user settings store, so changing any of
 * them causes the provider to dispose the old client and create a new one.
 *
 * The protocol-v3 `connect` payload only allows a small whitelist of
 * `client.id` and `client.mode` values (the gateway validates them as a
 * JSON-schema `anyOf` of constants). The settings page restricts inputs
 * to the known-good options listed in `KNOWN_CLIENT_IDS` / `KNOWN_MODES`.
 */
export interface OpenClawClientConfig {
  url: string;
  clientId: string;
  /** Optional human-readable label kept locally; not sent in the handshake. */
  displayName: string;
  version: string;
  mode: string;
  minProtocol: number;
  maxProtocol: number;
  heartbeatIntervalMs: number;
  autoReconnect: boolean;
}

/** Known client.id values accepted by the OpenClaw gateway. */
export const KNOWN_CLIENT_IDS = [
  "openclaw-control-ui",
  "mission-control",
] as const;

/** Known client.mode values accepted by the OpenClaw gateway. */
export const KNOWN_CLIENT_MODES = [
  "operator",
  "control-ui",
  "web",
  "node",
] as const;

const DEVICE_TOKEN_KEY = "mc-device-token";

export function readSavedDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearSavedDeviceToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    // ignore
  }
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
    clientId: "openclaw-control-ui",
    displayName: "Mission Control",
    version: clientVersion,
    mode: "operator",
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
    this.deviceToken = readSavedDeviceToken();
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
   * Respond to the gateway's `connect.challenge` with a clean protocol-v3
   * `connect` request. The schema only allows:
   *
   *   minProtocol, maxProtocol, client { id, version, platform, mode },
   *   nonce (echoed from the challenge),
   *   auth.deviceToken (string, only if we already have one)
   *
   * `displayName`, `auth.role`, `auth.scopes`, and a null `deviceToken`
   * are all rejected by the gateway, so we deliberately do NOT send them.
   */
  private handleChallenge(payload: Record<string, unknown>): void {
    const params: Record<string, unknown> = {
      minProtocol: this.config.minProtocol,
      maxProtocol: this.config.maxProtocol,
      client: {
        id: this.config.clientId,
        version: this.config.version,
        platform: "web",
        mode: this.config.mode,
      },
    };

    // Echo the challenge nonce at the top level so the gateway can pair
    // the challenge with the connect response. Some deployments require
    // it, others ignore it; sending it is harmless when present.
    if (typeof payload.nonce === "string") {
      params.nonce = payload.nonce;
    }

    // Only include the auth block when we actually have a saved
    // deviceToken from a previous successful handshake. The schema
    // requires deviceToken to be a string (never null), so we omit
    // the entire auth object on first connect.
    if (this.deviceToken) {
      params.auth = { deviceToken: this.deviceToken };
    }

    this.send("connect", params).then(
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
    // The gateway may return the deviceToken either nested under auth or
    // at the top level depending on version. Accept both.
    const auth = payload.auth as { deviceToken?: string } | undefined;
    const tokenFromAuth =
      typeof auth?.deviceToken === "string" ? auth.deviceToken : null;
    const tokenFromRoot =
      typeof payload.deviceToken === "string"
        ? (payload.deviceToken as string)
        : null;
    const newToken = tokenFromAuth ?? tokenFromRoot;
    if (newToken) {
      this.deviceToken = newToken;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(DEVICE_TOKEN_KEY, newToken);
        } catch {
          // ignore quota / private mode errors
        }
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
