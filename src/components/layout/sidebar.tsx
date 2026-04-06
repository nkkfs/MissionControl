"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare, Bot, FileText, ShieldCheck, Users,
  Calendar, FolderKanban, Brain, BookOpen, UserCircle,
  Building2, UsersRound, Settings, Radar, Factory,
  GitBranch, MessageSquare, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tasks", icon: CheckSquare, href: "/tasks", enabled: true },
  { label: "Agents", icon: Bot, href: "/agents", enabled: true },
  { label: "Content", icon: FileText, href: "/content", enabled: true },
  { label: "Approvals", icon: ShieldCheck, href: "/approvals", enabled: true },
  { label: "Council", icon: Users, href: "/council", enabled: true },
  { label: "Calendar", icon: Calendar, href: "/calendar", enabled: true },
  { label: "Projects", icon: FolderKanban, href: "/projects", enabled: true },
  { label: "Memory", icon: Brain, href: "/memory", enabled: true },
  { label: "Docs", icon: BookOpen, href: "/docs", enabled: true },
  { label: "People", icon: UserCircle, href: "/people", enabled: true },
  { label: "Office", icon: Building2, href: "/office", enabled: true },
  { label: "Team", icon: UsersRound, href: "/team", enabled: true },
  { label: "System", icon: Settings, href: "/system", enabled: true },
  { label: "Radar", icon: Radar, href: "/radar", enabled: true },
  { label: "Factory", icon: Factory, href: "/factory", enabled: true },
  { label: "Pipeline", icon: GitBranch, href: "/pipeline", enabled: true },
  { label: "Feedback", icon: MessageSquare, href: "/feedback", enabled: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const activePath = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("mc-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-surface transition-all duration-200",
          collapsed ? "w-14" : "w-52"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Settings className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="truncate text-sm font-semibold text-foreground">
                Mission Control
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-2",
            collapsed ? "px-1" : "px-2"
          )}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;

            const itemClasses = cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
              collapsed ? "justify-center px-0 py-2" : "",
              isActive
                ? "bg-primary/10 text-primary"
                : item.enabled
                  ? "text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  : "text-muted-foreground/40 cursor-not-allowed"
            );

            const content = (
              <>
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger
                    render={item.enabled ? <Link href={item.href} /> : <div role="button" tabIndex={0} />}
                    className={itemClasses}
                  >
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            if (item.enabled) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={itemClasses}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={item.label}
                className={itemClasses}
              >
                {content}
              </div>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
