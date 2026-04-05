# Mission Control — Phase 1 Design Spec

**Date:** 2026-04-05
**Scope:** Phase 1 — App Shell + TaskBoard + Live Monitoring
**Status:** Approved

---

## 1. Overview

Mission Control is a local dashboard for managing an OpenClaw agent orchestration instance. It provides real-time monitoring of agents, sessions, tasks, and logs through a WebSocket connection to the OpenClaw Gateway.

Phase 1 delivers the core "command center": an app shell with navigation, a Kanban-style TaskBoard driven by live session data, an activity feed, and a raw log drawer.

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (dark theme, customized warm amber palette)
- **Icons:** Lucide React
- **Fonts:** Inter (UI), JetBrains Mono (logs/code)
- **Data:** WebSocket client to OpenClaw Gateway (`ws://127.0.0.1:18789`)
- **Hosting:** Localhost (dev server)

## 3. Data Layer

### 3.1 WebSocket Protocol

All messages are JSON with three kinds:

- **Request:** `{"type": "req", "id": "unique-id", "method": "...", "params": {...}}`
- **Response:** `{"type": "res", "id": "...", "ok": true/false, "payload": {...} or "error": {...}}`
- **Event (server push):** `{"type": "event", "event": "...", "payload": {...}}`

### 3.2 Authentication Handshake

1. Gateway sends `connect.challenge` event with nonce
2. Client sends `connect` request with `role: "operator"`, `scopes: ["operator.read", "operator.write"]`
3. On success: `hello-ok` response with `deviceToken` (persisted to localStorage for reconnect)

### 3.3 Architecture

```
OpenClaw Gateway (ws://127.0.0.1:18789)
        |
        v
WebSocketProvider (React Context)
   ├── handles connect/challenge/auth handshake
   ├── maintains connection state + auto-reconnect
   ├── exposes send(method, params) -> Promise<response>
   └── dispatches events to subscribers
        |
        v
Domain Hooks (useAgents, useSessions, useEventStream, useLogs)
   ├── subscribe to relevant events
   ├── maintain local state via useReducer
   └── update in real-time from server-push events
        |
        v
UI Components (read-only, render current state)
```

### 3.4 Key Methods Used

| Method | Purpose |
|--------|---------|
| `agents.list` | Initial agent list on connect |
| `sessions.list` | Initial session list on connect |
| `sessions.get` | Detail view for a single session |
| `logs.tail` | Stream raw logs for bottom drawer |

### 3.5 Key Events Subscribed

| Event | Purpose |
|-------|---------|
| `agent.status` | Agent status changes (idle/busy/error) |
| `presence` | Agent online/offline transitions |
| `sessions.changed` | Session created, status changed, or ended |
| `session.message` | Agent messages within a session |
| `session.tool` | Tool call events within a session |

### 3.6 State Management

- Single WebSocket connection shared via React Context
- Domain state held in `useReducer` — events patch state immutably
- No local database, no REST calls — WebSocket is single source of truth
- Heartbeat ping every 15000ms (from `policy.tickIntervalMs`)
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)

## 4. App Shell

### 4.1 Sidebar (`AppSidebar`)

- **Collapsed:** 64px wide, icons only
- **Expanded:** 240px wide, icon + label
- Collapse state persisted to localStorage
- Active item: amber accent highlight
- Phase 1 active: Tasks
- Other items: visible but disabled (reduced opacity, no click handler)

Navigation items (matching existing OpenClaw UI):
Tasks, Agents, Content, Approvals, Council, Calendar, Projects, Memory, Docs, People, Office, Team, System, Radar, Factory, Pipeline, Feedback

### 4.2 Top Bar (`TopBar`)

- **Left:** Sidebar toggle + "Mission Control" title with logo
- **Center-right:** Search trigger (Cmd+K) — placeholder in Phase 1
- **Right:** WebSocket connection indicator (green/red dot), active agent count badge, Pause button, settings gear

### 4.3 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0A0A0A` | Page background |
| `surface` | `#141414` | Cards, sidebar, panels |
| `border` | `#1F1F1F` | Subtle borders |
| `border-hover` | `#2A2A2A` | Hover state borders |
| `text-primary` | `#EBEBEB` | Primary text |
| `text-secondary` | `#7A7A7A` | Muted text |
| `accent` | `#D4A843` | Warm amber accent |
| `status-green` | `#22C55E` | Idle / success |
| `status-amber` | `#EAB308` | Busy / warning |
| `status-red` | `#EF4444` | Error |
| `status-blue` | `#3B82F6` | Todo / info |
| `status-purple` | `#A855F7` | Review |

## 5. TaskBoard (Kanban)

### 5.1 Layout

- **Header:** Page title, active session count, filter controls (by agent, by status)
- **Board:** 5 columns, horizontal scroll if viewport is narrow
- **Right panel:** Activity Feed (320px, collapsible)
- **Bottom drawer:** Raw Log Drawer (toggleable)

### 5.2 Columns

| Column | Session Status | Accent Color |
|--------|---------------|-------------|
| Backlog | `"queued"` | Gray |
| Todo | `"pending"` | Blue |
| Active | `"active"` | Amber |
| Review | `"review"` | Purple |
| Done | `"completed"` / `"done"` | Green |

- Read-only — column placement driven purely by WebSocket session status
- No drag-and-drop in Phase 1
- Done column shows last 24h only, with "Show older" link

### 5.3 Task Card (`TaskCard`)

Displays per card:
- **Agent dot** — colored by agent status (green/amber/red/gray)
- **Agent name** — from `session.agentId` mapped to agent name
- **Session key** — e.g., `#sess-789`
- **Title** — from session description/task name
- **Last activity** — last tool call or message + relative timestamp
- **Usage stats** — token count, tool call count

Styling:
- Background: `#141414`, border: 1px `#1F1F1F`
- Hover: border `#2A2A2A`, subtle elevation shadow
- Active column cards: agent dot pulses subtly when receiving events

### 5.4 Card Detail Slide-over (`TaskDetail`)

Clicking a card opens a slide-over panel from the right (replaces Activity Feed temporarily):
- Full session info: agent, status, started time, duration
- Tool call history (scrollable list)
- Token usage breakdown
- Message/output preview
- Action button slots: "Mark for Review", "Approve", "Cancel" — disabled in Phase 1, UI placeholders only

### 5.5 Real-time Behavior

- New sessions: fade + slide-down animation into appropriate column
- Status changes: card slides from one column to another
- Active cards: agent dot pulses on incoming events
- Done auto-archive: sessions older than 24h hidden (not deleted)

## 6. Activity Feed (Right Panel)

### 6.1 Agent Status Cards (top section, ~180px)

Per agent:
- Colored status dot (green=idle, amber=busy, red=error, gray=offline)
- Agent name + status label
- Current activity or "Last seen: Xm ago"
- Token usage for active session
- Click to filter Kanban to that agent's sessions

Data source: `agents.list` on connect, then `agent.status` and `presence` events.

### 6.2 Event Stream (bottom section, scrollable)

Per event:
- Timestamp
- Agent badge with colored dot
- Event type + payload summary

Data sources: `session.message`, `session.tool`, `agent.status`, `presence` events.

- Auto-scrolls to bottom
- Pause button: stops auto-scroll, shows "X new events" badge
- Max buffer: 200 events in memory, oldest dropped

## 7. Log Drawer (Bottom Panel)

- **Default state:** collapsed/hidden
- **Toggle:** "Logs" button in bottom bar or keyboard shortcut (Ctrl+`)
- **Height:** 200px default, resizable via drag handle (min 100px, max 50vh)
- **Font:** JetBrains Mono, terminal-dark background (`#0D0D0D`)
- **Data source:** `logs.tail` WebSocket method
- **Filter:** text input for client-side grep on buffered logs
- **Agent filter:** dropdown to filter by specific agent
- **Pause:** freezes scroll, shows "X new lines" indicator
- **Log level colors:** DEBUG=gray, INFO=white, WARN=amber, ERROR=red

## 8. Component Tree

```
AppShell
├── Sidebar (collapsible)
│   └── NavItem (×17, only Tasks active in Phase 1)
├── TopBar
│   ├── SidebarToggle
│   ├── AppTitle
│   ├── SearchTrigger (placeholder)
│   ├── ConnectionStatus
│   ├── AgentCountBadge
│   ├── PauseButton
│   └── SettingsGear
├── MainContent
│   ├── TaskBoardHeader
│   │   ├── PageTitle + SessionCount
│   │   └── FilterBar (agent filter, status filter)
│   └── KanbanBoard
│       ├── KanbanColumn (×5)
│       │   └── TaskCard (×n)
│       └── TaskDetail (slide-over, conditional)
├── ActivityFeed (right panel, collapsible)
│   ├── AgentStatusCards
│   └── EventStream
└── LogDrawer (bottom panel, toggleable)
    ├── LogFilter
    ├── AgentFilter
    ├── PauseToggle
    └── LogContent (virtualized scroll)
```

## 9. File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Redirects to /tasks
│   └── tasks/
│       └── page.tsx            # TaskBoard page
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx       # Main layout wrapper
│   │   ├── sidebar.tsx         # Collapsible sidebar
│   │   ├── top-bar.tsx         # Top navigation bar
│   │   └── log-drawer.tsx      # Bottom log panel
│   ├── taskboard/
│   │   ├── kanban-board.tsx    # Board container
│   │   ├── kanban-column.tsx   # Single column
│   │   ├── task-card.tsx       # Session card
│   │   ├── task-detail.tsx     # Detail slide-over
│   │   └── filter-bar.tsx      # Filter controls
│   └── activity/
│       ├── activity-feed.tsx   # Right panel container
│       ├── agent-status-card.tsx
│       └── event-stream.tsx    # Live event list
├── lib/
│   ├── websocket/
│   │   ├── provider.tsx        # WebSocketProvider context
│   │   ├── client.ts           # WebSocket client class
│   │   └── types.ts            # Message type definitions
│   └── hooks/
│       ├── use-agents.ts       # Agent state hook
│       ├── use-sessions.ts     # Session state hook
│       ├── use-event-stream.ts # Event stream hook
│       └── use-logs.ts         # Log tail hook
└── styles/
    └── globals.css             # Tailwind config + custom tokens
```

## 10. Out of Scope (Phase 1)

- Drag-and-drop between columns
- Full-text search (Cmd+K just shows placeholder)
- Action buttons on task detail (UI slots present but disabled)
- All non-Tasks navigation pages
- Mobile responsive layout (desktop-first for Phase 1)
- Persistent task state or local DB
