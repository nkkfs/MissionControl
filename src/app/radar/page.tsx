import { RadarView } from "@/components/radar/radar-view";

export default function RadarPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Radar</h2>
        <p className="text-xs text-muted-foreground">
          Anomalies and live signal feed
        </p>
      </div>
      <RadarView />
    </div>
  );
}
