# Mission Control — Phase 6 Design Spec

**Date:** 2026-04-06
**Scope:** Phase 6 — Content Pipeline + Approvals Workflow
**Status:** Approved

---

## 1. Overview

Phase 6 adds two paired modules that turn the existing read-only `Docs` library into a **production workflow**:

- **Content (`/content`)** — A kanban-style pipeline view of content artifacts moving through stages: *Draft → In Review → Approved → Published*. Shows each piece's author agent, type, word count, and target project.
- **Approvals (`/approvals`)** — Human-in-the-loop approval queue. Lists pending approval requests tied to content items, with priority, requester agent, and submitted-at timestamps. Includes summary stats (pending / approved today / rejected today).

These are **read-only** views populated from static JSON, following the same pattern as Phases 2 and 3. Approve/reject buttons are visual-only (no state mutation) — actual workflow state comes from the gateway later.

## 2. Content Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Content                                                 │
│ Content pipeline by production stage                    │
├─────────────────────────────────────────────────────────┤
│ [Total 8]  [Draft 3]  [Review 2]  [Approved 1] [Pub 2]  │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ DRAFT  3 │ │ REVIEW 2 │ │ APPROVED │ │ PUBLISHED│     │
│ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤     │
│ │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────────┐│     │
│ ││title   ││ ││title   ││ ││title   ││ ││title   ││     │
│ ││author  ││ ││author  ││ ││author  ││ ││author  ││     │
│ ││825 w   ││ ││1.2k w  ││ ││950 w   ││ ││730 w   ││     │
│ │└────────┘│ │└────────┘│ │└────────┘│ │└────────┘│     │
│ │┌────────┐│ │┌────────┐│ │          │ │┌────────┐│     │
│ ││...     ││ ││...     ││ │          │ ││...     ││     │
│ │└────────┘│ │└────────┘│ │          │ │└────────┘│     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 3. Approvals Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Approvals                                               │
│ Pending review requests from the workforce              │
├─────────────────────────────────────────────────────────┤
│ [Pending 3]  [Approved today 2]  [Rejected today 0]     │
├─────────────────────────────────────────────────────────┤
│ Pending Queue                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⚠ HIGH · Q1 Market Summary                        │   │
│ │ Requested by Research Agent · 12 min ago          │   │
│ │ "Newsletter ready for final review before send"   │   │
│ │                               [Reject] [Approve]  │   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ NORMAL · Weekly roundup                           │   │
│ │ Requested by Writer Agent · 45 min ago            │   │
│ │                               [Reject] [Approve]  │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 4. Data Model

### `data/content.json`
```json
[
  {
    "id": "content-001",
    "title": "Q1 Market Research Summary",
    "type": "report",
    "stage": "review",
    "agentId": "agent-research",
    "projectId": "proj-001",
    "wordCount": 1240,
    "summary": "Executive summary of Q1 market trends…",
    "updatedAt": 1743897600000
  }
]
```

### `data/approvals.json`
```json
[
  {
    "id": "approval-001",
    "contentId": "content-001",
    "title": "Q1 Market Summary",
    "requesterAgentId": "agent-research",
    "priority": "high",
    "status": "pending",
    "requestedAt": 1743897600000,
    "message": "Newsletter ready for final review before send",
    "decidedAt": null
  }
]
```

## 5. Types (additions)

```ts
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
```

## 6. File Structure

```
data/
├── content.json
└── approvals.json

src/
├── app/
│   ├── content/
│   │   └── page.tsx
│   ├── approvals/
│   │   └── page.tsx
│   └── api/
│       ├── content/
│       │   └── route.ts
│       └── approvals/
│           └── route.ts
├── components/
│   ├── content/
│   │   ├── content-board.tsx     — 4-column kanban
│   │   ├── content-column.tsx    — single stage column
│   │   ├── content-card.tsx      — single item card
│   │   └── content-stats.tsx     — top stat bar
│   └── approvals/
│       ├── approvals-view.tsx    — layout wrapper
│       ├── approvals-stats.tsx   — top stats
│       ├── approval-card.tsx     — pending approval row
│       └── approval-queue.tsx    — list of pending approvals
└── lib/
    └── hooks/
        ├── use-content.ts
        └── use-approvals.ts
```

## 7. Sidebar + Top Bar

- Enable "Content" nav item (`/content`)
- Enable "Approvals" nav item (`/approvals`)
- Top-bar title mappings: `/content → "Content"`, `/approvals → "Approvals"`

## 8. Out of Scope

- Actual approve/reject mutations (buttons are visual-only)
- Drag-and-drop between content stages
- Content editor / composition view
- Approval history log
- Multi-reviewer workflows
- Email/Slack notifications
