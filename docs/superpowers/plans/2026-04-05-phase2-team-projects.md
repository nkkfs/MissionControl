# Phase 2: Team Structure + Projects — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Team page (mission statement + agent cards with live status) and Projects page (project list with aggregated session data) to Mission Control, plus fix sidebar to use real Next.js routing.

**Architecture:** Local JSON/MD files provide static config (agent metadata, projects, mission statement), read via Next.js API routes. Live data from existing WebSocket hooks merges with static config in new domain hooks (`useTeam`, `useProjects`). Sidebar upgraded to proper `<Link>` routing with `usePathname`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui (base-ui), Lucide React, existing WebSocket infrastructure.

---

### Task 1: Create Sample Data Files

**Files:**
- Create: `data/agents.json`
- Create: `data/mission.md`
- Create: `data/projects.json`

- [ ] **Step 1: Create data directory and agents.json**

```bash
mkdir -p data
```

Create `data/agents.json`:

```json
{
  "agents": [
    {
      "id": "agent-main",
      "displayName": "Primary Agent",
      "role": "Lead Orchestrator",
      "description": "Coordinates all other agents and handles complex multi-step tasks. Responsible for task decomposition, delegation, and quality assurance.",
      "model": "GPT-4o",
      "tools": ["browser", "terminal", "file-ops", "web-search"],
      "avatarColor": "#D4A843"
    },
    {
      "id": "agent-research",
      "displayName": "Research Agent",
      "role": "Data Analyst",
      "description": "Handles web research, data gathering, and analysis tasks. Specializes in finding and synthesizing information from multiple sources.",
      "model": "Claude 3.5 Sonnet",
      "tools": ["browser", "web-search", "file-ops"],
      "avatarColor": "#3B82F6"
    },
    {
      "id": "agent-writer",
      "displayName": "Writer Agent",
      "role": "Content Generator",
      "description": "Creates written content including newsletters, reports, documentation, and social media posts.",
      "model": "Llama 3 70B",
      "tools": ["file-ops", "web-search"],
      "avatarColor": "#A855F7"
    }
  ]
}
```

- [ ] **Step 2: Create mission.md**

Create `data/mission.md`:

```markdown
Build an autonomous AI workforce that operates 24/7, handling research, content creation, and project management with minimal human supervision. Each agent specializes in its domain while the orchestrator ensures coherent execution across all initiatives.
```

- [ ] **Step 3: Create projects.json**

Create `data/projects.json`:

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
    },
    {
      "id": "proj-2",
      "name": "Newsletter Pipeline",
      "description": "Weekly newsletter creation and distribution workflow",
      "status": "active",
      "agentIds": ["agent-writer", "agent-main"],
      "tags": ["content", "newsletter"],
      "createdAt": 1743800000000,
      "updatedAt": 1743870000000
    },
    {
      "id": "proj-3",
      "name": "Content Archive",
      "description": "Organize and archive all generated content from 2025",
      "status": "completed",
      "agentIds": ["agent-writer"],
      "tags": ["content", "archive"],
      "createdAt": 1740000000000,
      "updatedAt": 1742000000000
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat: add sample data files for team and projects"
```

---

### Task 2: API Routes

**Files:**
- Create: `src/app/api/team/route.ts`
- Create: `src/app/api/projects/route.ts`

- [ ] **Step 1: Create team API route**

Create `src/app/api/team/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "data");

    let agents = [];
    try {
      const raw = await readFile(join(dataDir, "agents.json"), "utf-8");
      agents = JSON.parse(raw).agents ?? [];
    } catch {
      agents = [];
    }

    let mission = "";
    try {
      mission = await readFile(join(dataDir, "mission.md"), "utf-8");
    } catch {
      mission = "";
    }

    return NextResponse.json({ agents, mission });
  } catch {
    return NextResponse.json({ agents: [], mission: "" });
  }
}
```

- [ ] **Step 2: Create projects API route**

Create `src/app/api/projects/route.ts`:

```ts
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "data");
    const raw = await readFile(join(dataDir, "projects.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ projects: data.projects ?? [] });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for team and projects data"
```

---

### Task 3: Types & Hooks for Team and Projects

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/hooks/use-team.ts`
- Create: `src/lib/hooks/use-projects.ts`

- [ ] **Step 1: Add new types to src/types/index.ts**

Append to `src/types/index.ts`:

```ts
export interface AgentMeta {
  id: string;
  displayName: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  avatarColor: string;
}

export interface AgentFull extends Agent {
  displayName: string;
  role: string;
  description: string;
  model: string;
  tools: string[];
  avatarColor: string;
}

export type ProjectStatus = "active" | "paused" | "completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agentIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Create useTeam hook**

Create `src/lib/hooks/use-team.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { useAgents } from "./use-agents";
import type { AgentFull, AgentMeta } from "@/types";

export function useTeam() {
  const { agents: liveAgents, onlineCount } = useAgents();
  const [agentMetas, setAgentMetas] = useState<AgentMeta[]>([]);
  const [mission, setMission] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setAgentMetas(data.agents ?? []);
        setMission(data.mission ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const agents: AgentFull[] = agentMetas.map((meta) => {
    const live = liveAgents.find((a) => a.id === meta.id);
    return {
      id: meta.id,
      name: live?.name ?? meta.displayName,
      displayName: meta.displayName,
      role: meta.role,
      description: meta.description,
      model: meta.model,
      tools: meta.tools,
      avatarColor: meta.avatarColor,
      status: live?.status ?? "offline",
      lastSeen: live?.lastSeen ?? 0,
      currentTask: live?.currentTask ?? null,
    };
  });

  // Also include live agents not in config
  for (const live of liveAgents) {
    if (!agentMetas.find((m) => m.id === live.id)) {
      agents.push({
        ...live,
        displayName: live.name,
        role: "Unknown",
        description: "",
        model: "Unknown",
        tools: [],
        avatarColor: "#6B7280",
      });
    }
  }

  return { agents, mission, loading, onlineCount };
}
```

- [ ] **Step 3: Create useProjects hook**

Create `src/lib/hooks/use-projects.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { useSessions } from "./use-sessions";
import type { Project, Session } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { sessions } = useSessions();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const projectsWithStats = projects.map((project) => {
    const projectSessions = sessions.filter((s) =>
      project.agentIds.includes(s.agentId)
    );
    const totalTokens = projectSessions.reduce(
      (sum, s) => sum + s.usage.tokens,
      0
    );
    return {
      ...project,
      sessionCount: projectSessions.length,
      totalTokens,
      sessions: projectSessions,
    };
  });

  return { projects: projectsWithStats, loading };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/hooks/use-team.ts src/lib/hooks/use-projects.ts
git commit -m "feat: add types and hooks for team and projects"
```

---

### Task 4: Team Page Components

**Files:**
- Create: `src/components/team/mission-banner.tsx`
- Create: `src/components/team/agent-card.tsx`
- Create: `src/components/team/agent-detail.tsx`

- [ ] **Step 1: Create MissionBanner**

Create `src/components/team/mission-banner.tsx`:

```tsx
"use client";

import { Target } from "lucide-react";

interface MissionBannerProps {
  mission: string;
}

export function MissionBanner({ mission }: MissionBannerProps) {
  if (!mission) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 border-l-4 border-l-primary">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mission Statement
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{mission}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create AgentCard**

Create `src/components/team/agent-card.tsx`:

```tsx
"use client";

import { Wrench, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { AgentFull } from "@/types";
import { STATUS_COLORS } from "@/types";

interface AgentCardProps {
  agent: AgentFull;
  expanded: boolean;
  onToggle: () => void;
}

export function AgentCard({ agent, expanded, onToggle }: AgentCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border border-border bg-card text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        expanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Color accent top border */}
      <div
        className="h-1 rounded-t-lg"
        style={{ backgroundColor: agent.avatarColor }}
      />

      <div className="p-4">
        {/* Header: status dot + name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                agent.status === "busy" && "animate-pulse-dot"
              )}
              style={{ backgroundColor: STATUS_COLORS[agent.status] }}
            />
            <span className="text-sm font-semibold text-foreground">
              {agent.displayName}
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize">
            {agent.status}
          </Badge>
        </div>

        {/* Role */}
        <p className="mt-2 text-xs text-muted-foreground">{agent.role}</p>

        {/* Model */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cpu className="h-3 w-3" />
          <span>{agent.model}</span>
        </div>

        {/* Current task (if busy) */}
        {agent.currentTask && (
          <p className="mt-2 truncate text-xs text-primary/80">
            {agent.currentTask}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground/60">
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{agent.tools.length} tools</span>
          </div>
          {agent.lastSeen > 0 && (
            <span>Last seen: {formatRelativeTime(agent.lastSeen)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Create AgentDetail**

Create `src/components/team/agent-detail.tsx`:

```tsx
"use client";

import { Wrench, Cpu, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime, formatTokens } from "@/lib/utils";
import type { AgentFull, Session } from "@/types";

interface AgentDetailProps {
  agent: AgentFull;
  sessions: Session[];
}

export function AgentDetail({ agent, sessions }: AgentDetailProps) {
  const agentSessions = sessions.filter((s) => s.agentId === agent.id);
  const totalTokens = agentSessions.reduce((sum, s) => sum + s.usage.tokens, 0);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      {/* Description */}
      <p className="text-sm text-foreground/80 leading-relaxed">
        {agent.description || "No description available."}
      </p>

      <Separator className="my-4" />

      {/* Model & Tools */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Cpu className="h-3 w-3" />
            Model
          </h4>
          <p className="text-sm text-foreground">{agent.model}</p>
        </div>
        <div>
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Zap className="h-3 w-3" />
            Token Usage
          </h4>
          <p className="text-sm text-foreground">{formatTokens(totalTokens)}</p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Tools */}
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Wrench className="h-3 w-3" />
        Tools ({agent.tools.length})
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {agent.tools.map((tool) => (
          <Badge key={tool} variant="secondary" className="text-[10px]">
            {tool}
          </Badge>
        ))}
      </div>

      {/* Recent sessions */}
      {agentSessions.length > 0 && (
        <>
          <Separator className="my-4" />
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Clock className="h-3 w-3" />
            Recent Sessions ({agentSessions.length})
          </h4>
          <ScrollArea className="max-h-40">
            <div className="flex flex-col gap-1.5">
              {agentSessions.slice(0, 5).map((session) => (
                <div
                  key={session.key}
                  className="flex items-center justify-between rounded-md bg-background p-2 text-xs"
                >
                  <span className="text-foreground truncate">
                    {session.description ?? session.lastActivity ?? session.key}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    <span>{formatTokens(session.usage.tokens)} tkns</span>
                    <Badge variant="outline" className="text-[9px] capitalize">
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/team/
git commit -m "feat: add Team page components - mission banner, agent card, agent detail"
```

---

### Task 5: Team Page

**Files:**
- Create: `src/app/team/page.tsx`

- [ ] **Step 1: Create the Team page**

Create `src/app/team/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTeam } from "@/lib/hooks/use-team";
import { useSessions } from "@/lib/hooks/use-sessions";
import { MissionBanner } from "@/components/team/mission-banner";
import { AgentCard } from "@/components/team/agent-card";
import { AgentDetail } from "@/components/team/agent-detail";

export default function TeamPage() {
  const { agents, mission, loading } = useTeam();
  const { sessions } = useSessions();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Team</h2>
        <p className="text-xs text-muted-foreground">
          Agent hierarchy and configuration
        </p>
      </div>

      {/* Mission Statement */}
      <MissionBanner mission={mission} />

      {/* Agents */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agents
          </h3>
          <span className="text-xs text-muted-foreground/60">
            ({agents.length})
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex flex-col gap-3">
              <AgentCard
                agent={agent}
                expanded={expandedAgent === agent.id}
                onToggle={() =>
                  setExpandedAgent(
                    expandedAgent === agent.id ? null : agent.id
                  )
                }
              />
              {expandedAgent === agent.id && (
                <AgentDetail agent={agent} sessions={sessions} />
              )}
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground/50">
              No agents configured. Add agents to data/agents.json.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/team/
git commit -m "feat: add Team page with mission banner and agent grid"
```

---

### Task 6: Project Page Components

**Files:**
- Create: `src/components/projects/project-card.tsx`
- Create: `src/components/projects/project-detail.tsx`
- Create: `src/components/projects/project-list.tsx`

- [ ] **Step 1: Create ProjectCard**

Create `src/components/projects/project-card.tsx`:

```tsx
"use client";

import { Users, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTokens } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project & { sessionCount: number; totalTokens: number };
  expanded: boolean;
  onToggle: () => void;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: "border-status-green text-status-green",
  paused: "border-status-amber text-status-amber",
  completed: "border-status-gray text-status-gray",
};

export function ProjectCard({ project, expanded, onToggle }: ProjectCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
        "hover:border-border-hover hover:shadow-md hover:shadow-black/20",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        expanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        <Badge
          variant="outline"
          className={cn("text-[10px] capitalize", STATUS_BADGE_STYLES[project.status])}
        >
          {project.status}
        </Badge>
      </div>

      {/* Description */}
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
        {project.description}
      </p>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{project.agentIds.length} agent{project.agentIds.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{project.sessionCount} session{project.sessionCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{formatTokens(project.totalTokens)} tokens</span>
        </div>
      </div>

      {/* Updated */}
      <p className="mt-2 text-[10px] text-muted-foreground/40">
        Updated: {formatRelativeTime(project.updatedAt)}
      </p>
    </button>
  );
}
```

- [ ] **Step 2: Create ProjectDetail**

Create `src/components/projects/project-detail.tsx`:

```tsx
"use client";

import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTokens, formatRelativeTime } from "@/lib/utils";
import type { Project, Session, AgentFull } from "@/types";

interface ProjectDetailProps {
  project: Project & { sessionCount: number; totalTokens: number; sessions: Session[] };
  agents: AgentFull[];
}

export function ProjectDetail({ project, agents }: ProjectDetailProps) {
  const linkedAgents = agents.filter((a) => project.agentIds.includes(a.id));

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      {/* Linked Agents */}
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Users className="h-3 w-3" />
        Linked Agents
      </h4>
      <div className="flex flex-wrap gap-2">
        {linkedAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1"
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: agent.avatarColor }}
            />
            <span className="text-xs text-foreground">{agent.displayName}</span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {agent.status}
            </span>
          </div>
        ))}
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </>
      )}

      {/* Recent Sessions */}
      {project.sessions.length > 0 && (
        <>
          <Separator className="my-3" />
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Clock className="h-3 w-3" />
            Recent Sessions ({project.sessions.length})
          </h4>
          <ScrollArea className="max-h-48">
            <div className="flex flex-col gap-1.5">
              {project.sessions.slice(0, 8).map((session) => (
                <div
                  key={session.key}
                  className="flex items-center justify-between rounded-md bg-background p-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground">{session.agentId}</span>
                    <span className="text-foreground truncate">
                      {session.description ?? session.lastActivity ?? session.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    <span>{formatTokens(session.usage.tokens)}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">
                      {session.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {project.sessions.length === 0 && (
        <div className="mt-3 rounded-md border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground/40">
            No active sessions for this project
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create ProjectList**

Create `src/components/projects/project-list.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useProjects } from "@/lib/hooks/use-projects";
import { useTeam } from "@/lib/hooks/use-team";
import { ProjectCard } from "./project-card";
import { ProjectDetail } from "./project-detail";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const { agents } = useTeam();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {projects.map((project) => (
        <div key={project.id} className="flex flex-col gap-3">
          <ProjectCard
            project={project}
            expanded={expandedProject === project.id}
            onToggle={() =>
              setExpandedProject(
                expandedProject === project.id ? null : project.id
              )
            }
          />
          {expandedProject === project.id && (
            <ProjectDetail project={project} agents={agents} />
          )}
        </div>
      ))}

      {projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-xs text-muted-foreground/50">
            No projects configured. Add projects to data/projects.json.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/
git commit -m "feat: add Project components - card, detail, and list"
```

---

### Task 7: Projects Page

**Files:**
- Create: `src/app/projects/page.tsx`

- [ ] **Step 1: Create Projects page**

Create `src/app/projects/page.tsx`:

```tsx
import { ProjectList } from "@/components/projects/project-list";

export default function ProjectsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Projects</h2>
        <p className="text-xs text-muted-foreground">
          Goals, tasks, and progress tracking
        </p>
      </div>
      <ProjectList />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/projects/
git commit -m "feat: add Projects page with project list"
```

---

### Task 8: Sidebar Routing + Dynamic Top Bar Title

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/top-bar.tsx`

- [ ] **Step 1: Update sidebar to use Next.js routing**

Replace the sidebar's `useState(activePath)` with `usePathname()` and `<Link>`. Enable Team and Projects nav items.

In `src/components/layout/sidebar.tsx`:

1. Add imports: `import Link from "next/link"` and `import { usePathname } from "next/navigation"`
2. Replace `const [activePath, setActivePath] = useState("/tasks")` with `const activePath = usePathname()`
3. Remove `useState` from the imports if no longer used
4. Enable Team, Projects in NAV_ITEMS (set `enabled: true`)
5. Change the nav item rendering to use `<Link>` for enabled items instead of `<button>` with `onClick`

For collapsed mode (tooltip trigger), use `render` prop with `<Link>` element.
For expanded mode, render `<Link>` directly.

- [ ] **Step 2: Update top bar to show dynamic page title**

In `src/components/layout/top-bar.tsx`:

1. Add `import { usePathname } from "next/navigation"`
2. Derive page title from pathname:
```ts
const pathname = usePathname();
const pageTitle = pathname === "/team" ? "Team" : pathname === "/projects" ? "Projects" : "Tasks";
```
3. Use `pageTitle` instead of hardcoded "Tasks"

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/top-bar.tsx
git commit -m "feat: add real Next.js routing to sidebar, enable Team and Projects nav"
```

---

### Task 9: Smoke Test

- [ ] **Step 1: Verify all pages render**

Start dev server, check:
1. `/tasks` — Kanban board renders
2. `/team` — Mission statement + 3 agent cards render
3. `/projects` — 3 project cards render
4. Sidebar highlights correct active page
5. Top bar shows correct page title
6. Clicking agent cards expands detail
7. Clicking project cards expands detail
8. No console errors

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, all routes listed.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 2 complete — Team Structure and Project Management"
```
