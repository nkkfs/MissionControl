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
    // Defaults match the OpenClaw gateway's allowed values for the
    // operator-style control UI. See KNOWN_CLIENT_IDS / KNOWN_CLIENT_MODES
    // in src/lib/websocket/client.ts for the full whitelist.
    clientId: "openclaw-control-ui",
    displayName: "Mission Control",
    mode: "control-ui",
    minProtocol: 3,
    maxProtocol: 3,
    heartbeatIntervalMs: 15000,
    autoReconnect: true,
    deviceToken: "",
  },
  behavior: {
    showDemoBanner: true,
    logLevel: "info",
  },
  ui: {
    theme: "dark",
  },
};

/**
 * Bumped each time the connection-related defaults change in a way that
 * could leave a stale localStorage payload pointing the client at values
 * the gateway no longer accepts. The store reads the new key only, so
 * any older payload is ignored and replaced on next save.
 *
 * v3: default mode switched from "operator" to "control-ui" after the
 *     gateway tightened its `client.mode` schema.
 * v4: added `deviceToken` field as the single source of truth for the
 *     gateway-issued device token (replaces the legacy `mc-device-token`
 *     localStorage key).
 */
export const SETTINGS_STORAGE_KEY = "mc-settings-v4";

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

