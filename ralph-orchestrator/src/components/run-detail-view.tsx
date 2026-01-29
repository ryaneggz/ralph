"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
}

interface RunDetail {
  _id: string;
  type: string;
  status: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
  logs: string[];
}

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  running:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse",
  succeeded:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_DOT: Record<string, string> = {
  queued: "bg-blue-500",
  running: "bg-yellow-500 animate-pulse",
  succeeded: "bg-green-500",
  failed: "bg-red-500",
  canceled: "bg-gray-400",
};

// Patterns to detect error lines in logs
const ERROR_PATTERNS = [
  /^error/i,
  /\berror:/i,
  /\bERROR\b/,
  /\bfailed\b/i,
  /\bfailure\b/i,
  /\bexception\b/i,
  /\bpanic\b/i,
  /\bfatal\b/i,
];

function isErrorLine(line: string): boolean {
  return ERROR_PATTERNS.some((p) => p.test(line));
}

// Parse log line: "[2026-01-29T12:00:00.000Z] message" or plain text
function parseLogLine(line: string): { timestamp: string | null; message: string } {
  const match = line.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]\s?(.*)/);
  if (match) {
    return { timestamp: match[1], message: match[2] };
  }
  return { timestamp: null, message: line };
}

export function RunDetailView({
  projectId,
  runId,
  initialRun,
}: {
  projectId: string;
  runId: string;
  initialRun: RunDetail;
}) {
  const [run, setRun] = useState<RunDetail>(initialRun);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const isActive = run.status === "queued" || run.status === "running";
  const isTerminal = run.status === "succeeded" || run.status === "failed" || run.status === "canceled";

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun({
          _id: data._id,
          type: data.type,
          status: data.status,
          provider: data.provider,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          statusHistory: data.statusHistory ?? [],
          logs: data.logs ?? [],
        });
      }
    } catch {
      // ignore fetch errors
    }
  }, [projectId, runId]);

  // Poll every 5s while run is active
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(fetchRun, 5000);
    return () => clearInterval(interval);
  }, [isActive, fetchRun]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [run.logs, autoScroll]);

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/runs/${runId}/cancel`,
        { method: "POST" }
      );
      if (res.ok) {
        await fetchRun();
      }
    } catch {
      // ignore
    } finally {
      setCanceling(false);
    }
  }

  async function handleRerun() {
    setRerunning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: run.type, provider: run.provider }),
      });
      if (res.ok) {
        const newRun = await res.json();
        window.location.href = `/projects/${projectId}/runs/${newRun._id}`;
      }
    } catch {
      // ignore
    } finally {
      setRerunning(false);
    }
  }

  function handleDownloadLogs() {
    const content = run.logs.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-${run._id}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_STYLES[run.status] || ""}`}
        >
          {run.status}
        </span>
        <span className="text-sm text-muted-foreground">
          Created {new Date(run.createdAt).toLocaleString()}
        </span>
        {isActive && (
          <>
            <button
              onClick={handleCancel}
              disabled={canceling}
              className="px-3 py-1 text-xs font-medium rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canceling ? "Canceling..." : "Cancel Run"}
            </button>
            <span className="text-xs text-muted-foreground">
              (auto-refreshing)
            </span>
          </>
        )}
        {isTerminal && (
          <button
            onClick={handleRerun}
            disabled={rerunning}
            className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rerunning ? "Re-running..." : "Re-run"}
          </button>
        )}
      </div>

      {/* Status history timeline */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Status History</h3>
        {run.statusHistory.length > 0 ? (
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-border" />
            <div className="space-y-4">
              {run.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  <div
                    className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${STATUS_DOT[entry.status] || "bg-gray-400"}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">
                      {entry.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No status history available.</p>
        )}
      </div>

      {/* Log viewer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Logs</h3>
          {run.logs.length > 0 && (
            <button
              onClick={handleDownloadLogs}
              className="text-xs text-primary hover:underline"
            >
              Download .txt
            </button>
          )}
        </div>
        {run.logs.length > 0 ? (
          <div
            onScroll={handleLogScroll}
            className="bg-muted/50 border rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed"
          >
            {run.logs.map((line, i) => {
              const { timestamp, message } = parseLogLine(line);
              const error = isErrorLine(line);
              return (
                <div
                  key={i}
                  className={`py-0.5 ${error ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 -mx-2 px-2 rounded" : "text-foreground"}`}
                >
                  {timestamp && (
                    <span className="text-muted-foreground mr-2 select-none">
                      [{new Date(timestamp).toLocaleTimeString()}]
                    </span>
                  )}
                  <span>{message}</span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        ) : (
          <div className="bg-muted/50 border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isActive
                ? "Waiting for log output..."
                : "No logs available for this run."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
