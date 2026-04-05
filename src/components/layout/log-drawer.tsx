"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Terminal, Pause, Play, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLogs } from "@/lib/hooks/use-logs";
import { useAgents } from "@/lib/hooks/use-agents";

const LOG_LEVEL_COLORS: Record<string, string> = {
  DEBUG: "text-muted-foreground/50",
  INFO: "text-foreground",
  WARN: "text-status-amber",
  ERROR: "text-status-red",
};

export function LogDrawer() {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(200);
  const { logs, paused, pendingCount, filter, agentFilter, setFilter, setAgentFilter, pause, resume, clear } = useLogs();
  const { agents } = useAgents();
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, paused]);

  // Resize handler
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    resizeRef.current = { startY: e.clientY, startHeight: height };
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startY - e.clientY;
      const newHeight = Math.min(Math.max(resizeRef.current.startHeight + delta, 100), window.innerHeight * 0.5);
      setHeight(newHeight);
    };
    const onMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [height]);

  // Keyboard shortcut: Ctrl+`
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col border-t border-border">
      {/* Toggle bar (always visible) */}
      <div className="flex h-8 items-center justify-between bg-surface px-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Logs</span>
          {!open && paused && pendingCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{pendingCount} new</Badge>
          )}
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {open && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="h-5 w-32 rounded border border-border bg-background px-2 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={agentFilter ?? ""}
              onChange={(e) => setAgentFilter(e.target.value || null)}
              className="h-5 rounded border border-border bg-background px-1 text-[10px] text-foreground focus:outline-none"
            >
              <option value="">All</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={paused ? resume : pause}>
              {paused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clear}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Log content */}
      {open && (
        <>
          {/* Resize handle */}
          <div className="resize-handle h-1 bg-border" onMouseDown={onMouseDown} />

          <div
            ref={scrollRef}
            className="overflow-auto font-mono text-[11px] leading-relaxed"
            style={{ height, backgroundColor: "#0D0D0D" }}
          >
            <div className="p-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 whitespace-pre">
                  <span className="shrink-0 text-muted-foreground/40">{log.timestamp}</span>
                  <span className={cn("shrink-0 w-12", LOG_LEVEL_COLORS[log.level] ?? "text-foreground")}>
                    {log.level}
                  </span>
                  <span className="shrink-0 text-status-blue">[{log.source}]</span>
                  <span className={LOG_LEVEL_COLORS[log.level] ?? "text-foreground"}>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <span className="text-muted-foreground/30">Waiting for logs...</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
