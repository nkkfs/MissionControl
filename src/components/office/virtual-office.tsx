"use client";

import { Target, FlaskConical, PenLine, Users, Coffee } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTeam } from "@/lib/hooks/use-team";
import { useSessions } from "@/lib/hooks/use-sessions";
import { OfficeStats } from "./office-stats";
import { OfficeZone } from "./office-zone";
import { ZONES, groupAgentsByZone } from "@/lib/office/zone-assignment";
import type { ZoneId } from "@/lib/office/zone-assignment";

const ZONE_ICONS: Record<ZoneId, LucideIcon> = {
  command: Target,
  research: FlaskConical,
  writing: PenLine,
  meeting: Users,
  break: Coffee,
};

export function VirtualOffice() {
  const { agents, loading } = useTeam();
  const { sessions } = useSessions();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workforce...</p>
      </div>
    );
  }

  const groups = groupAgentsByZone(agents, sessions);

  // Four work zones in a 2x2 grid, break room full-width below
  const workZones = ZONES.filter((z) => z.id !== "break");
  const breakZone = ZONES.find((z) => z.id === "break")!;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <OfficeStats agents={agents} />

      {/* Work zones grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {workZones.map((zone) => (
          <OfficeZone
            key={zone.id}
            zone={zone}
            icon={ZONE_ICONS[zone.id]}
            agents={groups[zone.id]}
          />
        ))}
      </div>

      {/* Break room full width */}
      <OfficeZone
        zone={breakZone}
        icon={ZONE_ICONS[breakZone.id]}
        agents={groups.break}
        fullWidth
      />
    </div>
  );
}
