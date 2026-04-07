"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings/store";
import {
  testConnection,
  type TestConnectionResult,
} from "@/lib/settings/test-connection";
import { clientVersion } from "@/lib/websocket/client";

type UiStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: TestConnectionResult };

/**
 * Stand-alone "Test Connection" panel. Uses the current values from the
 * settings store (not the persisted localStorage copy) so the user can
 * try a new URL without saving it first.
 */
export function TestConnectionPanel() {
  const { settings } = useSettings();
  const [status, setStatus] = useState<UiStatus>({ kind: "idle" });

  const run = async () => {
    setStatus({ kind: "running" });
    const result = await testConnection({
      url: settings.connection.wsUrl,
      clientId: settings.connection.clientId,
      displayName: settings.connection.displayName,
      version: clientVersion,
      mode: settings.connection.mode,
      minProtocol: settings.connection.minProtocol,
      maxProtocol: settings.connection.maxProtocol,
      heartbeatIntervalMs: settings.connection.heartbeatIntervalMs,
      autoReconnect: settings.connection.autoReconnect,
    });
    setStatus({ kind: "done", result });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground">
            Try the current connection settings
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Opens a one-shot WebSocket, performs the protocol handshake, and
            closes. Does not affect your live connection.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={run}
          disabled={status.kind === "running"}
          className="shrink-0"
        >
          {status.kind === "running" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Testing…
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              Test Connection
            </>
          )}
        </Button>
      </div>

      {status.kind === "done" && <TestResultCard result={status.result} />}
    </div>
  );
}

function TestResultCard({ result }: { result: TestConnectionResult }) {
  if (result.ok) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg border px-4 py-3"
        style={{
          borderColor: "var(--status-green)",
          backgroundColor:
            "color-mix(in oklch, var(--status-green) 10%, transparent)",
        }}
      >
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--status-green)" }}
        />
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--status-green)" }}
          >
            Connected
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Handshake succeeded in {result.durationMs} ms — protocol v
            {result.protocol}
            {result.tickIntervalMs != null
              ? `, gateway tick ${result.tickIntervalMs} ms`
              : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--status-red)",
        backgroundColor:
          "color-mix(in oklch, var(--status-red) 10%, transparent)",
      }}
    >
      <XCircle
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: "var(--status-red)" }}
      />
      <div className="flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--status-red)" }}
        >
          Connection failed — {stageLabel(result.stage)}
        </p>
        <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
          {result.message} ({result.durationMs} ms)
        </p>
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground/80">
          {stageHints(result.stage).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function stageLabel(stage: Exclude<TestConnectionResult, { ok: true }>["stage"]) {
  switch (stage) {
    case "open":
      return "could not open socket";
    case "handshake":
      return "handshake rejected";
    case "timeout":
      return "timed out";
    case "close":
      return "closed before hello-ok";
  }
}

function stageHints(
  stage: Exclude<TestConnectionResult, { ok: true }>["stage"],
): string[] {
  switch (stage) {
    case "open":
      return [
        "Is the OpenClaw gateway process actually running?",
        "Is the URL host and port correct for your network?",
        "If the URL is ws:// on a remote host, the browser may be blocking mixed content — use wss:// or run the app on the same host.",
      ];
    case "handshake":
      return [
        "Does the gateway support protocol v3?",
        "Does it accept the role and scopes configured above?",
      ];
    case "timeout":
      return [
        "The socket opened but the gateway never sent connect.challenge.",
        "Check the gateway logs for a protocol mismatch.",
      ];
    case "close":
      return [
        "The gateway closed the socket without replying. Check its logs.",
      ];
  }
}
