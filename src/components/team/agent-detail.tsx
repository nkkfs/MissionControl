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
