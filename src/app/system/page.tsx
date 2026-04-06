import { SystemDashboard } from "@/components/system/system-dashboard";

export default function SystemPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">System</h2>
        <p className="text-xs text-muted-foreground">
          Gateway health and live telemetry
        </p>
      </div>
      <SystemDashboard />
    </div>
  );
}
