"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RunSummary {
  _id: string;
  type: string;
  status: string;
  provider: string;
  createdAt: string;
  statusHistory: { status: string; timestamp: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  running: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse",
  succeeded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function RunActions({
  projectId,
  defaultProvider,
  hasConfiguredProvider,
}: {
  projectId: string;
  defaultProvider: string | null;
  hasConfiguredProvider: boolean;
}) {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/runs`);
      if (res.ok) {
        setRuns(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const startRun = async (type: "plan" | "apply" | "destroy") => {
    if (!defaultProvider) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, provider: defaultProvider }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start run");
        return;
      }
      await fetchRuns();
      router.refresh();
    } catch {
      setError("Failed to start run");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => startRun("plan")}
          disabled={starting || !hasConfiguredProvider || !defaultProvider}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {starting ? "Starting..." : "Plan"}
        </button>
        {!hasConfiguredProvider && (
          <span className="text-xs text-muted-foreground">
            Configure a provider and select it to start runs
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && runs.length === 0 && (
        <p className="text-sm text-muted-foreground">Loading runs...</p>
      )}

      {runs.length > 0 && (
        <div className="border rounded-md divide-y">
          {runs.map((run) => (
            <div key={run._id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium capitalize">{run.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[run.status] || ""}`}>
                  {run.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {run.provider}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(run.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && runs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No runs yet. Click &quot;Plan&quot; to preview infrastructure changes.
        </p>
      )}
    </div>
  );
}
