import { AdvancedSettingsCard } from "@/components/settings/advanced-settings-card";
import { ConnectionSettingsCard } from "@/components/settings/connection-settings-card";
import { DisplaySettingsCard } from "@/components/settings/display-settings-card";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground">
          Everything Mission Control needs to talk to your OpenClaw instance.
          Values are saved to this browser and applied immediately — no
          restart required.
        </p>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <ConnectionSettingsCard />
        <DisplaySettingsCard />
        <AdvancedSettingsCard />
      </div>
    </div>
  );
}
