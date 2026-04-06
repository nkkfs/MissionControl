"use client";

import { usePathname } from "next/navigation";
import { Search, Pause, Settings, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket/provider";
import { useAgents } from "@/lib/hooks/use-agents";

export function TopBar() {
  const pathname = usePathname();
  const PAGE_TITLES: Record<string, string> = {
    "/tasks": "Tasks",
    "/team": "Team",
    "/projects": "Projects",
    "/memory": "Memory",
    "/docs": "Docs",
    "/calendar": "Calendar",
    "/office": "Virtual Office",
    "/system": "System",
    "/radar": "Radar",
    "/content": "Content",
    "/approvals": "Approvals",
  };
  const pageTitle = PAGE_TITLES[pathname] ?? "Tasks";
  const { connectionState } = useWebSocket();
  const { onlineCount } = useAgents();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
        {onlineCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {onlineCount} agent{onlineCount !== 1 ? "s" : ""} online
          </Badge>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="text-xs">Search</span>
          <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2">
          {connectionState === "connected" ? (
            <Wifi className="h-3.5 w-3.5 text-status-green" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-status-red" />
          )}
          <span className="text-xs text-muted-foreground">
            {connectionState === "connected" ? "Live" : connectionState}
          </span>
        </div>

        {/* Pause */}
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Pause className="h-3.5 w-3.5" />
          <span className="text-xs">Pause</span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
