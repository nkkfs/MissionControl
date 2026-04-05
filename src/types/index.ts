export type AgentStatus = "idle" | "busy" | "error" | "paused" | "offline";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastSeen: number;
  currentTask: string | null;
}

export type SessionStatus = "queued" | "pending" | "active" | "review" | "completed" | "done";

export interface Session {
  key: string;
  agentId: string;
  status: SessionStatus;
  startedAt: number;
  lastActivity: string;
  description?: string;
  usage: {
    tokens: number;
    toolCalls?: number;
  };
}

export interface LiveEvent {
  id: string;
  timestamp: number;
  agentId: string;
  type: "session.message" | "session.tool" | "agent.status" | "presence" | "system";
  summary: string;
}

export interface LogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export const SESSION_STATUS_TO_COLUMN: Record<SessionStatus, string> = {
  queued: "Backlog",
  pending: "Todo",
  active: "Active",
  review: "Review",
  completed: "Done",
  done: "Done",
};

export const COLUMN_ORDER = ["Backlog", "Todo", "Active", "Review", "Done"] as const;
export type ColumnName = (typeof COLUMN_ORDER)[number];

export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "var(--status-green)",
  busy: "var(--status-amber)",
  error: "var(--status-red)",
  paused: "var(--status-gray)",
  offline: "var(--status-gray)",
};

export const COLUMN_COLORS: Record<ColumnName, string> = {
  Backlog: "var(--status-gray)",
  Todo: "var(--status-blue)",
  Active: "var(--status-amber)",
  Review: "var(--status-purple)",
  Done: "var(--status-green)",
};

export interface AgentMeta {
  id: string;
  displayName: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  avatarColor: string;
}

export interface AgentFull extends Agent {
  displayName: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  avatarColor: string;
}

export type ProjectStatus = "active" | "paused" | "completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agentIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
