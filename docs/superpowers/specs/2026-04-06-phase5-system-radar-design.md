# Mission Control — Phase 5 Design Spec

**Date:** 2026-04-06
**Scope:** Phase 5 — System Health + Radar (Observability Layer)
**Status:** Approved

---

## 1. Overview

Phase 5 adds two observability pages built on top of the live WebSocket infrastructure:

- **System (`/system`)** — Health dashboard showing connection state, live metrics (agents/sessions/events/errors), uptime, and aggregate token usage.
- **Radar (`/radar`)** — Anomaly detector + live signal feed. Surfaces stuck sessions, disconnected agents, and error spikes with a filterable signal stream.

No new data files or API routes are needed. All data derives from existing hooks: `useWebSocket`, `useAgents`, `useSessions`, `useEventStream`, `useLogs`, `useTeam`.

The goal is an at-a-glance situational awareness layer: *is the system healthy, and what's happening right now?*

## 2. System Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ System                                                  │
│ Gateway health and live telemetry                       │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │
│ │ ● Gateway connected                               │   │
│ │ ws://127.0.0.1:18789 · uptime 00:12:34            │   │
│ └───────────────────────────────────────────────────┘   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ Agents  │ │Sessions │ │ Events  │ │ Errors  │         │
│ │  3 / 3  │ │  5 act. │ │ 42 / m  │ │    2    │         │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
├─────────────────────────────────────────────────────────┤
│ Agent health                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ● Primary Agent    busy    last seen 2s ago       │   │
│ │ ● Research Agent   idle    last seen 5s ago       │   │
│ │ ● Writer Agent     idle    last seen 8s ago       │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Session pipeline                          Tokens used   │
│ [Backlog 2] [Todo 1] [Active 3] [Review 0] [Done 4]     │
│                                            12,487 tok   │
└─────────────────────────────────────────────────────────┘
```

## 3. Radar Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Radar                                                   │
│ Anomalies and live signal feed                          │
├─────────────────────────────────────────────────────────┤
│ Anomalies (2)                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⚠ Stuck session · research-001                    │   │
│ │ active for 12 min with no activity                │   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⚠ Agent offline · writer                          │   │
│ │ last seen 3 min ago                               │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Signal feed               [All] [Critical] [Warn] [Info]│
│ 15:42:03  info     primary   tool: web_fetch           │
│ 15:42:01  warn     research  status → error            │
│ 15:41:58  info     writer    message: "Draft ready"    │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

## 4. System Health Derivation

`useSystemHealth()` returns:

| Field | Source | Computation |
|---|---|---|
| `connectionState` | `useWebSocket` | pass-through |
| `uptime` | internal ref | seconds since first `connected` state |
| `totalAgents` | `useAgents` | `agents.length` |
| `onlineAgents` | `useAgents` | `agents.filter(a => a.status !== "offline").length` |
| `activeSessions` | `useSessions` | sessions where status is `active` or `review` |
| `pipelineCounts` | `useSessions` | count per column (Backlog/Todo/Active/Review/Done) |
| `totalTokens` | `useSessions` | sum of `session.usage.tokens` |
| `eventsPerMinute` | `useEventStream` | count of events in last 60s rolling window |
| `errorCount` | `useLogs` | logs with `level === "ERROR"` in last hour |

## 5. Radar / Anomaly Detection

`useRadar()` returns:

- `anomalies: Anomaly[]`
- `signals: LiveEvent[]` (from event stream)

### Anomaly rules

| Rule | Severity | Condition |
|---|---|---|
| Gateway disconnected | critical | `connectionState !== "connected"` |
| Agent offline | warning | agent with `status === "offline"` and `lastSeen > 60s ago` |
| Stuck session | warning | session with `status === "active"` and `startedAt > 10 min ago` with no recent activity |
| Error spike | critical | more than 3 error logs in the last 5 minutes |
| Agent error state | critical | agent with `status === "error"` |

### Anomaly shape

```ts
interface Anomaly {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: number;
}
```

### Signal feed

Re-uses `useEventStream` with a severity classifier:
- `agent.status === "error"` → warning
- `session.tool` / `session.message` → info
- `presence` → info
- errors from logs injected as critical signals

## 6. File Structure

```
src/
├── app/
│   ├── system/
│   │   └── page.tsx
│   └── radar/
│       └── page.tsx
├── components/
│   ├── system/
│   │   ├── system-dashboard.tsx   — layout wrapper
│   │   ├── connection-card.tsx     — gateway status + uptime
│   │   ├── metric-card.tsx         — single metric tile
│   │   ├── metric-grid.tsx         — 4-up metric row
│   │   ├── agent-health-list.tsx   — per-agent health rows
│   │   └── pipeline-bar.tsx        — session counts by column
│   └── radar/
│       ├── radar-view.tsx          — layout wrapper
│       ├── anomaly-card.tsx        — single anomaly
│       ├── anomaly-list.tsx        — anomalies section
│       ├── signal-row.tsx          — single signal
│       └── signal-feed.tsx         — filterable signal list
└── lib/
    └── hooks/
        ├── use-system-health.ts
        └── use-radar.ts
```

## 7. Types (additions to `src/types/index.ts`)

```ts
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
```

## 8. Sidebar + Top Bar

- Enable "System" nav item (`/system`)
- Enable "Radar" nav item (`/radar`)
- Add top-bar title mappings: `/system → "System"`, `/radar → "Radar"`

## 9. Out of Scope

- Persisting anomaly history across reloads
- Slack/email alerting
- User-defined alert thresholds
- Historical charts / time-series storage
- Drilling from anomaly into remediation actions
- Auto-resolving anomalies
