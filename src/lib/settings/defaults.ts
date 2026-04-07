import type { AppSettings } from "./types";

/**
 * If the user set `NEXT_PUBLIC_OPENCLAW_WS_URL` at build time we use it as
 * the initial default so that environments without any saved settings still
 * point at the configured gateway. Once the user edits the value in the
 * Settings page the localStorage copy wins.
 */
const ENV_WS_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_OPENCLAW_WS_URL
    : undefined;

export const DEFAULT_WS_URL = "ws://127.0.0.1:18789";

export const DEFAULT_SETTINGS: AppSettings = {
  connection: {
    wsUrl: ENV_WS_URL ?? DEFAULT_WS_URL,
    clientId: "mission-control",
    displayName: "Mission Control",
    mode: "control-ui",
    authRole: "operator",
    authScopes: "operator.read, operator.write",
    minProtocol: 3,
    maxProtocol: 3,
    heartbeatIntervalMs: 15000,
    autoReconnect: true,
  },
  behavior: {
    showDemoBanner: true,
    logLevel: "info",
  },
  ui: {
    theme: "dark",
  },
};

export const SETTINGS_STORAGE_KEY = "mc-settings-v1";

/** Merge a partial settings patch on top of a base, preserving all sections. */
export function mergeSettings(
  base: AppSettings,
  patch: Partial<AppSettings>,
): AppSettings {
  return {
    connection: { ...base.connection, ...(patch.connection ?? {}) },
    behavior: { ...base.behavior, ...(patch.behavior ?? {}) },
    ui: { ...base.ui, ...(patch.ui ?? {}) },
  };
}

/** Parse the comma-separated `authScopes` string into a trimmed list. */
export function parseAuthScopes(scopes: string): string[] {
  return scopes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
