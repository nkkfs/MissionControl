"use client";

import { useEffect, useState } from "react";
import { KeyRound, Wifi, WifiOff, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket/provider";
import { useSettings } from "@/lib/settings/store";
import {
  KNOWN_CLIENT_IDS,
  KNOWN_CLIENT_MODES,
  clearSavedDeviceToken,
  readSavedDeviceToken,
} from "@/lib/websocket/client";
import { SettingsSection } from "./settings-section";
import {
  NumberField,
  SelectField,
  TextField,
  ToggleField,
} from "./setting-field";
import { TestConnectionPanel } from "./test-connection-panel";

const CLIENT_ID_OPTIONS = KNOWN_CLIENT_IDS.map((id) => ({
  value: id,
  label: id,
}));

const MODE_OPTIONS = KNOWN_CLIENT_MODES.map((mode) => ({
  value: mode,
  label: mode,
}));

/**
 * Edits every connection-related field the OpenClawClient uses. Changing
 * any value immediately tears down the live client and opens a new one.
 */
export function ConnectionSettingsCard() {
  const { settings, updateConnection } = useSettings();
  const { connectionState, reconnect } = useWebSocket();
  const conn = settings.connection;

  return (
    <SettingsSection
      title="OpenClaw Connection"
      description="How Mission Control talks to your gateway. Changes take effect immediately."
    >
      <LiveStatus state={connectionState} url={conn.wsUrl} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextField
            label="WebSocket URL"
            help="e.g. ws://127.0.0.1:18789 or ws://server.local:18789"
            value={conn.wsUrl}
            onChange={(wsUrl) => updateConnection({ wsUrl })}
            type="url"
          />
        </div>
        <SelectField
          label="Client ID"
          help="Sent as client.id during the handshake. Must match a value the gateway accepts."
          value={conn.clientId}
          options={CLIENT_ID_OPTIONS}
          onChange={(clientId) => updateConnection({ clientId })}
        />
        <SelectField
          label="Client Mode"
          help="Sent as client.mode. Pick 'operator' for a control UI like this one."
          value={conn.mode}
          options={MODE_OPTIONS}
          onChange={(mode) => updateConnection({ mode })}
        />
        <TextField
          label="Display Name"
          help="Local label shown in the top-bar. Not sent to the gateway."
          value={conn.displayName}
          onChange={(displayName) => updateConnection({ displayName })}
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
        <DeviceTokenPanel onCleared={reconnect} />
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <TestConnectionPanel />
      </div>
    </SettingsSection>
  );
}

function DeviceTokenPanel({ onCleared }: { onCleared: () => void }) {
  const [token, setToken] = useState<string | null>(null);

  // Read once on mount and after any clear so we mirror localStorage.
  useEffect(() => {
    setToken(readSavedDeviceToken());
  }, []);

  const masked = token ? `${token.slice(0, 6)}…${token.slice(-4)}` : null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">Saved device token</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          The gateway returns this on the first successful handshake and we
          reuse it on reconnects. Clear it if the gateway no longer accepts
          it (e.g. after a server reset).
        </p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {masked ?? "— none saved —"}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={!token}
        onClick={() => {
          clearSavedDeviceToken();
          setToken(null);
          onCleared();
        }}
        className="shrink-0"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Clear Token
      </Button>
    </div>
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
