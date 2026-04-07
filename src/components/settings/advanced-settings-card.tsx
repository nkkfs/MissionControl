"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings/store";
import type { LogLevel } from "@/lib/settings/types";
import { SettingsSection } from "./settings-section";
import { SelectField } from "./setting-field";

export function AdvancedSettingsCard() {
  const { settings, updateBehavior, resetSettings } = useSettings();

  return (
    <SettingsSection
      title="Advanced"
      description="Diagnostics and reset controls."
    >
      <SelectField<LogLevel>
        label="Log level"
        help="Controls how much detail the client prints to the browser console."
        value={settings.behavior.logLevel}
        options={[
          { value: "quiet", label: "Quiet — errors only" },
          { value: "info", label: "Info — default" },
          { value: "debug", label: "Debug — verbose" },
        ]}
        onChange={(logLevel) => updateBehavior({ logLevel })}
      />

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">
            Reset all settings
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Restores defaults for connection, display, and advanced settings.
            Does not sign you out or clear the device token.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (
              window.confirm(
                "Reset all Mission Control settings to their defaults?",
              )
            ) {
              resetSettings();
            }
          }}
          className="shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </SettingsSection>
  );
}
