/**
 * User-configurable settings for Mission Control. Persisted in localStorage
 * so that non-technical users can point the app at their own OpenClaw
 * instance without editing any code.
 */

export type LogLevel = "quiet" | "info" | "debug";
export type Theme = "dark" | "light";

export interface ConnectionSettings {
  /** WebSocket URL of the OpenClaw gateway. */
  wsUrl: string;
  /** Identity reported to the gateway during handshake. */
  clientId: string;
  displayName: string;
  /** `mode` field in the handshake `client` object. */
  mode: string;
  /** Auth role requested during the handshake. */
  authRole: string;
  /**
   * Comma-separated list of auth scopes requested during the handshake.
   * Stored as a string for easy editing; parsed into an array before use.
   */
  authScopes: string;
  /** Protocol version range advertised to the gateway. */
  minProtocol: number;
  maxProtocol: number;
  /** Heartbeat interval in milliseconds (gateway policy may override). */
  heartbeatIntervalMs: number;
  /** Whether to automatically reconnect after a dropped connection. */
  autoReconnect: boolean;
}

export interface BehaviorSettings {
  /**
   * Whether to show the amber "Demo Mode — Mock Data" banner on pages that
   * fall back to fixture data. Hiding it does not stop the mock data from
   * loading — it only suppresses the banner.
   */
  showDemoBanner: boolean;
  /** Verbosity of client-side logging. */
  logLevel: LogLevel;
}

export interface UiSettings {
  theme: Theme;
}

export interface AppSettings {
  connection: ConnectionSettings;
  behavior: BehaviorSettings;
  ui: UiSettings;
}
