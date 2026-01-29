"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  projectName,
  defaultProvider,
  hasConfiguredProvider,
}: {
  projectId: string;
  projectName: string;
  defaultProvider: string | null;
  hasConfiguredProvider: boolean;
}) {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingApply, setConfirmingApply] = useState(false);
  const [confirmingDestroy, setConfirmingDestroy] = useState(false);
  const [destroyConfirmName, setDestroyConfirmName] = useState("");
  const [cancelingRunId, setCancelingRunId] = useState<string | null>(null);
  const [rerunningRunId, setRerunningRunId] = useState<string | null>(null);

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

  // Poll every 5s when any run is active (queued or running)
  const hasActiveRun = runs.some(
    (r) => r.status === "queued" || r.status === "running"
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (hasActiveRun) {
      pollRef.current = setInterval(fetchRuns, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [hasActiveRun, fetchRuns]);

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

  const rerunRun = async (run: RunSummary, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRerunningRunId(run._id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: run.type, provider: run.provider }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to re-run");
        return;
      }
      await fetchRuns();
      router.refresh();
    } catch {
      setError("Failed to re-run");
    } finally {
      setRerunningRunId(null);
    }
  };

  const cancelRun = async (runId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    setCancelingRunId(runId);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/runs/${runId}/cancel`,
        { method: "POST" }
      );
      if (res.ok) {
        await fetchRuns();
      }
    } catch {
      // ignore
    } finally {
      setCancelingRunId(null);
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
        {!confirmingApply ? (
          <button
            onClick={() => setConfirmingApply(true)}
            disabled={starting || !hasConfiguredProvider || !defaultProvider}
            className="px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        ) : (
          <div className="flex items-center gap-2 border border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950 rounded-md px-3 py-1.5">
            <span className="text-xs text-orange-800 dark:text-orange-200">
              This will provision real infrastructure. Continue?
            </span>
            <button
              onClick={() => {
                setConfirmingApply(false);
                startRun("apply");
              }}
              disabled={starting}
              className="px-3 py-1 text-xs font-medium rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {starting ? "Starting..." : "Confirm Apply"}
            </button>
            <button
              onClick={() => setConfirmingApply(false)}
              disabled={starting}
              className="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
        {!confirmingDestroy ? (
          <button
            onClick={() => setConfirmingDestroy(true)}
            disabled={starting || !hasConfiguredProvider || !defaultProvider}
            className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Destroy
          </button>
        ) : (
          <div className="flex items-center gap-2 border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950 rounded-md px-3 py-1.5">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-red-800 dark:text-red-200">
                This will destroy all infrastructure. Type <strong>{projectName}</strong> to confirm:
              </span>
              <input
                type="text"
                value={destroyConfirmName}
                onChange={(e) => setDestroyConfirmName(e.target.value)}
                placeholder={projectName}
                className="px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <button
              onClick={() => {
                setConfirmingDestroy(false);
                setDestroyConfirmName("");
                startRun("destroy");
              }}
              disabled={starting || destroyConfirmName !== projectName}
              className="px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? "Starting..." : "Confirm Destroy"}
            </button>
            <button
              onClick={() => {
                setConfirmingDestroy(false);
                setDestroyConfirmName("");
              }}
              disabled={starting}
              className="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
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
            <Link
              key={run._id}
              href={`/projects/${projectId}/runs/${run._id}`}
              className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium capitalize">{run.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[run.status] || ""}`}>
                  {run.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {run.provider}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(run.status === "queued" || run.status === "running") && (
                  <button
                    onClick={(e) => cancelRun(run._id, e)}
                    disabled={cancelingRunId === run._id}
                    className="px-2 py-0.5 text-xs font-medium rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelingRunId === run._id ? "Canceling..." : "Cancel"}
                  </button>
                )}
                {(run.status === "succeeded" || run.status === "failed" || run.status === "canceled") && (
                  <button
                    onClick={(e) => rerunRun(run, e)}
                    disabled={rerunningRunId === run._id}
                    className="px-2 py-0.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rerunningRunId === run._id ? "Re-running..." : "Re-run"}
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
              </div>
            </Link>
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
