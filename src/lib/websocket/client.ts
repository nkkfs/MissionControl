import type { WsMessage, WsRequest, WsResponse, WsEvent } from "./types";
import { version as clientVersion } from "../../../package.json";
import {
  clearDeviceIdentity,
  DeviceIdentityError,
  getOrCreateDeviceIdentity,
  signChallenge,
  type DeviceIdentity,
} from "./device-identity";

type EventHandler = (payload: Record<string, unknown>) => void;
type ConnectionHandler = (state: "connected" | "disconnected" | "error") => void;
type TokenHandler = (token: string) => void;
type ClientErrorHandler = (err: ClientError) => void;

/**
 * Structured error surfaced to the UI so non-technical users get a clear
 * explanation of what went wrong during the handshake. `code` is stable
 * and suitable for switch-on-value; `message` is human-readable.
 */
export interface ClientError {
  code:
    | "insecure-context"
    | "device-identity"
    | "handshake-rejected"
    | "connect-failed"
    | "socket-error";
  message: string;
  /** Optional hint the UI can show below the main message. */
  hint?: string;
}

/**
 * Full runtime configuration for an OpenClaw client instance. All values
 * are normally sourced from the user settings store, so changing any of
 * them causes the provider to dispose the old client and create a new one.
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
  /**
   * Optional device token obtained from a previous successful handshake.
   * Sent as `auth.deviceToken` on reconnects. Empty string means "no token".
   */
  deviceToken: string;
}

/** Known client.id values accepted by the OpenClaw gateway. */
export const KNOWN_CLIENT_IDS = [
  "openclaw-control-ui",
  "mission-control",
] as const;

/** Known client.mode values accepted by the OpenClaw gateway. */
export const KNOWN_CLIENT_MODES = [
  "control-ui",
  "operator",
  "ui",
  "webchat",
  "node",
  "cli",
] as const;

/**
 * Legacy single-key storage used before the deviceToken moved into the
 * settings store. Kept so existing installs migrate cleanly.
 */
const LEGACY_DEVICE_TOKEN_KEY = "mc-device-token";

export function readLegacyDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LEGACY_DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearLegacyDeviceToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_DEVICE_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Clear both the saved device identity (keypair) and any cached token. */
export function clearAllDeviceState(): void {
  clearDeviceIdentity();
  clearLegacyDeviceToken();
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
    mode: "control-ui",
    minProtocol: 3,
    maxProtocol: 3,
    heartbeatIntervalMs: 15000,
    autoReconnect: true,
    deviceToken: "",
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
  private tokenHandlers = new Set<TokenHandler>();
  private errorHandlers = new Set<ClientErrorHandler>();
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: number;
  private deviceToken: string | null;
  private requestId = 0;
  private disposed = false;
  private identity: DeviceIdentity | null = null;

  constructor(config: OpenClawClientConfig) {
    this.config = config;
    this.heartbeatInterval = config.heartbeatIntervalMs;
    // Settings store wins; fall back to legacy single-key storage for
    // backwards compatibility with the pre-settings deviceToken layout.
    this.deviceToken = config.deviceToken || readLegacyDeviceToken() || null;
  }

  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    try {
      this.ws = new WebSocket(this.config.url);
    } catch (err) {
      console.error("[OpenClaw] failed to construct WebSocket:", err);
      this.emitError({
        code: "connect-failed",
        message: `Could not open WebSocket to ${this.config.url}`,
        hint: (err as Error)?.message,
      });
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
      this.emitError({
        code: "socket-error",
        message: `WebSocket error while talking to ${this.config.url}`,
        hint: "Check that the gateway is reachable and the URL is correct. If you are on https:// the URL must be wss:// (not ws://).",
      });
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
      void this.handleChallenge(event.payload);
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
        const errMsg = res.error?.message ?? "Request failed";
        // Any failure on the `connect` request is a handshake rejection.
        if (res.id === this.currentConnectReqId) {
          this.emitError({
            code: "handshake-rejected",
            message: `Gateway rejected the handshake: ${errMsg}`,
            hint: "Check that the Client ID, Client Mode and device identity match what your gateway allows.",
          });
        }
        pending.reject(new Error(errMsg));
      }
    }
  }

  private currentConnectReqId: string | null = null;

  /**
   * Respond to the gateway's `connect.challenge` with a full protocol-v3
   * `connect` request. Flow:
   *
   *   1. Load (or generate) the persistent Ed25519 device identity.
   *   2. Read the `nonce` from the challenge payload.
   *   3. Sign `${nonce}.${deviceId}.${signedAt}` with the device private key.
   *   4. Send `connect` with `client`, `device`, and — only if we already
   *      hold one — `auth.deviceToken` for reconnect.
   *
   * Any failure at step 1 or 3 is surfaced via `emitError` so the UI can
   * display a clear reason (e.g. "insecure context — open this over https://").
   */
  private async handleChallenge(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const nonce =
      typeof payload.nonce === "string" ? (payload.nonce as string) : null;

    let identity: DeviceIdentity;
    try {
      identity = await getOrCreateDeviceIdentity();
      this.identity = identity;
    } catch (err) {
      const e = err as DeviceIdentityError;
      this.emitError({
        code: e.code === "insecure-context" ? "insecure-context" : "device-identity",
        message: e.message,
        hint:
          e.code === "insecure-context"
            ? "Open Mission Control over https:// (e.g. Tailscale Serve, Nginx + TLS) or via http://localhost."
            : "See the browser console for the raw error.",
      });
      this.notifyConnection("error");
      return;
    }

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

    // Always include the full device block. If the gateway allows
    // anonymous control-ui it will ignore the extra fields; if it
    // requires device identity this is exactly what it needs.
    if (nonce) {
      try {
        const signed = await signChallenge(identity, nonce);
        params.device = {
          id: identity.id,
          publicKey: identity.publicKey,
          signature: signed.signature,
          signedAt: signed.signedAt,
          nonce: signed.nonce,
        };
      } catch (err) {
        const e = err as DeviceIdentityError;
        this.emitError({
          code: "device-identity",
          message: e.message,
          hint: "Try clearing the saved device identity in Settings and reconnecting.",
        });
        this.notifyConnection("error");
        return;
      }
    } else {
      // No nonce in the challenge — still send the public identity so
      // the gateway can bind the session to this device.
      params.device = {
        id: identity.id,
        publicKey: identity.publicKey,
      };
    }

    // Reconnect path: include the token returned by the previous
    // successful handshake. Must never be an empty string or null.
    if (this.deviceToken) {
      params.auth = { deviceToken: this.deviceToken };
    }

    const reqId = `connect-${Date.now()}`;
    this.currentConnectReqId = reqId;
    this.sendRaw("connect", params, reqId).then(
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
    if (newToken && newToken !== this.deviceToken) {
      this.deviceToken = newToken;
      // Clear the legacy storage key on the first successful hand-off so
      // the settings store becomes the single source of truth.
      clearLegacyDeviceToken();
      this.notifyToken(newToken);
    }
    const policy = payload.policy as { tickIntervalMs?: number } | undefined;
    if (policy?.tickIntervalMs) {
      this.heartbeatInterval = policy.tickIntervalMs;
    }
    this.startHeartbeat();
    this.notifyConnection("connected");
  }

  send(method: string, params?: Record<string, unknown>): Promise<WsResponse> {
    const id = `req-${++this.requestId}`;
    return this.sendRaw(method, params, id);
  }

  private sendRaw(
    method: string,
    params: Record<string, unknown> | undefined,
    id: string,
  ): Promise<WsResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
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

  /**
   * Subscribe to deviceToken updates. Fires once per successful handshake
   * that carried a token we hadn't already seen. Used by the provider to
   * write the token back into the settings store.
   */
  onToken(handler: TokenHandler): () => void {
    this.tokenHandlers.add(handler);
    return () => {
      this.tokenHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to structured client errors. The UI uses this to render a
   * friendly banner instead of relying on the browser console.
   */
  onError(handler: ClientErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  private notifyConnection(state: "connected" | "disconnected" | "error"): void {
    this.connectionHandlers.forEach((h) => h(state));
  }

  private notifyToken(token: string): void {
    this.tokenHandlers.forEach((h) => h(token));
  }

  private emitError(err: ClientError): void {
    this.errorHandlers.forEach((h) => h(err));
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
    this.tokenHandlers.clear();
    this.errorHandlers.clear();
  }
}

export { clientVersion };
