# Mission Control — Phase 9 Design Spec

**Date:** 2026-04-06
**Scope:** Phase 9 — Agents Registry + Council (Intelligence Layer)
**Status:** Approved

---

## 1. Overview

Phase 9 adds the **intelligence layer** to Mission Control — the agent registry (the "who" of the workspace) and the council decision log (the "how decisions get made" among agents):

- **Agents (`/agents`)** — Registry catalog of agent definitions. Every agent card shows full configuration: display name, role, model, description, tool list, avatar. Stats by model and role. This is the configuration surface (what agents *are*), complementing Team which is the operational surface (what agents *are doing*).
- **Council (`/council`)** — Multi-agent decision log. Each entry is a proposal with a vote tally across council members (approve/reject/abstain) and a final outcome. Filter by outcome, stats for approval rate and pending votes.

Both pages are read-only and data-backed, matching the Phase 6-8 pattern. This phase completes the left sidebar — Agents and Council are the only remaining disabled nav items.

## 2. Agents Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Agents                                                  │
│ Full registry of agent definitions                      │
├─────────────────────────────────────────────────────────┤
│ [Total 5]  [Models 2]  [Tools 12]  [Roles: …]           │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐              │
│ │ [●] Research     │  │ [●] Editor       │              │
│ │ researcher-01    │  │ editor-01        │              │
│ │ RESEARCHER       │  │ EDITOR           │              │
│ │ claude-opus-4    │  │ claude-sonnet-4  │              │
│ │ Primary analyst… │  │ Copy refinement… │              │
│ │ [web] [search] … │  │ [read] [write] … │              │
│ └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## 3. Council Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Council                                                 │
│ Multi-agent decision log                                │
├─────────────────────────────────────────────────────────┤
│ [Decisions 6]  [Approval 67%]  [Pending 1]  [Quorum 4]  │
├─────────────────────────────────────────────────────────┤
│ Decisions    [All] [Approved] [Rejected] [Pending]      │
│ ┌──────────────────────────────────────────────────┐    │
│ │ APPROVED  · 2h ago · Initiated by Research       │    │
│ │ Publish Q1 Market Research Summary               │    │
│ │ [✓ researcher] [✓ editor] [✓ reviewer] [– client]│    │
│ │ "Strong synthesis, ready for distribution."      │    │
│ └──────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────┐    │
│ │ REJECTED  · yesterday · Initiated by Editor      │    │
│ │ Archive 2024 content tree                        │    │
│ │ [✗ researcher] [✗ editor] [✓ archivist]          │    │
│ │ "Premature — references still active."           │    │
│ └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 4. Data Model

### `data/council.json`
```json
{
  "decisions": [
    {
      "id": "dec-001",
      "title": "Publish Q1 Market Research Summary",
      "initiatorAgentId": "researcher-01",
      "outcome": "approved",
      "reason": "Strong synthesis, ready for distribution.",
      "votes": [
        { "agentId": "researcher-01", "vote": "approve" },
        { "agentId": "editor-01", "vote": "approve" },
        { "agentId": "reviewer-01", "vote": "approve" }
      ],
      "decidedAt": 1743960000000
    }
  ]
}
```

No `agents.json` — the Agents page reuses the existing `/api/team` hook, which already exposes `AgentFull` with `displayName`, `role`, `description`, `model`, `tools`, `avatarColor`.

## 5. Types (additions)

```ts
export type CouncilVote = "approve" | "reject" | "abstain";
export type CouncilOutcome = "approved" | "rejected" | "pending";

export interface CouncilBallot {
  agentId: string;
  vote: CouncilVote;
}

export interface CouncilDecision {
  id: string;
  title: string;
  initiatorAgentId: string;
  outcome: CouncilOutcome;
  reason: string;
  votes: CouncilBallot[];
  decidedAt: number;
}

export const COUNCIL_OUTCOME_COLORS: Record<CouncilOutcome, string> = {
  approved: "var(--status-green)",
  rejected: "var(--status-red)",
  pending: "var(--status-amber)",
};

export const COUNCIL_OUTCOME_LABELS: Record<CouncilOutcome, string> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

export const COUNCIL_VOTE_COLORS: Record<CouncilVote, string> = {
  approve: "var(--status-green)",
  reject: "var(--status-red)",
  abstain: "var(--status-gray)",
};
```

## 6. File Structure

```
data/
└── council.json

src/
├── app/
│   ├── agents/page.tsx
│   ├── council/page.tsx
│   └── api/
│       └── council/route.ts
├── components/
│   ├── agents/
│   │   ├── agents-registry.tsx
│   │   ├── agent-registry-card.tsx
│   │   └── agents-stats.tsx
│   └── council/
│       ├── council-log.tsx
│       ├── decision-card.tsx
│       └── council-stats.tsx
└── lib/
    └── hooks/
        └── use-council.ts
```

## 7. Sidebar + Top Bar

- Flip "Agents" (`/agents`) and "Council" (`/council`) from disabled to enabled
- Add both routes to top-bar title map

## 8. Out of Scope

- Editing agent definitions or modifying council membership
- Initiating new council votes from the UI
- Vote weights / quorum rules
- Historical vote diffs or audit trails beyond the fixtures
- Real-time updates during open voting (everything is static)
