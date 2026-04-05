"use client";

import { useEffect, useState } from "react";
import { useAgents } from "./use-agents";
import type { AgentFull, AgentMeta } from "@/types";

export function useTeam() {
  const { agents: liveAgents, onlineCount } = useAgents();
  const [agentMetas, setAgentMetas] = useState<AgentMeta[]>([]);
  const [mission, setMission] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setAgentMetas(data.agents ?? []);
        setMission(data.mission ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const agents: AgentFull[] = agentMetas.map((meta) => {
    const live = liveAgents.find((a) => a.id === meta.id);
    return {
      id: meta.id,
      name: live?.name ?? meta.displayName,
      displayName: meta.displayName,
      role: meta.role,
      description: meta.description,
      model: meta.model,
      tools: meta.tools,
      avatarColor: meta.avatarColor,
      status: live?.status ?? "offline",
      lastSeen: live?.lastSeen ?? 0,
      currentTask: live?.currentTask ?? null,
    };
  });

  // Also include live agents not in config
  for (const live of liveAgents) {
    if (!agentMetas.find((m) => m.id === live.id)) {
      agents.push({
        ...live,
        displayName: live.name,
        role: "Unknown",
        description: "",
        model: "Unknown",
        tools: [],
        avatarColor: "#6B7280",
      });
    }
  }

  return { agents, mission, loading, onlineCount };
}
