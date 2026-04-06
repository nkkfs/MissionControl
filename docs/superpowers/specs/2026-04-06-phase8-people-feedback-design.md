# Mission Control — Phase 8 Design Spec

**Date:** 2026-04-06
**Scope:** Phase 8 — People + Feedback (Human Layer)
**Status:** Approved

---

## 1. Overview

Phase 8 adds the **human layer** to Mission Control — the humans attached to projects (clients, reviewers, owners) and the feedback loop closing back on agent outputs:

- **People (`/people`)** — Directory of human stakeholders. Each card shows name, role, linked projects, and contact. Stats by role and active count.
- **Feedback (`/feedback`)** — Inbox of feedback entries tied to content items. Each entry has author (person), rating, comment, target content, and status (new/read/addressed). Filter by status. Stats for new count and average rating.

Both pages are read-only and JSON-backed, matching Phases 6-7.

## 2. People Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ People                                                  │
│ Humans connected to this workspace                      │
├─────────────────────────────────────────────────────────┤
│ [Total 5]  [Active 4]  [Roles: Client 2  Reviewer 2 …]  │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │ [JM]         │  │ [RK]         │  │ [SL]         │    │
│ │ Jamie Martin │  │ Riya Kumar   │  │ Sam Lee      │    │
│ │ CLIENT       │  │ REVIEWER     │  │ OWNER        │    │
│ │ Q1 Market…   │  │ Newsletter…  │  │ All projects │    │
│ │ jm@acme.co   │  │ rk@acme.co   │  │ sl@acme.co   │    │
│ └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 3. Feedback Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Feedback                                                │
│ Reviews and comments on content                         │
├─────────────────────────────────────────────────────────┤
│ [New 3]  [Avg rating 4.2]  [Addressed 4]  [Total 8]     │
├─────────────────────────────────────────────────────────┤
│ Inbox       [All] [New] [Read] [Addressed]              │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ★★★★★  NEW · Jamie Martin · 2h ago                │   │
│ │ Q1 Market Research Summary                        │   │
│ │ "Really strong synthesis — especially the sector…"│   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ★★★☆☆  READ · Riya Kumar · yesterday              │   │
│ │ Weekly Market Roundup #13                         │   │
│ │ "Good, but the intro paragraph felt rushed."      │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 4. Data Model

### `data/people.json`
```json
{
  "people": [
    {
      "id": "person-001",
      "name": "Jamie Martin",
      "role": "client",
      "email": "jamie@acme.co",
      "active": true,
      "projectIds": ["proj-1"],
      "createdAt": 1700000000000
    }
  ]
}
```

### `data/feedback.json`
```json
{
  "feedback": [
    {
      "id": "fb-001",
      "authorId": "person-001",
      "contentId": "content-001",
      "rating": 5,
      "status": "new",
      "comment": "Really strong synthesis…",
      "submittedAt": 1743890000000
    }
  ]
}
```

## 5. Types (additions)

```ts
export type PersonRole = "client" | "reviewer" | "owner" | "observer";

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  email: string;
  active: boolean;
  projectIds: string[];
  createdAt: number;
}

export const PERSON_ROLE_COLORS: Record<PersonRole, string> = {
  client: "var(--status-amber)",
  reviewer: "var(--status-blue)",
  owner: "var(--status-green)",
  observer: "var(--status-gray)",
};

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  client: "Client",
  reviewer: "Reviewer",
  owner: "Owner",
  observer: "Observer",
};

export type FeedbackStatus = "new" | "read" | "addressed";

export interface FeedbackEntry {
  id: string;
  authorId: string;
  contentId: string;
  rating: number; // 1..5
  status: FeedbackStatus;
  comment: string;
  submittedAt: number;
}

export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: "var(--status-amber)",
  read: "var(--status-blue)",
  addressed: "var(--status-green)",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  read: "Read",
  addressed: "Addressed",
};
```

## 6. File Structure

```
data/
├── people.json
└── feedback.json

src/
├── app/
│   ├── people/page.tsx
│   ├── feedback/page.tsx
│   └── api/
│       ├── people/route.ts
│       └── feedback/route.ts
├── components/
│   ├── people/
│   │   ├── people-grid.tsx
│   │   ├── person-card.tsx
│   │   └── people-stats.tsx
│   └── feedback/
│       ├── feedback-inbox.tsx
│       ├── feedback-card.tsx
│       └── feedback-stats.tsx
└── lib/
    └── hooks/
        ├── use-people.ts
        └── use-feedback.ts
```

## 7. Sidebar + Top Bar

- Enable "People" (`/people`) and "Feedback" (`/feedback`) nav items
- Top bar title mappings

## 8. Out of Scope

- Editing people or sending them messages
- Inline reply to feedback
- Notification preferences
- Authentication / real user accounts
- Email integration
- Rating distribution histograms
