# Mission Control — Phase 7 Design Spec

**Date:** 2026-04-06
**Scope:** Phase 7 — Factory + Pipeline (Automation Layer)
**Status:** Approved

---

## 1. Overview

Phase 7 adds two paired automation pages that describe *how* work gets done in the agent system:

- **Factory (`/factory`)** — Library of reusable **workflow templates**. Each template defines an ordered set of steps, the agent responsible for each step, how it's triggered (manual/scheduled/event), and execution stats (run count, last run).
- **Pipeline (`/pipeline`)** — Live **data flow visualization** showing current active pipelines as node-and-edge flow diagrams. Each stage node shows its current backlog count and average throughput; edges show handoff volume.

Both pages are **read-only** and backed by static JSON fixtures, following the Phase 6 pattern. They make the orchestration story concrete: *Factory* is the definition layer, *Pipeline* is the live view.

## 2. Factory Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Factory                                                 │
│ Reusable workflow templates                             │
├─────────────────────────────────────────────────────────┤
│ [Total 4] [Active 3] [Scheduled 1] [Runs today 12]      │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────┐      │
│ │ ⚙ Newsletter Build   │  │ ⚙ Research Digest    │      │
│ │ ACTIVE · scheduled   │  │ ACTIVE · manual      │      │
│ │ 1. Collect sources   │  │ 1. Seed query        │      │
│ │ 2. Draft body        │  │ 2. Summarize         │      │
│ │ 3. Review            │  │ 3. Export brief      │      │
│ │ 4. Publish           │  │                      │      │
│ │ 24 runs · 2h ago     │  │ 8 runs · yesterday   │      │
│ └──────────────────────┘  └──────────────────────┘      │
│ ┌──────────────────────┐  ┌──────────────────────┐      │
│ │ ⚙ Market Snapshot    │  │ ⚙ Content Archiver   │      │
│ │ ACTIVE · event       │  │ DRAFT                │      │
│ └──────────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 3. Pipeline Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Pipeline                                                │
│ Active data flows                                       │
├─────────────────────────────────────────────────────────┤
│ [Flows 2] [Items in flight 18] [Throughput 3.2/min]     │
├─────────────────────────────────────────────────────────┤
│ Newsletter Pipeline                                     │
│ ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐       │
│ │ Sources│──▶│ Draft  │──▶│ Review │──▶│Publish │       │
│ │   5    │   │   3    │   │   1    │   │   —    │       │
│ └────────┘   └────────┘   └────────┘   └────────┘       │
│ 2.4/min                                                 │
│                                                         │
│ Research Digest                                         │
│ ┌────────┐   ┌────────┐   ┌────────┐                    │
│ │ Queries│──▶│Synthesis│──▶│ Brief  │                   │
│ │   4    │   │   3    │   │   2    │                    │
│ └────────┘   └────────┘   └────────┘                    │
│ 0.8/min                                                 │
└─────────────────────────────────────────────────────────┘
```

## 4. Data Model

### `data/factory.json`
```json
{
  "templates": [
    {
      "id": "wf-newsletter",
      "name": "Newsletter Build",
      "description": "Weekly newsletter generation pipeline",
      "status": "active",
      "trigger": "scheduled",
      "triggerDetail": "Fri 09:00",
      "steps": [
        { "order": 1, "title": "Collect sources", "agentId": "agent-research" },
        { "order": 2, "title": "Draft body", "agentId": "agent-writer" },
        { "order": 3, "title": "Review", "agentId": "agent-main" },
        { "order": 4, "title": "Publish", "agentId": "agent-writer" }
      ],
      "runCount": 24,
      "lastRunAt": 1743890000000
    }
  ]
}
```

### `data/pipelines.json`
```json
{
  "pipelines": [
    {
      "id": "pipe-newsletter",
      "name": "Newsletter Pipeline",
      "throughputPerMinute": 2.4,
      "stages": [
        { "id": "src",    "label": "Sources", "count": 5 },
        { "id": "draft",  "label": "Draft",   "count": 3 },
        { "id": "review", "label": "Review",  "count": 1 },
        { "id": "pub",    "label": "Publish", "count": 0 }
      ]
    }
  ]
}
```

## 5. Types (additions)

```ts
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
```

## 6. File Structure

```
data/
├── factory.json
└── pipelines.json

src/
├── app/
│   ├── factory/page.tsx
│   ├── pipeline/page.tsx
│   └── api/
│       ├── factory/route.ts
│       └── pipelines/route.ts
├── components/
│   ├── factory/
│   │   ├── factory-grid.tsx
│   │   ├── workflow-card.tsx
│   │   └── factory-stats.tsx
│   └── pipeline/
│       ├── pipeline-view.tsx
│       ├── pipeline-flow.tsx
│       ├── pipeline-stage.tsx
│       └── pipeline-stats.tsx
└── lib/
    └── hooks/
        ├── use-factory.ts
        └── use-pipelines.ts
```

## 7. Sidebar + Top Bar

- Enable "Factory" (`/factory`) and "Pipeline" (`/pipeline`) nav items
- Top bar title mappings

## 8. Out of Scope

- Running/triggering workflows from the UI
- Editing workflow templates
- Real-time pipeline updates (static snapshot only)
- Drag-and-drop flow editor
- Historical run logs / drill-in
- Auto-scaling or throttling rules
