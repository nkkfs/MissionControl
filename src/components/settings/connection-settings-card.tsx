"use client";

import { useWebSocket } from "@/lib/websocket/provider";
import { useSettings } from "@/lib/settings/store";
import { SettingsSection } from "./settings-section";
import {
  NumberField,
  TextField,
  ToggleField,
} from "./setting-field";
import { TestConnectionPanel } from "./test-connection-panel";
import { Wifi, WifiOff, CircleAlert } from "lucide-react";

/**
 * Edits every connection-related field the OpenClawClient uses. Changing
 * any value immediately tears down the live client and opens a new one.
 */
export function ConnectionSettingsCard() {
  const { settings, updateConnection } = useSettings();
  const { connectionState } = useWebSocket();
  const conn = settings.connection;

  return (
    <SettingsSection
      title="OpenClaw Connection"
      description="How Mission Control talks to your gateway. Changes take effect immediately."
    >
      <LiveStatus state={connectionState} url={conn.wsUrl} />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="WebSocket URL"
          help="e.g. ws://127.0.0.1:18789 or ws://server.local:18789"
          value={conn.wsUrl}
          onChange={(wsUrl) => updateConnection({ wsUrl })}
          type="url"
        />
        <TextField
          label="Client ID"
          help="Sent as client.id during handshake"
          value={conn.clientId}
          onChange={(clientId) => updateConnection({ clientId })}
        />
        <TextField
          label="Display Name"
          help="Sent as client.displayName"
          value={conn.displayName}
          onChange={(displayName) => updateConnection({ displayName })}
        />
        <TextField
          label="Mode"
          help="Sent as client.mode (e.g. control-ui, observer)"
          value={conn.mode}
          onChange={(mode) => updateConnection({ mode })}
        />
        <TextField
          label="Auth Role"
          help="Sent as auth.role"
          value={conn.authRole}
          onChange={(authRole) => updateConnection({ authRole })}
        />
        <TextField
          label="Auth Scopes"
          help="Comma-separated list, sent as auth.scopes"
          value={conn.authScopes}
          onChange={(authScopes) => updateConnection({ authScopes })}
        />
        <NumberField
          label="Min Protocol"
          help="Lowest protocol version the client will accept"
          value={conn.minProtocol}
          min={1}
          max={99}
          onChange={(minProtocol) => updateConnection({ minProtocol })}
        />
        <NumberField
          label="Max Protocol"
          help="Highest protocol version the client will accept"
          value={conn.maxProtocol}
          min={1}
          max={99}
          onChange={(maxProtocol) => updateConnection({ maxProtocol })}
        />
        <NumberField
          label="Heartbeat (ms)"
          help="Interval between ping requests. Gateway policy may override."
          value={conn.heartbeatIntervalMs}
          min={1000}
          step={1000}
          onChange={(heartbeatIntervalMs) =>
            updateConnection({ heartbeatIntervalMs })
          }
        />
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <ToggleField
          label="Auto-reconnect"
          help="When on, the client tries to reconnect with exponential backoff after a drop."
          value={conn.autoReconnect}
          onChange={(autoReconnect) => updateConnection({ autoReconnect })}
        />
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <TestConnectionPanel />
      </div>
    </SettingsSection>
  );
}

function LiveStatus({
  state,
  url,
}: {
  state: "connected" | "disconnected" | "error" | "connecting";
  url: string;
}) {
  const color =
    state === "connected"
      ? "var(--status-green)"
      : state === "error"
        ? "var(--status-red)"
        : "var(--status-amber)";

  const Icon =
    state === "connected" ? Wifi : state === "error" ? CircleAlert : WifiOff;

  const label =
    state === "connected"
      ? "Live — gateway connected"
      : state === "error"
        ? "Error — see browser console"
        : state === "connecting"
          ? "Connecting…"
          : "Disconnected";

  return (
    <div
      className="flex items-center gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: color,
        backgroundColor: `color-mix(in oklch, ${color} 10%, transparent)`,
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div className="flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {label}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {url}
        </p>
      </div>
    </div>
  );
}
