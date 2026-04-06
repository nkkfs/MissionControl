import type { AgentFull, Session } from "@/types";

export type ZoneId = "command" | "research" | "writing" | "meeting" | "break";

export interface ZoneDef {
  id: ZoneId;
  title: string;
  description: string;
  capacity: number | null; // null = uncapped
}

export const ZONES: ZoneDef[] = [
  {
    id: "command",
    title: "Command Center",
    description: "Orchestrators and leads",
    capacity: 3,
  },
  {
    id: "research",
    title: "Research Lab",
    description: "Analysts and data gatherers",
    capacity: 3,
  },
  {
    id: "writing",
    title: "Writing Studio",
    description: "Content creators",
    capacity: 3,
  },
  {
    id: "meeting",
    title: "Meeting Room",
    description: "Agents in review",
    capacity: 3,
  },
  {
    id: "break",
    title: "Break Room",
    description: "Idle, paused, or offline",
    capacity: null,
  },
];

function matchRole(role: string): ZoneId {
  const r = role.toLowerCase();
  if (/orchestr|lead|command|primary/.test(r)) return "command";
  if (/research|analyst|data/.test(r)) return "research";
  if (/writ|content|generator/.test(r)) return "writing";
  return "command";
}

export function assignZone(
  agent: AgentFull,
  sessions: Session[]
): ZoneId {
  // Offline/paused → break room
  if (agent.status === "offline" || agent.status === "paused") {
    return "break";
  }

  // Agent in a review session → meeting room
  const inReview = sessions.some(
    (s) => s.agentId === agent.id && s.status === "review"
  );
  if (inReview) return "meeting";

  // Role-based placement
  return matchRole(agent.role);
}

export function groupAgentsByZone(
  agents: AgentFull[],
  sessions: Session[]
): Record<ZoneId, AgentFull[]> {
  const groups: Record<ZoneId, AgentFull[]> = {
    command: [],
    research: [],
    writing: [],
    meeting: [],
    break: [],
  };

  for (const agent of agents) {
    const zoneId = assignZone(agent, sessions);
    groups[zoneId].push(agent);
  }

  return groups;
}
