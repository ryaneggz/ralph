"use client";

import { useState, useEffect, useCallback } from "react";

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

  const isActive = run.status === "queued" || run.status === "running";

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
          <span className="text-xs text-muted-foreground">
            (auto-refreshing)
          </span>
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
    </div>
  );
}
