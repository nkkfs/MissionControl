"use client";

import { useMemo } from "react";
import { usePeople } from "@/lib/hooks/use-people";
import { useProjects } from "@/lib/hooks/use-projects";
import type { Project } from "@/types";
import { PeopleStats } from "./people-stats";
import { PersonCard } from "./person-card";

export function PeopleGrid() {
  const { people, stats, loading } = usePeople();
  const { projects } = useProjects();

  const projectsById = useMemo(() => {
    const map: Record<string, Project> = {};
    for (const p of projects) map[p.id] = p;
    return map;
  }, [projects]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading people…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PeopleStats
        total={stats.total}
        active={stats.active}
        byRole={stats.byRole}
      />
      {people.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No people yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              projectsById={projectsById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
