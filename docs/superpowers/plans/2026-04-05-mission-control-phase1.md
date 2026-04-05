# Mission Control Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core Mission Control dashboard — app shell with collapsible sidebar, Kanban TaskBoard driven by live OpenClaw WebSocket data, Activity Feed, and Log Drawer.

**Architecture:** Single WebSocket connection via React Context feeds domain hooks (useAgents, useSessions, useEventStream, useLogs) that maintain state via useReducer. UI components are read-only views of that state. App shell uses a collapsible sidebar + top bar layout with right Activity Feed panel and bottom Log Drawer.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Lucide React, native WebSocket

---

## File Structure

```
src/
├── app/
│   ├── globals.css              # Theme tokens + Tailwind config
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Redirect to /tasks
│   └── tasks/
│       └── page.tsx             # TaskBoard page
├── components/
│   ├── ui/                      # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── app-shell.tsx        # Main layout: sidebar + topbar + content + panels
│   │   ├── sidebar.tsx          # Collapsible sidebar navigation
│   │   ├── top-bar.tsx          # Top navigation bar
│   │   └── log-drawer.tsx       # Bottom resizable log panel
│   ├── taskboard/
│   │   ├── kanban-board.tsx     # Board container with 5 columns
│   │   ├── kanban-column.tsx    # Single column
│   │   ├── task-card.tsx        # Session card
│   │   ├── task-detail.tsx      # Detail slide-over panel
│   │   └── filter-bar.tsx       # Agent/status filter controls
│   └── activity/
│       ├── activity-feed.tsx    # Right panel: agent cards + event stream
│       ├── agent-status-card.tsx # Single agent status card
│       └── event-stream.tsx     # Live event list
├── lib/
│   ├── websocket/
│   │   ├── types.ts             # All WS message type definitions
│   │   ├── client.ts            # WebSocket client class
│   │   └── provider.tsx         # React Context provider
│   ├── hooks/
│   │   ├── use-agents.ts        # Agent state from WS events
│   │   ├── use-sessions.ts      # Session state from WS events
│   │   ├── use-event-stream.ts  # Buffered event stream
│   │   └── use-logs.ts          # Log tail stream
│   └── utils.ts                 # Shared helpers (cn, formatTime, etc.)
└── types/
    └── index.ts                 # Shared app types
```

---

### Task 1: Install Dependencies & Initialize shadcn/ui

**Files:**
- Modify: `package.json`
- Modify: `src/app/globals.css`
- Create: `components.json` (auto by shadcn init)

- [ ] **Step 1: Install lucide-react**

Run: `npm install lucide-react`

- [ ] **Step 2: Initialize shadcn/ui**

Run: `npx shadcn@latest init`

Select options:
- Style: New York
- Base color: Zinc
- CSS variables: yes

- [ ] **Step 3: Install required shadcn components**

Run:
```bash
npx shadcn@latest add button badge scroll-area separator tooltip sheet
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with shadcn/ui and lucide-react"
```

---

### Task 2: Theme & Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace globals.css with Mission Control dark theme**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

:root {
  --background: 0 0% 4%;
  --foreground: 0 0% 92%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 92%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 92%;
  --primary: 42 58% 55%;
  --primary-foreground: 0 0% 4%;
  --secondary: 0 0% 12%;
  --secondary-foreground: 0 0% 92%;
  --muted: 0 0% 12%;
  --muted-foreground: 0 0% 48%;
  --accent: 42 58% 55%;
  --accent-foreground: 0 0% 4%;
  --destructive: 0 72% 60%;
  --destructive-foreground: 0 0% 92%;
  --border: 0 0% 12%;
  --input: 0 0% 12%;
  --ring: 42 58% 55%;
  --radius: 0.5rem;

  --surface: #141414;
  --border-hover: #2A2A2A;
  --status-green: #22C55E;
  --status-amber: #EAB308;
  --status-red: #EF4444;
  --status-blue: #3B82F6;
  --status-purple: #A855F7;
  --status-gray: #6B7280;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-surface: var(--surface);
  --color-border-hover: var(--border-hover);
  --color-status-green: var(--status-green);
  --color-status-amber: var(--status-amber);
  --color-status-red: var(--status-red);
  --color-status-blue: var(--status-blue);
  --color-status-purple: var(--status-purple);
  --color-status-gray: var(--status-gray);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* Pulse animation for active agent dots */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

/* Log drawer resize handle */
.resize-handle {
  cursor: ns-resize;
}
.resize-handle:hover {
  background: var(--border-hover);
}
```

- [ ] **Step 2: Update layout.tsx with dark class and metadata**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "OpenClaw Agent Orchestration Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add Mission Control dark theme with warm amber palette"
```

---

### Task 3: WebSocket Types

**Files:**
- Create: `src/lib/websocket/types.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create shared app types**

Create `src/types/index.ts`:

```ts
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
```

- [ ] **Step 2: Create WebSocket message types**

Create `src/lib/websocket/types.ts`:

```ts
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/websocket/types.ts
git commit -m "feat: add WebSocket and domain type definitions"
```

---

### Task 4: WebSocket Client

**Files:**
- Create: `src/lib/websocket/client.ts`

- [ ] **Step 1: Implement the WebSocket client class**

Create `src/lib/websocket/client.ts`:

```ts
import type { WsMessage, WsRequest, WsResponse, WsEvent } from "./types";

type EventHandler = (payload: Record<string, unknown>) => void;
type ConnectionHandler = (state: "connected" | "disconnected" | "error") => void;

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private url: string;
  private pendingRequests = new Map<string, {
    resolve: (res: WsResponse) => void;
    reject: (err: Error) => void;
  }>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval = 15000;
  private deviceToken: string | null = null;
  private requestId = 0;
  private disposed = false;

  constructor(url: string = "ws://127.0.0.1:18789") {
    this.url = url;
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("mc-device-token")
      : null;
    if (stored) this.deviceToken = stored;
  }

  connect(): void {
    if (this.disposed) return;
    this.cleanup();

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
    };

    this.ws.onmessage = (event) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.notifyConnection("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.notifyConnection("error");
    };
  }

  private handleMessage(msg: WsMessage): void {
    if (msg.type === "event") {
      this.handleEvent(msg as WsEvent);
    } else if (msg.type === "res") {
      this.handleResponse(msg as WsResponse);
    }
  }

  private handleEvent(event: WsEvent): void {
    if (event.event === "connect.challenge") {
      this.handleChallenge(event.payload);
      return;
    }
    const handlers = this.eventHandlers.get(event.event);
    if (handlers) {
      handlers.forEach((h) => h(event.payload));
    }
    // Also notify wildcard subscribers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) => ({ event: event.event, ...event.payload }));
      wildcardHandlers.forEach((h) => h({ event: event.event, ...event.payload }));
    }
  }

  private handleResponse(res: WsResponse): void {
    const pending = this.pendingRequests.get(res.id);
    if (pending) {
      this.pendingRequests.delete(res.id);
      if (res.ok) {
        // Check for hello-ok to extract config
        if (res.payload?.type === "hello-ok") {
          this.onHelloOk(res.payload);
        }
        pending.resolve(res);
      } else {
        pending.reject(new Error(res.error?.message ?? "Request failed"));
      }
    }
  }

  private handleChallenge(payload: Record<string, unknown>): void {
    // Respond to challenge with operator connect request
    this.send("connect", {
      role: "operator",
      scopes: ["operator.read", "operator.write"],
      deviceToken: this.deviceToken,
      nonce: payload.nonce,
    });
  }

  private onHelloOk(payload: Record<string, unknown>): void {
    const auth = payload.auth as { deviceToken?: string } | undefined;
    if (auth?.deviceToken) {
      this.deviceToken = auth.deviceToken;
      localStorage.setItem("mc-device-token", auth.deviceToken);
    }
    const policy = payload.policy as { tickIntervalMs?: number } | undefined;
    if (policy?.tickIntervalMs) {
      this.heartbeatInterval = policy.tickIntervalMs;
    }
    this.startHeartbeat();
    this.notifyConnection("connected");
  }

  send(method: string, params?: Record<string, unknown>): Promise<WsResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const id = `req-${++this.requestId}`;
      const req: WsRequest = { type: "req", id, method, params };
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(req));

      // Timeout after 10s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 10000);
    });
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnection(state: "connected" | "disconnected" | "error"): void {
    this.connectionHandlers.forEach((h) => h(state));
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "req", id: `hb-${Date.now()}`, method: "ping" }));
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.cleanup();
    this.pendingRequests.forEach(({ reject }) => reject(new Error("Client disposed")));
    this.pendingRequests.clear();
    this.eventHandlers.clear();
    this.connectionHandlers.clear();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/websocket/client.ts
git commit -m "feat: implement OpenClaw WebSocket client with auto-reconnect"
```

---

### Task 5: WebSocket Provider (React Context)

**Files:**
- Create: `src/lib/websocket/provider.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create utility helpers**

Create `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 1000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toString();
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
```

Note: `clsx` and `tailwind-merge` are already installed by shadcn/ui init. If `src/lib/utils.ts` already exists from shadcn init, merge the `cn` function with the new helpers.

- [ ] **Step 2: Create WebSocket Provider**

Create `src/lib/websocket/provider.tsx`:

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { OpenClawClient } from "./client";
import type { WsResponse } from "./types";
import type { ConnectionState } from "@/types";

interface WebSocketContextValue {
  send: (method: string, params?: Record<string, unknown>) => Promise<WsResponse>;
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => () => void;
  connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  url = "ws://127.0.0.1:18789",
  children,
}: {
  url?: string;
  children: ReactNode;
}) {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const client = new OpenClawClient(url);
    clientRef.current = client;

    client.onConnection((state) => {
      setConnectionState(state === "connected" ? "connected" : state === "error" ? "error" : "disconnected");
    });

    client.connect();

    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, [url]);

  const send = useCallback(
    (method: string, params?: Record<string, unknown>) => {
      if (!clientRef.current) return Promise.reject(new Error("No client"));
      return clientRef.current.send(method, params);
    },
    []
  );

  const on = useCallback(
    (event: string, handler: (payload: Record<string, unknown>) => void) => {
      if (!clientRef.current) return () => {};
      return clientRef.current.on(event, handler);
    },
    []
  );

  return (
    <WebSocketContext.Provider value={{ send, on, connectionState }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/lib/websocket/provider.tsx
git commit -m "feat: add WebSocket React context provider"
```

---

### Task 6: Domain Hooks

**Files:**
- Create: `src/lib/hooks/use-agents.ts`
- Create: `src/lib/hooks/use-sessions.ts`
- Create: `src/lib/hooks/use-event-stream.ts`
- Create: `src/lib/hooks/use-logs.ts`

- [ ] **Step 1: Create useAgents hook**

Create `src/lib/hooks/use-agents.ts`:

```ts
"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { Agent, AgentStatus } from "@/types";

type AgentAction =
  | { type: "SET_ALL"; agents: Agent[] }
  | { type: "UPDATE_STATUS"; id: string; status: AgentStatus; lastSeen: number; currentTask: string | null; name?: string }
  | { type: "SET_PRESENCE"; id: string; online: boolean; lastSeen: number };

function agentReducer(state: Agent[], action: AgentAction): Agent[] {
  switch (action.type) {
    case "SET_ALL":
      return action.agents;
    case "UPDATE_STATUS":
      return state.map((a) =>
        a.id === action.id
          ? { ...a, status: action.status as AgentStatus, lastSeen: action.lastSeen, currentTask: action.currentTask, name: action.name ?? a.name }
          : a
      );
    case "SET_PRESENCE": {
      const exists = state.find((a) => a.id === action.id);
      if (exists) {
        return state.map((a) =>
          a.id === action.id
            ? { ...a, status: action.online ? a.status === "offline" ? "idle" : a.status : "offline", lastSeen: action.lastSeen }
            : a
        );
      }
      return [...state, { id: action.id, name: action.id, status: action.online ? "idle" : "offline", lastSeen: action.lastSeen, currentTask: null }];
    }
    default:
      return state;
  }
}

export function useAgents() {
  const { send, on, connectionState } = useWebSocket();
  const [agents, dispatch] = useReducer(agentReducer, []);

  useEffect(() => {
    if (connectionState !== "connected") return;

    send("agents.list").then((res) => {
      if (res.ok && res.payload) {
        const list = (res.payload as { agents?: Array<Record<string, unknown>> }).agents;
        if (Array.isArray(list)) {
          dispatch({
            type: "SET_ALL",
            agents: list.map((a) => ({
              id: String(a.id ?? ""),
              name: String(a.name ?? a.id ?? ""),
              status: (a.status as AgentStatus) ?? "offline",
              lastSeen: Number(a.lastSeen ?? Date.now()),
              currentTask: (a.currentTask as string) ?? null,
            })),
          });
        }
      }
    }).catch(() => {});

    const unsub1 = on("agent.status", (payload) => {
      dispatch({
        type: "UPDATE_STATUS",
        id: String(payload.id),
        status: payload.status as AgentStatus,
        lastSeen: Number(payload.lastSeen ?? Date.now()),
        currentTask: (payload.currentTask as string) ?? null,
        name: payload.name as string | undefined,
      });
    });

    const unsub2 = on("presence", (payload) => {
      dispatch({
        type: "SET_PRESENCE",
        id: String(payload.id ?? payload.agentId),
        online: Boolean(payload.online ?? payload.status === "online"),
        lastSeen: Number(payload.lastSeen ?? Date.now()),
      });
    });

    return () => { unsub1(); unsub2(); };
  }, [connectionState, send, on]);

  const onlineCount = agents.filter((a) => a.status !== "offline").length;

  return { agents, onlineCount };
}
```

- [ ] **Step 2: Create useSessions hook**

Create `src/lib/hooks/use-sessions.ts`:

```ts
"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { Session, SessionStatus, ColumnName, COLUMN_ORDER } from "@/types";
import { SESSION_STATUS_TO_COLUMN } from "@/types";

type SessionAction =
  | { type: "SET_ALL"; sessions: Session[] }
  | { type: "UPDATE"; session: Partial<Session> & { key: string } }
  | { type: "REMOVE"; key: string };

function sessionReducer(state: Session[], action: SessionAction): Session[] {
  switch (action.type) {
    case "SET_ALL":
      return action.sessions;
    case "UPDATE": {
      const exists = state.find((s) => s.key === action.session.key);
      if (exists) {
        return state.map((s) =>
          s.key === action.session.key ? { ...s, ...action.session } : s
        );
      }
      return [...state, {
        key: action.session.key,
        agentId: action.session.agentId ?? "unknown",
        status: action.session.status ?? "queued",
        startedAt: action.session.startedAt ?? Date.now(),
        lastActivity: action.session.lastActivity ?? "",
        description: action.session.description,
        usage: action.session.usage ?? { tokens: 0 },
      } as Session];
    }
    case "REMOVE":
      return state.filter((s) => s.key !== action.key);
    default:
      return state;
  }
}

export function useSessions() {
  const { send, on, connectionState } = useWebSocket();
  const [sessions, dispatch] = useReducer(sessionReducer, []);

  useEffect(() => {
    if (connectionState !== "connected") return;

    send("sessions.list").then((res) => {
      if (res.ok && res.payload) {
        const list = (res.payload as { sessions?: Array<Record<string, unknown>> }).sessions;
        if (Array.isArray(list)) {
          dispatch({
            type: "SET_ALL",
            sessions: list.map((s) => ({
              key: String(s.key ?? ""),
              agentId: String(s.agentId ?? ""),
              status: (s.status as SessionStatus) ?? "queued",
              startedAt: Number(s.startedAt ?? Date.now()),
              lastActivity: String(s.lastActivity ?? ""),
              description: s.description as string | undefined,
              usage: {
                tokens: Number((s.usage as Record<string, unknown>)?.tokens ?? 0),
                toolCalls: Number((s.usage as Record<string, unknown>)?.toolCalls ?? 0),
              },
            })),
          });
        }
      }
    }).catch(() => {});

    const unsub1 = on("sessions.changed", (payload) => {
      dispatch({
        type: "UPDATE",
        session: {
          key: String(payload.key ?? payload.sessionKey),
          agentId: payload.agentId as string | undefined,
          status: payload.status as SessionStatus | undefined,
          lastActivity: payload.lastActivity as string | undefined,
          description: payload.description as string | undefined,
          usage: payload.usage as Session["usage"] | undefined,
        },
      });
    });

    const unsub2 = on("session.tool", (payload) => {
      const key = String(payload.sessionKey ?? payload.key);
      if (key) {
        dispatch({
          type: "UPDATE",
          session: {
            key,
            lastActivity: `tool: ${payload.tool ?? payload.method ?? "unknown"}`,
          },
        });
      }
    });

    const unsub3 = on("session.message", (payload) => {
      const key = String(payload.sessionKey ?? payload.key);
      if (key) {
        dispatch({
          type: "UPDATE",
          session: {
            key,
            lastActivity: String(payload.content ?? payload.message ?? "message"),
          },
        });
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [connectionState, send, on]);

  const sessionsByColumn = sessions.reduce<Record<string, Session[]>>(
    (acc, session) => {
      const column = SESSION_STATUS_TO_COLUMN[session.status] ?? "Backlog";
      if (!acc[column]) acc[column] = [];
      acc[column].push(session);
      return acc;
    },
    {}
  );

  return { sessions, sessionsByColumn };
}
```

- [ ] **Step 3: Create useEventStream hook**

Create `src/lib/hooks/use-event-stream.ts`:

```ts
"use client";

import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { LiveEvent } from "@/types";

const MAX_EVENTS = 200;
let eventCounter = 0;

type EventAction =
  | { type: "ADD"; event: LiveEvent }
  | { type: "CLEAR" };

function eventReducer(state: LiveEvent[], action: EventAction): LiveEvent[] {
  switch (action.type) {
    case "ADD":
      const next = [...state, action.event];
      return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function useEventStream() {
  const { on, connectionState } = useWebSocket();
  const [events, dispatch] = useReducer(eventReducer, []);
  const [paused, setPaused] = useState(false);
  const pausedEventsRef = useRef<LiveEvent[]>([]);

  useEffect(() => {
    if (connectionState !== "connected") return;

    function addEvent(
      agentId: string,
      type: LiveEvent["type"],
      summary: string
    ) {
      const event: LiveEvent = {
        id: `evt-${++eventCounter}`,
        timestamp: Date.now(),
        agentId,
        type,
        summary,
      };
      if (paused) {
        pausedEventsRef.current.push(event);
      } else {
        dispatch({ type: "ADD", event });
      }
    }

    const unsubs = [
      on("session.tool", (p) =>
        addEvent(String(p.agentId ?? "system"), "session.tool", `tool: ${p.tool ?? p.method ?? "unknown"}`)
      ),
      on("session.message", (p) =>
        addEvent(String(p.agentId ?? "system"), "session.message", String(p.content ?? p.message ?? ""))
      ),
      on("agent.status", (p) =>
        addEvent(String(p.id ?? "system"), "agent.status", `status → ${p.status}`)
      ),
      on("presence", (p) =>
        addEvent(String(p.id ?? p.agentId ?? "system"), "presence", `${p.online ? "connected" : "disconnected"}`)
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [connectionState, on, paused]);

  const resume = useCallback(() => {
    pausedEventsRef.current.forEach((e) => dispatch({ type: "ADD", event: e }));
    pausedEventsRef.current = [];
    setPaused(false);
  }, []);

  return {
    events,
    paused,
    pendingCount: pausedEventsRef.current.length,
    pause: () => setPaused(true),
    resume,
    clear: () => dispatch({ type: "CLEAR" }),
  };
}
```

- [ ] **Step 4: Create useLogs hook**

Create `src/lib/hooks/use-logs.ts`:

```ts
"use client";

import { useEffect, useReducer, useState, useRef, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket/provider";
import type { LogEntry } from "@/types";

const MAX_LOGS = 500;

type LogAction =
  | { type: "ADD"; entries: LogEntry[] }
  | { type: "CLEAR" };

function logReducer(state: LogEntry[], action: LogAction): LogEntry[] {
  switch (action.type) {
    case "ADD":
      const next = [...state, ...action.entries];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function useLogs() {
  const { send, on, connectionState } = useWebSocket();
  const [logs, dispatch] = useReducer(logReducer, []);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const pausedLogsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    if (connectionState !== "connected") return;

    // Subscribe to log tail
    send("logs.tail", { follow: true }).catch(() => {});

    const unsub = on("log", (payload) => {
      const entry: LogEntry = {
        timestamp: String(payload.timestamp ?? new Date().toISOString()),
        level: (payload.level as LogEntry["level"]) ?? "INFO",
        source: String(payload.source ?? payload.agentId ?? "system"),
        message: String(payload.message ?? payload.line ?? ""),
      };
      if (paused) {
        pausedLogsRef.current.push(entry);
      } else {
        dispatch({ type: "ADD", entries: [entry] });
      }
    });

    return unsub;
  }, [connectionState, send, on, paused]);

  const resume = useCallback(() => {
    dispatch({ type: "ADD", entries: pausedLogsRef.current });
    pausedLogsRef.current = [];
    setPaused(false);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (agentFilter && log.source !== agentFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase()) && !log.source.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return {
    logs: filteredLogs,
    allLogs: logs,
    paused,
    pendingCount: pausedLogsRef.current.length,
    filter,
    agentFilter,
    setFilter,
    setAgentFilter,
    pause: () => setPaused(true),
    resume,
    clear: () => dispatch({ type: "CLEAR" }),
  };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat: add domain hooks for agents, sessions, events, and logs"
```

---

### Task 7: Sidebar Component

**Files:**
- Create: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Implement sidebar**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare, Bot, FileText, ShieldCheck, Users,
  Calendar, FolderKanban, Brain, BookOpen, UserCircle,
  Building2, UsersRound, Settings, Radar, Factory,
  GitBranch, MessageSquare, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tasks", icon: CheckSquare, href: "/tasks", enabled: true },
  { label: "Agents", icon: Bot, href: "/agents", enabled: false },
  { label: "Content", icon: FileText, href: "/content", enabled: false },
  { label: "Approvals", icon: ShieldCheck, href: "/approvals", enabled: false },
  { label: "Council", icon: Users, href: "/council", enabled: false },
  { label: "Calendar", icon: Calendar, href: "/calendar", enabled: false },
  { label: "Projects", icon: FolderKanban, href: "/projects", enabled: false },
  { label: "Memory", icon: Brain, href: "/memory", enabled: false },
  { label: "Docs", icon: BookOpen, href: "/docs", enabled: false },
  { label: "People", icon: UserCircle, href: "/people", enabled: false },
  { label: "Office", icon: Building2, href: "/office", enabled: false },
  { label: "Team", icon: UsersRound, href: "/team", enabled: false },
  { label: "System", icon: Settings, href: "/system", enabled: false },
  { label: "Radar", icon: Radar, href: "/radar", enabled: false },
  { label: "Factory", icon: Factory, href: "/factory", enabled: false },
  { label: "Pipeline", icon: GitBranch, href: "/pipeline", enabled: false },
  { label: "Feedback", icon: MessageSquare, href: "/feedback", enabled: false },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activePath, setActivePath] = useState("/tasks");

  useEffect(() => {
    const saved = localStorage.getItem("mc-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-surface transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Settings className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="truncate text-sm font-semibold text-foreground">
                Mission Control
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;

            const button = (
              <button
                key={item.label}
                disabled={!item.enabled}
                onClick={() => item.enabled && setActivePath(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mx-2",
                  collapsed ? "justify-center px-0 mx-1" : "",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : item.enabled
                      ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      : "text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add collapsible sidebar with navigation items"
```

---

### Task 8: Top Bar Component

**Files:**
- Create: `src/components/layout/top-bar.tsx`

- [ ] **Step 1: Implement top bar**

Create `src/components/layout/top-bar.tsx`:

```tsx
"use client";

import { Search, Pause, Settings, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket/provider";
import { useAgents } from "@/lib/hooks/use-agents";

export function TopBar() {
  const { connectionState } = useWebSocket();
  const { onlineCount } = useAgents();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">Tasks</h1>
        {onlineCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {onlineCount} agent{onlineCount !== 1 ? "s" : ""} online
          </Badge>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-xs">Search</span>
          <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2">
          {connectionState === "connected" ? (
            <Wifi className="h-3.5 w-3.5 text-status-green" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-status-red" />
          )}
          <span className="text-xs text-muted-foreground">
            {connectionState === "connected" ? "Live" : connectionState}
          </span>
        </div>

        {/* Pause */}
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Pause className="h-3.5 w-3.5" />
          <span className="text-xs">Pause</span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/top-bar.tsx
git commit -m "feat: add top bar with connection status and agent count"
```

---

### Task 9: Task Card & Kanban Column

**Files:**
- Create: `src/components/taskboard/task-card.tsx`
- Create: `src/components/taskboard/kanban-column.tsx`

- [ ] **Step 1: Implement TaskCard**

Create `src/components/taskboard/task-card.tsx`:

```tsx
"use client";

import { Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens } from "@/lib/utils";
import type { Session, Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface TaskCardProps {
  session: Session;
  agent?: Agent;
  onClick?: () => void;
}

export function TaskCard({ session, agent, onClick }: TaskCardProps) {
  const agentStatus = agent?.status ?? "offline";
  const isActive = session.status === "active";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    >
      {/* Header: agent dot + name + session key */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn("h-2 w-2 rounded-full", isActive && "animate-pulse-dot")}
            style={{ backgroundColor: STATUS_COLORS[agentStatus] }}
          />
          <span className="text-xs text-muted-foreground">
            {agent?.name ?? session.agentId}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60">
          #{session.key.slice(-6)}
        </span>
      </div>

      {/* Title */}
      <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">
        {session.description ?? session.lastActivity ?? "Untitled session"}
      </p>

      {/* Last activity */}
      {session.lastActivity && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span className="truncate">{session.lastActivity}</span>
          <span className="ml-auto shrink-0">{formatRelativeTime(session.startedAt)}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{formatTokens(session.usage.tokens)} tokens</span>
        </div>
        {session.usage.toolCalls !== undefined && session.usage.toolCalls > 0 && (
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{session.usage.toolCalls} tools</span>
          </div>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Implement KanbanColumn**

Create `src/components/taskboard/kanban-column.tsx`:

```tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Session, Agent, ColumnName } from "@/types";
import { COLUMN_COLORS } from "@/types";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  name: ColumnName;
  sessions: Session[];
  agents: Agent[];
  onCardClick?: (session: Session) => void;
}

export function KanbanColumn({ name, sessions, agents, onCardClick }: KanbanColumnProps) {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: COLUMN_COLORS[name] }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {name}
        </h3>
        <span className="text-xs text-muted-foreground/60">{sessions.length}</span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-1 pb-4">
          {sessions.map((session) => (
            <TaskCard
              key={session.key}
              session={session}
              agent={agentMap.get(session.agentId)}
              onClick={() => onCardClick?.(session)}
            />
          ))}
          {sessions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground/40">
              No sessions
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/taskboard/
git commit -m "feat: add TaskCard and KanbanColumn components"
```

---

### Task 10: Kanban Board & Filter Bar

**Files:**
- Create: `src/components/taskboard/kanban-board.tsx`
- Create: `src/components/taskboard/filter-bar.tsx`

- [ ] **Step 1: Implement FilterBar**

Create `src/components/taskboard/filter-bar.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
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
```

- [ ] **Step 2: Implement KanbanBoard**

Create `src/components/taskboard/kanban-board.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAgents } from "@/lib/hooks/use-agents";
import { useSessions } from "@/lib/hooks/use-sessions";
import { COLUMN_ORDER } from "@/types";
import type { Session } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { FilterBar } from "./filter-bar";
import { TaskDetail } from "./task-detail";

export function KanbanBoard() {
  const { agents } = useAgents();
  const { sessions, sessionsByColumn } = useSessions();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filteredByColumn = Object.fromEntries(
    COLUMN_ORDER.map((col) => {
      const colSessions = sessionsByColumn[col] ?? [];
      return [
        col,
        selectedAgent
          ? colSessions.filter((s) => s.agentId === selectedAgent)
          : colSessions,
      ];
    })
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">TaskBoard</h2>
          <span className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <FilterBar
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
        />
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {COLUMN_ORDER.map((column) => (
          <KanbanColumn
            key={column}
            name={column}
            sessions={filteredByColumn[column] ?? []}
            agents={agents}
            onCardClick={setSelectedSession}
          />
        ))}
      </div>

      {/* Detail slide-over */}
      {selectedSession && (
        <TaskDetail
          session={selectedSession}
          agent={agents.find((a) => a.id === selectedSession.agentId)}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (TaskDetail will be created in next task).

- [ ] **Step 4: Commit**

```bash
git add src/components/taskboard/kanban-board.tsx src/components/taskboard/filter-bar.tsx
git commit -m "feat: add KanbanBoard with agent filtering"
```

---

### Task 11: Task Detail Slide-over

**Files:**
- Create: `src/components/taskboard/task-detail.tsx`

- [ ] **Step 1: Implement TaskDetail**

Create `src/components/taskboard/task-detail.tsx`:

```tsx
"use client";

import { X, Clock, Zap, Wrench, CheckCircle, AlertCircle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens, formatTimestamp } from "@/lib/utils";
import type { Session, Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface TaskDetailProps {
  session: Session;
  agent?: Agent;
  onClose: () => void;
}

export function TaskDetail({ session, agent, onClose }: TaskDetailProps) {
  const agentStatus = agent?.status ?? "offline";
  const duration = Date.now() - session.startedAt;
  const durationMin = Math.floor(duration / 60000);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-border bg-surface shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[agentStatus] }}
          />
          <span className="text-sm font-semibold">
            {agent?.name ?? session.agentId}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            #{session.key.slice(-6)}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Title */}
        <h3 className="text-base font-medium text-foreground">
          {session.description ?? session.lastActivity ?? "Untitled session"}
        </h3>

        {/* Status badge */}
        <div className="mt-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs capitalize",
              session.status === "active" && "border-status-amber text-status-amber",
              session.status === "completed" && "border-status-green text-status-green",
              session.status === "review" && "border-status-purple text-status-purple",
              session.status === "queued" && "border-status-gray text-status-gray",
              session.status === "pending" && "border-status-blue text-status-blue"
            )}
          >
            {session.status}
          </Badge>
        </div>

        <Separator className="my-4" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <p className="mt-1 text-sm font-medium">{durationMin}m</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Tokens
            </div>
            <p className="mt-1 text-sm font-medium">{formatTokens(session.usage.tokens)}</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              Tool Calls
            </div>
            <p className="mt-1 text-sm font-medium">{session.usage.toolCalls ?? 0}</p>
          </div>
          <div className="rounded-md bg-background p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Started
            </div>
            <p className="mt-1 text-sm font-medium">{formatTimestamp(session.startedAt)}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Last Activity */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Last Activity
          </h4>
          <p className="mt-2 text-sm text-foreground">{session.lastActivity || "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(session.startedAt)}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Action buttons (disabled placeholders for Phase 1) */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Review
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs text-destructive">
              <Pause className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            Actions available in a future update.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/taskboard/task-detail.tsx
git commit -m "feat: add task detail slide-over panel"
```

---

### Task 12: Activity Feed Components

**Files:**
- Create: `src/components/activity/agent-status-card.tsx`
- Create: `src/components/activity/event-stream.tsx`
- Create: `src/components/activity/activity-feed.tsx`

- [ ] **Step 1: Implement AgentStatusCard**

Create `src/components/activity/agent-status-card.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Agent } from "@/types";
import { STATUS_COLORS } from "@/types";

interface AgentStatusCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentStatusCard({ agent, onClick }: AgentStatusCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-1 rounded-md border border-border p-3 text-left transition-colors",
        "hover:border-border-hover hover:bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              agent.status === "busy" && "animate-pulse-dot"
            )}
            style={{ backgroundColor: STATUS_COLORS[agent.status] }}
          />
          <span className="text-xs font-medium text-foreground">{agent.name}</span>
        </div>
        <span className="text-[10px] text-muted-foreground capitalize">{agent.status}</span>
      </div>
      <p className="truncate text-[11px] text-muted-foreground">
        {agent.currentTask ?? "—"}
      </p>
      <p className="text-[10px] text-muted-foreground/50">
        Last seen: {formatRelativeTime(agent.lastSeen)}
      </p>
    </button>
  );
}
```

- [ ] **Step 2: Implement EventStream**

Create `src/components/activity/event-stream.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { LiveEvent } from "@/types";

interface EventStreamProps {
  events: LiveEvent[];
  paused: boolean;
  pendingCount: number;
  onPause: () => void;
  onResume: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "session.tool": "tool",
  "session.message": "msg",
  "agent.status": "status",
  presence: "presence",
  system: "sys",
};

export function EventStream({ events, paused, pendingCount, onPause, onResume }: EventStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events.length, paused]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live Events
        </span>
        <div className="flex items-center gap-1">
          {paused && pendingCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {pendingCount} new
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={paused ? onResume : onPause}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Events */}
      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1.5 pb-2">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col gap-0.5 rounded-md p-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className={cn(
                  "text-[10px] font-medium",
                  event.type === "session.tool" && "text-status-amber",
                  event.type === "session.message" && "text-status-blue",
                  event.type === "agent.status" && "text-status-green",
                  event.type === "presence" && "text-status-purple"
                )}>
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">{event.agentId}</span>
                <span className="text-[11px] text-foreground/80 truncate">{event.summary}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 3: Implement ActivityFeed container**

Create `src/components/activity/activity-feed.tsx`:

```tsx
"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAgents } from "@/lib/hooks/use-agents";
import { useEventStream } from "@/lib/hooks/use-event-stream";
import { AgentStatusCard } from "./agent-status-card";
import { EventStream } from "./event-stream";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ActivityFeed({ collapsed, onToggle }: ActivityFeedProps) {
  const { agents, onlineCount } = useAgents();
  const eventStream = useEventStream();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-border bg-surface py-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold text-foreground">Activity</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Agent cards */}
      <div className="border-b border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Agents Online
          </span>
          <span className="text-[10px] text-muted-foreground">
            {onlineCount}/{agents.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
          {agents.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-4">
              No agents connected
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Event stream */}
      <EventStream
        events={eventStream.events}
        paused={eventStream.paused}
        pendingCount={eventStream.pendingCount}
        onPause={eventStream.pause}
        onResume={eventStream.resume}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/activity/
git commit -m "feat: add Activity Feed with agent status cards and event stream"
```

---

### Task 13: Log Drawer

**Files:**
- Create: `src/components/layout/log-drawer.tsx`

- [ ] **Step 1: Implement LogDrawer**

Create `src/components/layout/log-drawer.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Terminal, Pause, Play, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLogs } from "@/lib/hooks/use-logs";
import { useAgents } from "@/lib/hooks/use-agents";

const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-muted-foreground/50",
  INFO: "text-foreground",
  WARN: "text-status-amber",
  ERROR: "text-status-red",
};

export function LogDrawer() {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(200);
  const { logs, paused, pendingCount, filter, agentFilter, setFilter, setAgentFilter, pause, resume, clear } = useLogs();
  const { agents } = useAgents();
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, paused]);

  // Resize handler
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    resizeRef.current = { startY: e.clientY, startHeight: height };
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startY - e.clientY;
      const newHeight = Math.min(Math.max(resizeRef.current.startHeight + delta, 100), window.innerHeight * 0.5);
      setHeight(newHeight);
    };
    const onMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [height]);

  // Keyboard shortcut: Ctrl+`
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col border-t border-border">
      {/* Toggle bar (always visible) */}
      <div className="flex h-8 items-center justify-between bg-surface px-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Logs</span>
          {!open && paused && pendingCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{pendingCount} new</Badge>
          )}
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {open && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="h-5 w-32 rounded border border-border bg-background px-2 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={agentFilter ?? ""}
              onChange={(e) => setAgentFilter(e.target.value || null)}
              className="h-5 rounded border border-border bg-background px-1 text-[10px] text-foreground focus:outline-none"
            >
              <option value="">All</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={paused ? resume : pause}>
              {paused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clear}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Log content */}
      {open && (
        <>
          {/* Resize handle */}
          <div className="resize-handle h-1 bg-border" onMouseDown={onMouseDown} />

          <div
            ref={scrollRef}
            className="overflow-auto font-mono text-[11px] leading-relaxed"
            style={{ height, backgroundColor: "#0D0D0D" }}
          >
            <div className="p-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 whitespace-pre">
                  <span className="shrink-0 text-muted-foreground/40">{log.timestamp}</span>
                  <span className={cn("shrink-0 w-12", LOG_LEVEL_COLORS[log.level] ?? "text-foreground")}>
                    {log.level}
                  </span>
                  <span className="shrink-0 text-status-blue">[{log.source}]</span>
                  <span className={LOG_LEVEL_COLORS[log.level] ?? "text-foreground"}>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <span className="text-muted-foreground/30">Waiting for logs...</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/log-drawer.tsx
git commit -m "feat: add resizable log drawer with filtering"
```

---

### Task 14: App Shell Layout

**Files:**
- Create: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Implement AppShell**

Create `src/components/layout/app-shell.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { LogDrawer } from "./log-drawer";
import { ActivityFeed } from "@/components/activity/activity-feed";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [feedCollapsed, setFeedCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Content + Activity Feed */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden">{children}</div>
              <LogDrawer />
            </div>
          </div>

          {/* Activity Feed (right panel) */}
          <ActivityFeed
            collapsed={feedCollapsed}
            onToggle={() => setFeedCollapsed(!feedCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat: add AppShell layout combining sidebar, topbar, content, feed, and logs"
```

---

### Task 15: Wire Up Pages & Root Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/tasks/page.tsx`

- [ ] **Step 1: Update root layout to include WebSocketProvider and AppShell**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "@/lib/websocket/provider";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "OpenClaw Agent Orchestration Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground">
        <WebSocketProvider>
          <AppShell>{children}</AppShell>
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace root page with redirect to /tasks**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tasks");
}
```

- [ ] **Step 3: Create TaskBoard page**

Create `src/app/tasks/page.tsx`:

```tsx
import { KanbanBoard } from "@/components/taskboard/kanban-board";

export default function TasksPage() {
  return <KanbanBoard />;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: wire up root layout, redirect, and tasks page"
```

---

### Task 16: Smoke Test — Dev Server

- [ ] **Step 1: Start dev server and verify**

Run: `npm run dev`

Open `http://localhost:3000` in a browser. Verify:
1. Redirects to `/tasks`
2. Dark theme with warm amber palette is applied
3. Sidebar renders with all nav items, "Tasks" highlighted
4. Top bar shows "Tasks" title and connection status (will show disconnected if Gateway isn't running)
5. Kanban board renders 5 empty columns: Backlog, Todo, Active, Review, Done
6. Activity Feed panel visible on the right with "No agents connected"
7. "Logs" toggle bar visible at the bottom, clicking opens the log drawer
8. Ctrl+` toggles the log drawer
9. Sidebar collapses/expands correctly

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Mission Control Phase 1 — TaskBoard dashboard with live WebSocket integration"
```
