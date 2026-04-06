"use client";

import { useRadar } from "@/lib/hooks/use-radar";
import { AnomalyList } from "./anomaly-list";
import { SignalFeed } from "./signal-feed";

export function RadarView() {
  const { anomalies, signals } = useRadar();

  return (
    <div className="flex flex-col gap-6">
      <AnomalyList anomalies={anomalies} />
      <SignalFeed signals={signals} />
    </div>
  );
}
