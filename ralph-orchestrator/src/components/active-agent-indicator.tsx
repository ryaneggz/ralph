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
  const [confirming, setConfirming] = useState(false);
  const [stopping, setStopping] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/agent-session`);
      if (res.ok) {
        const data: AgentSession = await res.json();
        if (data.scaledDown) {
          setScaledDown({ reason: data.reason ?? "Idle timeout exceeded" });
          setSession(null);
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

  const handleStop = async () => {
    setStopping(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/agent-session/stop`, {
        method: "POST",
      });
      if (res.ok) {
        setSession(null);
        setConfirming(false);
        setScaledDown({ reason: "Manually stopped by user" });
        setTimeout(() => setScaledDown(null), 10000);
      }
    } catch {
      // ignore
    } finally {
      setStopping(false);
    }
  };

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
      {confirming ? (
        <span className="flex items-center gap-1 ml-2">
          <button
            onClick={handleStop}
            disabled={stopping}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {stopping ? "Stopping..." : "Confirm Stop"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={stopping}
            className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="ml-2 rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
        >
          Stop Agent
        </button>
      )}
    </div>
  );
}
