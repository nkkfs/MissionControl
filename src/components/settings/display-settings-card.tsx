"use client";

import { useSettings } from "@/lib/settings/store";
import { SettingsSection } from "./settings-section";
import { SelectField, ToggleField } from "./setting-field";
import type { Theme } from "@/lib/settings/types";

export function DisplaySettingsCard() {
  const { settings, updateUi, updateBehavior } = useSettings();

  return (
    <SettingsSection
      title="Display"
      description="Visual preferences for Mission Control."
    >
      <SelectField<Theme>
        label="Theme"
        help="Light mode is experimental — the warm amber accent was designed for dark."
        value={settings.ui.theme}
        options={[
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light (experimental)" },
        ]}
        onChange={(theme) => updateUi({ theme })}
      />

      <div className="border-t border-border pt-4">
        <ToggleField
          label="Show demo mode banner"
          help="Hide the amber 'Demo Mode — Mock Data' banner on pages that fall back to fixture data. The pages still show mock data; only the banner is suppressed."
          value={settings.behavior.showDemoBanner}
          onChange={(showDemoBanner) => updateBehavior({ showDemoBanner })}
        />
      </div>
    </SettingsSection>
  );
}
