"use client";

import { FlaskConical } from "lucide-react";
import { useSettings } from "@/lib/settings/store";

interface DemoBannerProps {
  /** Short explanation of why mock data is being shown. */
  reason?: string;
}

/**
 * Visual indicator that a page is displaying fixture / demo data instead
 * of data fetched from the live OpenClaw gateway. Rendered above the page
 * content whenever the corresponding gateway method is not yet available
 * or the request to the gateway failed.
 *
 * Users can hide every banner instance at once from the Settings page via
 * `behavior.showDemoBanner`.
 */
export function DemoBanner({ reason }: DemoBannerProps) {
  const { settings, hydrated } = useSettings();

  // Once we know the user's preference, honour it. Before hydration we keep
  // the banner visible so the first paint matches the SSR output.
  if (hydrated && !settings.behavior.showDemoBanner) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "var(--status-amber)",
        backgroundColor: "color-mix(in oklch, var(--status-amber) 10%, transparent)",
      }}
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: "var(--status-amber)" }}
      />
      <div className="flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--status-amber)" }}
        >
          Demo Mode — Mock Data
        </p>
        {reason && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{reason}</p>
        )}
      </div>
    </div>
  );
}
