# Mission Control — Phase 4 Design Spec

**Date:** 2026-04-05
**Scope:** Phase 4 — Virtual Office
**Status:** Approved

---

## 1. Overview

Phase 4 adds the **Virtual Office** page (`/office`) — a spatial visualization of the agent workforce. Instead of flat lists, agents appear as tiles inside named zones ("rooms"), placed dynamically based on their role and current status. The page reuses existing data hooks (`useTeam`, `useSessions`) — no new data files, API routes, or types.

The goal is an at-a-glance view: *where is everyone, what are they doing, and what part of the workforce is busy vs idle?*

## 2. Layout

```
┌─────────────────────────────────────────────────────────┐
│ Virtual Office                                          │
│ Agent workforce and activity zones                      │
├─────────────────────────────────────────────────────────┤
│ [Total: 3]  [Busy: 1]  [Idle: 2]  [Offline: 0]          │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────┐  ┌───────────────────┐            │
│ │ 🎯 Command Center │  │ 🔬 Research Lab   │            │
│ │ 1 agent · 1/3     │  │ 1 agent · 1/3     │            │
│ │ ┌───────────────┐ │  │ ┌───────────────┐ │            │
│ │ │● Primary Agent│ │  │ │● Research Ag. │ │            │
│ │ │ GPT-4o        │ │  │ │ Claude 3.5    │ │            │
│ │ │ Coord. Q1 proj│ │  │ │ idle          │ │            │
│ │ └───────────────┘ │  │ └───────────────┘ │            │
│ └───────────────────┘  └───────────────────┘            │
│ ┌───────────────────┐  ┌───────────────────┐            │
│ │ ✍ Writing Studio  │  │ 👥 Meeting Room   │            │
│ │ 1 agent · 1/3     │  │ 0 agents · 0/3    │            │
│ │ ┌───────────────┐ │  │                   │            │
│ │ │● Writer Agent │ │  │   Empty           │            │
│ │ │ Llama 3 70B   │ │  │                   │            │
│ │ └───────────────┘ │  │                   │            │
│ └───────────────────┘  └───────────────────┘            │
│ ┌─────────────────────────────────────────────┐         │
│ │ ☕ Break Room                                │         │
│ │ 0 agents                                     │         │
│ └─────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## 3. Zones

| Zone | Icon | Who goes there |
|---|---|---|
| Command Center | Target | Orchestrators, leads (role matches "orchestr", "lead", "command") |
| Research Lab | FlaskConical | Research/analysts (role matches "research", "analyst", "data") |
| Writing Studio | Pen | Content/writers (role matches "writ", "content", "generator") |
| Meeting Room | Users | Agents with active `review`-status sessions |
| Break Room | Coffee | Idle, paused, or offline agents |

**Placement precedence:**
1. If status is `offline` or `paused` → Break Room
2. Else if agent has a session with `status === "review"` → Meeting Room
3. Else match by role keyword → Command/Research/Writing
4. Fallback → Command Center

Each non-Break-Room zone has a visual capacity of 3. Break Room is full-width and uncapped.

## 4. Agent Tile

Each agent tile shows:
- Colored avatar dot (from `avatarColor`) with pulse animation if `busy`
- Display name (bold)
- Model name (small muted)
- Current task line (primary color, if any)
- Status badge (idle/busy/offline/paused)

## 5. Stats Bar

Top of page, four stat cards:
- **Total** agents in workforce
- **Busy** count (status === "busy")
- **Idle** count (status === "idle")
- **Offline** count (status === "offline" || "paused")

Colored accent per stat using existing status color vars.

## 6. File Structure

```
src/
├── app/
│   └── office/
│       └── page.tsx
├── components/
│   └── office/
│       ├── virtual-office.tsx   — layout wrapper
│       ├── office-stats.tsx      — top stats bar
│       ├── office-zone.tsx       — zone card
│       └── agent-tile.tsx        — agent in zone
└── lib/
    └── office/
        └── zone-assignment.ts    — placement logic
```

## 7. Sidebar + Top Bar

- Enable "Office" nav item (`/office`)
- Add `/office → "Office"` mapping in top bar title dictionary

## 8. Out of Scope

- Drag-and-drop agent repositioning
- Custom user-defined zones
- Persistent layout preferences
- Agent chat/messaging between zones
- Animated agent transitions between zones
