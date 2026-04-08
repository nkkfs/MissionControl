"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleAlert,
  Fingerprint,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket/provider";
import { useSettings } from "@/lib/settings/store";
import {
  KNOWN_CLIENT_IDS,
  KNOWN_CLIENT_MODES,
  clearAllDeviceState,
} from "@/lib/websocket/client";
import type { ClientError } from "@/lib/websocket/client";
import {
  getDeviceIdentitySummary,
  isSecureContext as computeIsSecureContext,
  type DeviceIdentitySummary,
} from "@/lib/websocket/device-identity";
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
  const { connectionState, lastError, reconnect } = useWebSocket();
  const conn = settings.connection;

  return (
    <SettingsSection
      title="OpenClaw Connection"
      description="How Mission Control talks to your gateway. Changes take effect immediately."
    >
      <SecureContextWarning wsUrl={conn.wsUrl} />
      <LiveStatus state={connectionState} url={conn.wsUrl} />
      {lastError && <ClientErrorBanner error={lastError} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextField
            label="WebSocket URL"
            help="e.g. wss://gateway.tail1234.ts.net or ws://127.0.0.1:18789 for localhost"
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
          help="Sent as client.mode. 'control-ui' is the default for an operator-style UI."
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
        <DeviceIdentityPanel
          onReset={reconnect}
          updateConnection={updateConnection}
        />
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <DeviceTokenField
          value={conn.deviceToken}
          onChange={(deviceToken) => updateConnection({ deviceToken })}
          onApply={reconnect}
        />
      </div>

      <div className="mt-2 border-t border-border pt-4">
        <TestConnectionPanel />
      </div>
    </SettingsSection>
  );
}

/* ------------------------- Device identity panel ------------------------ */

function DeviceIdentityPanel({
  onReset,
  updateConnection,
}: {
  onReset: () => void;
  updateConnection: (patch: { deviceToken?: string }) => void;
}) {
  const [summary, setSummary] = useState<DeviceIdentitySummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    getDeviceIdentitySummary()
      .then((s) => setSummary(s))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetIdentity = async () => {
    setBusy(true);
    try {
      // Wipes Ed25519 keypair (IndexedDB) AND legacy token storage.
      // Also zero the deviceToken in settings so reconnect won't try to
      // present a token that no longer binds to the new identity.
      await clearAllDeviceState();
      updateConnection({ deviceToken: "" });
      setSummary(null);
      onReset();
      // Re-read so a freshly generated identity (from the next handshake)
      // is reflected in the UI without a manual refresh.
      setTimeout(refresh, 500);
    } finally {
      setBusy(false);
    }
  };

  const publicKeyShort = summary
    ? `${summary.publicKey.slice(0, 10)}…${summary.publicKey.slice(-6)}`
    : null;

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
            <Fingerprint className="h-3.5 w-3.5" />
            Device identity
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Ed25519 keypair generated in your browser (stored in IndexedDB)
            and used to sign the gateway challenge. Clearing it wipes the
            keypair and device token so a brand-new identity is created on
            the next connect.
          </p>
        </div>
      </div>

      {!loaded ? (
        <p className="font-mono text-[11px] text-muted-foreground/70">
          Checking…
        </p>
      ) : summary ? (
        <div className="space-y-0.5 rounded-md border border-border/60 bg-background/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          <p>id: {summary.id}</p>
          <p>pk: {publicKeyShort}</p>
          <p className="text-muted-foreground/70">
            created {new Date(summary.createdAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border/60 bg-background/40 px-3 py-2 font-mono text-[11px] text-muted-foreground/70">
          — none yet, will be generated on next connect —
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={resetIdentity}
        disabled={busy}
        className="self-start"
      >
        <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {busy ? "Clearing…" : "Clear Device Identity"}
      </Button>
    </div>
  );
}

/* --------------------------- Device token field ------------------------- */

function DeviceTokenField({
  value,
  onChange,
  onApply,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Called after a user-initiated change (clear or paste) to trigger a live reconnect. */
  onApply: () => void;
}) {
  const [draft, setDraft] = useState(value);
  // Keep the local draft in sync when the store is updated externally
  // (e.g. the client auto-saved a token returned by hello-ok).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const masked = value
    ? `${value.slice(0, 6)}…${value.slice(-4)}`
    : "— none —";

  const dirty = draft !== value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Device token
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Paste a token if your gateway issued one out-of-band. Otherwise
            leave this empty — Mission Control will save whatever the gateway
            returns on the next successful handshake.
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            current: {masked}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!value && !draft}
          onClick={() => {
            setDraft("");
            onChange("");
            onApply();
          }}
          className="shrink-0"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Clear Token
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Paste token (optional)"
            value={draft}
            onChange={setDraft}
            placeholder="leave empty to let the gateway issue one"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty}
          onClick={() => {
            onChange(draft);
            onApply();
          }}
          className="shrink-0"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

/* ----------------------- Secure-context warning ------------------------- */

function SecureContextWarning({ wsUrl }: { wsUrl: string }) {
  const [secure, setSecure] = useState<boolean | null>(null);
  useEffect(() => {
    setSecure(computeIsSecureContext());
  }, []);

  if (secure === null || secure) return null;

  const looksLikeWss = wsUrl.startsWith("wss://");

  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--status-amber)",
        backgroundColor:
          "color-mix(in oklch, var(--status-amber) 10%, transparent)",
      }}
    >
      <ShieldAlert
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: "var(--status-amber)" }}
      />
      <div className="flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--status-amber)" }}
        >
          Not a secure context
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          This browser window is not running over https:// or
          http://localhost, so Mission Control cannot generate the Ed25519
          device identity that the gateway requires. The handshake will
          fail with “device identity required”.
        </p>
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground/80">
          <li>
            Expose the app over TLS via <b>Tailscale Serve</b> or <b>Nginx</b>.
          </li>
          <li>
            Or access it directly as <code>http://localhost:3000</code> on the
            host machine.
          </li>
          {!looksLikeWss && (
            <li>
              Once you switch to https://, change the WebSocket URL above to
              start with <code>wss://</code>.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------- Client error banner ------------------------- */

function ClientErrorBanner({ error }: { error: ClientError }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--status-red)",
        backgroundColor:
          "color-mix(in oklch, var(--status-red) 10%, transparent)",
      }}
    >
      <CircleAlert
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: "var(--status-red)" }}
      />
      <div className="flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--status-red)" }}
        >
          {errorTitle(error.code)}
        </p>
        <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
          {error.message}
        </p>
        {error.hint && (
          <p className="mt-1 break-words text-[11px] text-muted-foreground/80">
            {error.hint}
          </p>
        )}
      </div>
    </div>
  );
}

function errorTitle(code: ClientError["code"]): string {
  switch (code) {
    case "insecure-context":
      return "Insecure context";
    case "device-identity":
      return "Device identity error";
    case "handshake-rejected":
      return "Handshake rejected";
    case "connect-failed":
      return "Connect failed";
    case "socket-error":
      return "WebSocket error";
  }
}

/* ----------------------------- Live status ------------------------------ */

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
        ? "Error — see details below"
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
