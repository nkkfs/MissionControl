export interface WsRequest {
  type: "req";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface WsResponse {
  type: "res";
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export interface WsEvent {
  type: "event";
  event: string;
  payload: Record<string, unknown>;
}

export type WsMessage = WsRequest | WsResponse | WsEvent;

export interface HelloOkPayload {
  type: "hello-ok";
  protocol: number;
  policy: { tickIntervalMs: number };
  auth: {
    deviceToken: string;
    role: string;
    scopes: string[];
  };
}

export interface AgentStatusPayload {
  id: string;
  name: string;
  status: string;
  lastSeen: number;
  currentTask: string | null;
}

export interface SessionPayload {
  key: string;
  agentId: string;
  status: string;
  startedAt: number;
  lastActivity: string;
  description?: string;
  usage: { tokens: number; toolCalls?: number };
}

export interface SessionsListPayload {
  sessions: SessionPayload[];
}

export interface AgentsListPayload {
  agents: AgentStatusPayload[];
}
