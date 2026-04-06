"use client";

import { Cpu, Wrench } from "lucide-react";
import type { AgentFull } from "@/types";

interface AgentRegistryCardProps {
  agent: AgentFull;
}

export function AgentRegistryCard({ agent }: AgentRegistryCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
      <div
        className="h-1"
        style={{ backgroundColor: agent.avatarColor }}
      />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: agent.avatarColor }}
          >
            {agent.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold text-foreground">
              {agent.displayName}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground/70">
              {agent.id}
            </p>
            <span
              className="mt-1 inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: agent.avatarColor,
                backgroundColor: `color-mix(in oklch, ${agent.avatarColor} 15%, transparent)`,
              }}
            >
              {agent.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Cpu className="h-3 w-3" />
          <span>{agent.model}</span>
        </div>

        {agent.description && (
          <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
            {agent.description}
          </p>
        )}

        <div className="border-t border-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Wrench className="h-3 w-3 text-muted-foreground" />
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tools · {agent.tools.length}
            </p>
          </div>
          {agent.tools.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/70">None</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {agent.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
