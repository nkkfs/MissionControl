"use client";

import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTokens } from "@/lib/utils";
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
