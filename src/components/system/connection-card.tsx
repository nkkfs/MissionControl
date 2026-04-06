"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { formatUptime } from "@/lib/hooks/use-system-health";
import type { ConnectionState } from "@/types";

interface ConnectionCardProps {
  connectionState: ConnectionState;
  gatewayUrl: string;
  uptimeSeconds: number;
}

const STATE_LABEL: Record<ConnectionState, string> = {
  connected: "Gateway connected",
  connecting: "Connecting…",
  disconnected: "Gateway disconnected",
  error: "Gateway error",
};

const STATE_COLOR: Record<ConnectionState, string> = {
  connected: "var(--status-green)",
  connecting: "var(--status-amber)",
  disconnected: "var(--status-gray)",
  error: "var(--status-red)",
};

export function ConnectionCard({
  connectionState,
  gatewayUrl,
  uptimeSeconds,
}: ConnectionCardProps) {
  const color = STATE_COLOR[connectionState];
  const Icon =
    connectionState === "connecting"
      ? Loader2
      : connectionState === "connected"
        ? Wifi
        : WifiOff;

  return (
    <div
      className="rounded-lg border bg-card p-4"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 ${connectionState === "connecting" ? "animate-spin" : ""}`}
          style={{ color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-semibold" style={{ color }}>
              {STATE_LABEL[connectionState]}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {gatewayUrl}
            {connectionState === "connected" && (
              <>
                <span className="mx-2">·</span>
                <span>uptime {formatUptime(uptimeSeconds)}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
