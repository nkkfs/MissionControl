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
