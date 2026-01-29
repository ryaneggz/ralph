"use client";

import { useEffect, useState, useCallback } from "react";

interface AgentSession {
  active: boolean;
  scaledDown?: boolean;
  reason?: string;
  runId?: string;
  type?: string;
  status?: string;
  provider?: string;
  startedAt?: string;
  uptimeMs?: number;
  iterationNumber?: number;
  idleTimeoutMinutes?: number;
  idleMs?: number;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function ActiveAgentIndicator({ projectId }: { projectId: string }) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [uptimeMs, setUptimeMs] = useState(0);
  const [scaledDown, setScaledDown] = useState<{ reason: string } | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/agent-session`);
      if (res.ok) {
        const data: AgentSession = await res.json();
        if (data.scaledDown) {
          setScaledDown({ reason: data.reason ?? "Idle timeout exceeded" });
          setSession(null);
          // Clear scaled-down notice after 10 seconds
          setTimeout(() => setScaledDown(null), 10000);
        } else {
          setSession(data);
          setScaledDown(null);
          if (data.active && data.uptimeMs) {
            setUptimeMs(data.uptimeMs);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Tick uptime locally between polls
  useEffect(() => {
    if (!session?.active) return;
    const tick = setInterval(() => {
      setUptimeMs((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(tick);
  }, [session?.active]);

  if (scaledDown) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 px-3 py-1.5 text-sm">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="font-medium text-yellow-800 dark:text-yellow-200">
          Scaled Down
        </span>
        <span className="text-yellow-600 dark:text-yellow-400">
          {scaledDown.reason}
        </span>
      </div>
    );
  }

  if (!session?.active) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-3 py-1.5 text-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      <span className="font-medium text-green-800 dark:text-green-200">
        Agent Active
      </span>
      <span className="text-green-600 dark:text-green-400">
        {session.type} · {session.provider} · Run #{session.iterationNumber}
      </span>
      <span className="text-green-500 dark:text-green-500 tabular-nums">
        {formatUptime(uptimeMs)}
      </span>
    </div>
  );
}
