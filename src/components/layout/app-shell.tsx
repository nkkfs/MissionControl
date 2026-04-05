"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { LogDrawer } from "./log-drawer";
import { ActivityFeed } from "@/components/activity/activity-feed";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [feedCollapsed, setFeedCollapsed] = useState(false);

  return (
    <div className="mx-auto flex h-screen max-w-[70%] overflow-hidden bg-background shadow-2xl shadow-black/50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Content + Activity Feed */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-hidden">{children}</div>
              <LogDrawer />
            </div>
          </div>

          {/* Activity Feed (right panel) */}
          <ActivityFeed
            collapsed={feedCollapsed}
            onToggle={() => setFeedCollapsed(!feedCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}
