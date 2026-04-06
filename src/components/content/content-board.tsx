"use client";

import { useMemo } from "react";
import { useContent } from "@/lib/hooks/use-content";
import { useTeam } from "@/lib/hooks/use-team";
import { useProjects } from "@/lib/hooks/use-projects";
import { CONTENT_STAGE_ORDER } from "@/types";
import type { AgentFull, Project } from "@/types";
import { ContentStats } from "./content-stats";
import { ContentColumn } from "./content-column";

export function ContentBoard() {
  const { byStage, counts, total, loading } = useContent();
  const { agents } = useTeam();
  const { projects } = useProjects();

  const agentsById = useMemo(() => {
    const map: Record<string, AgentFull> = {};
    for (const a of agents) map[a.id] = a;
    return map;
  }, [agents]);

  const projectsById = useMemo(() => {
    const map: Record<string, Project> = {};
    for (const p of projects) map[p.id] = p;
    return map;
  }, [projects]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading content…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ContentStats total={total} counts={counts} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CONTENT_STAGE_ORDER.map((stage) => (
          <ContentColumn
            key={stage}
            stage={stage}
            items={byStage[stage]}
            agentsById={agentsById}
            projectsById={projectsById}
          />
        ))}
      </div>
    </div>
  );
}
