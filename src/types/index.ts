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

export type MemoryType = "knowledge" | "note" | "context";

export interface Memory {
  id: string;
  agentId: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

export type DocumentType = "report" | "newsletter" | "analysis" | "note";

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  agentId: string;
  projectId: string;
  summary: string;
  wordCount: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type EventType = "task" | "deadline" | "review";
export type EventStatus = "scheduled" | "in_progress" | "completed" | "overdue";

export interface ScheduleEvent {
  id: string;
  title: string;
  agentId: string;
  projectId: string;
  type: EventType;
  status: EventStatus;
  scheduledAt: number;
  duration: number;
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  task: "var(--status-amber)",
  deadline: "var(--status-red)",
  review: "var(--status-blue)",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: "var(--status-gray)",
  in_progress: "var(--status-amber)",
  completed: "var(--status-green)",
  overdue: "var(--status-red)",
};

export type AnomalySeverity = "critical" | "warning" | "info";

export interface Anomaly {
  id: string;
  severity: AnomalySeverity;
  title: string;
  description: string;
  timestamp: number;
}

export const ANOMALY_SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  critical: "var(--status-red)",
  warning: "var(--status-amber)",
  info: "var(--status-blue)",
};

export type ContentStage = "draft" | "review" | "approved" | "published";
export type ContentType = "article" | "newsletter" | "report" | "post";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  stage: ContentStage;
  agentId: string;
  projectId: string;
  wordCount: number;
  summary: string;
  updatedAt: number;
}

export const CONTENT_STAGE_ORDER = ["draft", "review", "approved", "published"] as const;

export const CONTENT_STAGE_COLORS: Record<ContentStage, string> = {
  draft: "var(--status-gray)",
  review: "var(--status-amber)",
  approved: "var(--status-blue)",
  published: "var(--status-green)",
};

export const CONTENT_STAGE_LABELS: Record<ContentStage, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  published: "Published",
};

export type ApprovalPriority = "high" | "normal";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  contentId: string;
  title: string;
  requesterAgentId: string;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  requestedAt: number;
  message: string;
  decidedAt: number | null;
}

export const APPROVAL_PRIORITY_COLORS: Record<ApprovalPriority, string> = {
  high: "var(--status-red)",
  normal: "var(--status-gray)",
};

export type WorkflowStatus = "active" | "draft" | "archived";
export type TriggerType = "manual" | "scheduled" | "event";

export interface WorkflowStep {
  order: number;
  title: string;
  agentId: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: TriggerType;
  triggerDetail: string;
  steps: WorkflowStep[];
  runCount: number;
  lastRunAt: number | null;
}

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  active: "var(--status-green)",
  draft: "var(--status-gray)",
  archived: "var(--status-gray)",
};

export const TRIGGER_COLORS: Record<TriggerType, string> = {
  manual: "var(--status-blue)",
  scheduled: "var(--status-amber)",
  event: "var(--status-purple)",
};

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
}

export interface Pipeline {
  id: string;
  name: string;
  throughputPerMinute: number;
  stages: PipelineStage[];
}
