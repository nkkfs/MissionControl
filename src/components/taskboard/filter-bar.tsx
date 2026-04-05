"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Agent } from "@/types";

interface FilterBarProps {
  agents: Agent[];
  selectedAgent: string | null;
  onSelectAgent: (agentId: string | null) => void;
}

export function FilterBar({ agents, selectedAgent, onSelectAgent }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Filter:</span>
      <Button
        variant={selectedAgent === null ? "secondary" : "ghost"}
        size="sm"
        className="h-6 text-xs"
        onClick={() => onSelectAgent(null)}
      >
        All Agents
      </Button>
      {agents.map((agent) => (
        <Button
          key={agent.id}
          variant={selectedAgent === agent.id ? "secondary" : "ghost"}
          size="sm"
          className="h-6 gap-1.5 text-xs"
          onClick={() => onSelectAgent(selectedAgent === agent.id ? null : agent.id)}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                agent.status === "busy" ? "var(--status-amber)" :
                agent.status === "idle" ? "var(--status-green)" :
                agent.status === "error" ? "var(--status-red)" :
                "var(--status-gray)",
            }}
          />
          {agent.name}
        </Button>
      ))}
      {selectedAgent && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground"
          onClick={() => onSelectAgent(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
