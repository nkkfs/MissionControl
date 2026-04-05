# Mission Control — Phase 2 Design Spec

**Date:** 2026-04-05
**Scope:** Phase 2 — Team Structure View + Project Management
**Status:** Approved

---

## 1. Overview

Phase 2 adds two new modules to Mission Control:
1. **Team page** (`/team`) — displays the agent hierarchy, mission statement, and detailed agent cards with roles, models, and live status
2. **Projects page** (`/projects`) — groups tasks, documents, and notes around specific goals

Both modules follow the Phase 1 architecture: WebSocket data for live agent/session state, local JSON files for dashboard-level configuration (projects, agent metadata).

## 2. Data Sources

### 2.1 Agent Metadata (Local Config)

File: `data/agents.json` in project root (or configurable path).

Provides static metadata not available from WebSocket: role descriptions, assigned LLM model, configured tools, avatar color.

```json
{
  "agents": [
    {
      "id": "agent-main",
      "displayName": "Primary Agent",
      "role": "Lead Orchestrator",
      "description": "Coordinates all other agents and handles complex multi-step tasks",
      "model": "GPT-4o",
      "tools": ["browser", "terminal", "file-ops", "web-search"],
      "avatarColor": "#D4A843"
    }
  ]
}
```

Merged at runtime with live WebSocket agent data (status, lastSeen, currentTask).

### 2.2 Mission Statement (Local File)

File: `data/mission.md` in project root.

Simple markdown file displayed as a banner on the Team page. Read-only in Phase 2.

### 2.3 Projects (Local JSON)

File: `data/projects.json` in project root.

```json
{
  "projects": [
    {
      "id": "proj-1",
      "name": "Q1 Market Research",
      "description": "Comprehensive market analysis for Q1 2026",
      "status": "active",
      "agentIds": ["agent-main", "agent-research"],
      "tags": ["research", "q1"],
      "createdAt": 1743880000000,
      "updatedAt": 1743880000000
    }
  ]
}
```

Projects link to sessions via `agentIds` — any session from a linked agent appears under that project. Future phases can add explicit session-to-project tagging.

### 2.4 Next.js API Routes

Two simple API routes to read the local JSON/MD files:

- `GET /api/team` — returns merged agent metadata + mission statement
- `GET /api/projects` — returns projects list

These are thin wrappers around `fs.readFile`. No database.

## 3. Team Page (`/team`)

### 3.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Team                                                 │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎯 MISSION STATEMENT                            │ │
│ │                                                  │ │
│ │ "Build an autonomous AI workforce that operates  │ │
│ │ 24/7, handling research, content creation, and   │ │
│ │ project management with minimal supervision."    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ AGENTS (3)                                           │
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ ● Primary    │ │ ● Research   │ │ ○ Writer     │ │
│ │   Agent      │ │   Agent      │ │   Agent      │ │
│ │              │ │              │ │              │ │
│ │ Lead Orch.   │ │ Data Analyst │ │ Content Gen. │ │
│ │ GPT-4o       │ │ Claude 3.5   │ │ Llama 3      │ │
│ │ ● busy       │ │ ● idle       │ │ ○ offline    │ │
│ │              │ │              │ │              │ │
│ │ 🔧 4 tools   │ │ 🔧 3 tools   │ │ 🔧 2 tools   │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 Mission Statement Banner

- Full-width card at top of page
- Renders markdown content from `data/mission.md`
- Styled with subtle amber accent border-left
- Read-only in Phase 2

### 3.3 Agent Cards

Grid layout (responsive: 1-3 columns). Each card shows:

- **Status dot** — live from WebSocket (green=idle, amber=busy, red=error, gray=offline)
- **Name** — from local config `displayName`, fallback to WebSocket name
- **Role** — from local config
- **Model** — LLM model name (e.g., "GPT-4o", "Claude 3.5")
- **Status label** — text status from WebSocket
- **Current task** — if busy, shows current task from WebSocket
- **Tools count** — number of configured tools
- **Avatar accent** — colored top border from `avatarColor`

Click card → expands inline (no separate page) to show:
- Full description
- Tool list with names
- Recent sessions for this agent (from WebSocket `sessions.list` filtered by agentId)
- Token usage summary

### 3.4 Data Flow

```
data/agents.json (static metadata) ──┐
                                      ├──→ useTeam() hook ──→ Team Page
useAgents() (live WebSocket status) ──┘
data/mission.md ──→ /api/team ──→ useTeam() hook
```

## 4. Projects Page (`/projects`)

### 4.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Projects                                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Q1 Market Research                    ● active  │ │
│ │ Comprehensive market analysis for Q1 2026       │ │
│ │                                                  │ │
│ │ 👤 2 agents   📋 5 sessions   ⚡ 45.2k tokens   │ │
│ │ Updated: 2h ago                                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Newsletter Pipeline                   ● active  │ │
│ │ Weekly newsletter creation workflow              │ │
│ │                                                  │ │
│ │ 👤 1 agent    📋 3 sessions   ⚡ 12.1k tokens   │ │
│ │ Updated: 5h ago                                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Content Archive               ○ completed       │ │
│ │ ...                                              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4.2 Project Card

Each card shows:
- **Name** and **status badge** (active/paused/completed)
- **Description** — one-line summary
- **Stats row** — agent count, session count (live from WS), total tokens
- **Last updated** — relative timestamp

### 4.3 Project Detail (click to expand)

Expands inline below the card to show:
- **Linked agents** — small avatar chips
- **Recent sessions** — list of sessions from linked agents (from WebSocket)
- **Notes section** — placeholder for Phase 3 (memory/docs integration)

### 4.4 Data Flow

```
data/projects.json (project definitions) ──┐
                                            ├──→ useProjects() hook ──→ Projects Page
useSessions() (live session data) ─────────┘
useAgents() (live agent data) ─────────────┘
```

## 5. Sidebar Updates

Enable these nav items with proper Next.js routing:
- **Team** (`/team`) — enabled
- **Projects** (`/projects`) — enabled

The sidebar `setActivePath` will be replaced with Next.js `usePathname()` for real routing.

## 6. New File Structure

```
src/
├── app/
│   ├── team/
│   │   └── page.tsx
│   ├── projects/
│   │   └── page.tsx
│   └── api/
│       ├── team/
│       │   └── route.ts
│       └── projects/
│           └── route.ts
├── components/
│   ├── team/
│   │   ├── mission-banner.tsx
│   │   ├── agent-card.tsx
│   │   └── agent-detail.tsx
│   └── projects/
│       ├── project-list.tsx
│       ├── project-card.tsx
│       └── project-detail.tsx
├── lib/
│   └── hooks/
│       ├── use-team.ts
│       └── use-projects.ts
data/
├── agents.json
├── mission.md
└── projects.json
```

## 7. Component Tree

```
TeamPage
├── MissionBanner (reads mission.md via API)
└── AgentGrid
    └── AgentCard (×n)
        └── AgentDetail (expandable)

ProjectsPage
└── ProjectList
    └── ProjectCard (×n)
        └── ProjectDetail (expandable)
```

## 8. Shared Infrastructure Changes

### 8.1 Sidebar Routing

Replace `useState(activePath)` with Next.js `usePathname()` + `<Link>` components. This enables real page navigation instead of state-only highlighting.

### 8.2 Top Bar Dynamic Title

The top bar page title ("Tasks") should be dynamic based on current route.

## 9. Out of Scope (Phase 2)

- Editing mission statement from the UI
- Creating/editing projects from the UI (edit `data/projects.json` manually)
- Creating/editing agent configs from the UI (edit `data/agents.json` manually)
- Memory/docs integration in project detail (Phase 3)
- Agent-to-project tagging on sessions (projects use agentId linking only)
