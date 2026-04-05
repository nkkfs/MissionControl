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
