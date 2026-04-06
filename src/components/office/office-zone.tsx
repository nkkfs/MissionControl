"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentTile } from "./agent-tile";
import type { AgentFull } from "@/types";
import type { ZoneDef } from "@/lib/office/zone-assignment";

interface OfficeZoneProps {
  zone: ZoneDef;
  icon: LucideIcon;
  agents: AgentFull[];
  fullWidth?: boolean;
}

export function OfficeZone({ zone, icon: Icon, agents, fullWidth }: OfficeZoneProps) {
  const capacityLabel =
    zone.capacity !== null ? `${agents.length} / ${zone.capacity}` : `${agents.length}`;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-colors",
        fullWidth && "col-span-full"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{zone.title}</h3>
            <p className="text-[10px] text-muted-foreground/60">{zone.description}</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {capacityLabel}
        </span>
      </div>

      {/* Agents */}
      {agents.length > 0 ? (
        <div
          className={cn(
            "flex flex-col gap-2",
            fullWidth && "md:grid md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {agents.map((agent) => (
            <AgentTile key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/60 p-4 text-center">
          <p className="text-[10px] text-muted-foreground/40">Empty</p>
        </div>
      )}
    </div>
  );
}
