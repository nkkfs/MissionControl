# Mission Control — Phase 3 Design Spec

**Date:** 2026-04-05
**Scope:** Phase 3 — Memory, Docs & Calendar
**Status:** Approved

---

## 1. Overview

Phase 3 adds three new modules to Mission Control:
1. **Memory page** (`/memory`) — searchable knowledge base of agent memory entries
2. **Docs page** (`/docs`) — document browser for agent-generated content
3. **Calendar page** (`/calendar`) — timeline view of scheduled tasks and events

All three follow the established Phase 2 pattern: local JSON files for data, Next.js API routes for reading, React hooks for state, and the existing design language.

## 2. Data Sources

### 2.1 Memories (Local JSON)

File: `data/memories.json`

```json
{
  "memories": [
    {
      "id": "mem-1",
      "agentId": "agent-main",
      "type": "knowledge",
      "title": "API Rate Limits",
      "content": "OpenAI API rate limit is 10,000 RPM for GPT-4o on current plan. Retry with exponential backoff after 429 responses.",
      "tags": ["api", "openai", "limits"],
      "createdAt": 1743880000000
    }
  ]
}
```

Memory types: `knowledge`, `note`, `context`

### 2.2 Documents (Local JSON)

File: `data/documents.json`

```json
{
  "documents": [
    {
      "id": "doc-1",
      "title": "Q1 Market Analysis Report",
      "type": "report",
      "agentId": "agent-research",
      "projectId": "proj-1",
      "summary": "Comprehensive analysis of market trends for Q1 2026...",
      "wordCount": 3200,
      "tags": ["market", "q1", "analysis"],
      "createdAt": 1743850000000,
      "updatedAt": 1743870000000
    }
  ]
}
```

Document types: `report`, `newsletter`, `analysis`, `note`

### 2.3 Schedule (Local JSON)

File: `data/schedule.json`

```json
{
  "events": [
    {
      "id": "evt-1",
      "title": "Weekly Newsletter Generation",
      "agentId": "agent-writer",
      "projectId": "proj-2",
      "type": "task",
      "status": "scheduled",
      "scheduledAt": 1743930000000,
      "duration": 60
    }
  ]
}
```

Event types: `task`, `deadline`, `review`
Event statuses: `scheduled`, `in_progress`, `completed`, `overdue`

### 2.4 New API Routes

- `GET /api/memories` — returns memories list
- `GET /api/documents` — returns documents list
- `GET /api/schedule` — returns events list

## 3. Memory Page (`/memory`)

### 3.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Memory                                               │
├─────────────────────────────────────────────────────┤
│ Agent memories and knowledge base                    │
│                                                      │
│ [Search...          ] [All Types ▼] [All Agents ▼]  │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📚 API Rate Limits                  knowledge   │ │
│ │ Primary Agent · 2h ago                          │ │
│ │ OpenAI API rate limit is 10,000 RPM...          │ │
│ │ #api #openai #limits                            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📝 Research Methodology                note     │ │
│ │ Research Agent · 5h ago                         │ │
│ │ When researching market data, always cross...   │ │
│ │ #methodology #research                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 Features

- Search bar filters by title and content
- Type filter dropdown (all/knowledge/note/context)
- Agent filter dropdown
- Cards show: type icon, title, type badge, agent name, relative time, content preview, tags
- Click to expand full content

## 4. Docs Page (`/docs`)

### 4.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Docs                                                 │
├─────────────────────────────────────────────────────┤
│ Agent-generated documents                            │
│                                                      │
│ [Search...          ] [All Types ▼] [All Agents ▼]  │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Q1 Market Analysis Report              report   │ │
│ │ Research Agent · proj: Q1 Market Research       │ │
│ │ Comprehensive analysis of market trends...      │ │
│ │ 3,200 words · Updated: 2h ago                   │ │
│ │ #market #q1 #analysis                           │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Weekly Newsletter #12              newsletter   │ │
│ │ Writer Agent · proj: Newsletter Pipeline        │ │
│ │ This week's highlights include...               │ │
│ │ 850 words · Updated: 5h ago                     │ │
│ │ #newsletter #weekly                             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4.2 Features

- Search, type filter, agent filter (same pattern as Memory)
- Cards show: title, type badge, agent, linked project name, summary, word count, updated time, tags
- Click to expand showing full summary and metadata

## 5. Calendar Page (`/calendar`)

### 5.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Calendar                                             │
├─────────────────────────────────────────────────────┤
│ Schedule and upcoming events                         │
│                                                      │
│ TODAY — Saturday, Apr 5                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 10:00  ● Weekly Newsletter Generation    task   │ │
│ │        Writer Agent · Newsletter Pipeline        │ │
│ │        ~60 min · scheduled                       │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 14:00  ● Market Data Review            review   │ │
│ │        Research Agent · Q1 Market Research       │ │
│ │        ~30 min · completed                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ TOMORROW — Sunday, Apr 6                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 09:00  ● Content Archive Deadline     deadline  │ │
│ │        Writer Agent · Content Archive            │ │
│ │        overdue                                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ UPCOMING                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Apr 8  ● Quarterly Report Generation     task   │ │
│ │        Primary Agent · Q1 Market Research        │ │
│ │        ~120 min · scheduled                      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.2 Features

- Events grouped by day: Today, Tomorrow, Upcoming
- Each event: time, colored dot by type, title, type badge, agent, project, duration, status
- Color coding: task=amber, deadline=red, review=blue
- Status badges: scheduled, in_progress, completed, overdue

## 6. Sidebar Updates

Enable these nav items:
- **Memory** (`/memory`) — enabled
- **Docs** (`/docs`) — enabled
- **Calendar** (`/calendar`) — enabled

## 7. New File Structure

```
src/
├── app/
│   ├── memory/
│   │   └── page.tsx
│   ├── docs/
│   │   └── page.tsx
│   ├── calendar/
│   │   └── page.tsx
│   └── api/
│       ├── memories/
│       │   └── route.ts
│       ├── documents/
│       │   └── route.ts
│       └── schedule/
│           └── route.ts
├── components/
│   ├── memory/
│   │   ├── memory-list.tsx
│   │   └── memory-card.tsx
│   ├── docs/
│   │   ├── doc-list.tsx
│   │   └── doc-card.tsx
│   └── calendar/
│       ├── event-timeline.tsx
│       └── event-card.tsx
├── lib/
│   └── hooks/
│       ├── use-memories.ts
│       ├── use-documents.ts
│       └── use-schedule.ts
data/
├── memories.json
├── documents.json
└── schedule.json
```

## 8. Shared Infrastructure Changes

### 8.1 Top Bar

Add pathname mappings for new pages: Memory, Docs, Calendar.

### 8.2 Types

New types: `Memory`, `MemoryType`, `Document`, `DocumentType`, `ScheduleEvent`, `EventType`, `EventStatus`.

## 9. Out of Scope (Phase 3)

- Creating/editing memories, docs, or events from the UI
- Real-time WebSocket events for memory/docs/calendar
- Rich text rendering for document content
- Recurring event patterns in calendar
- Integration with external calendar services
