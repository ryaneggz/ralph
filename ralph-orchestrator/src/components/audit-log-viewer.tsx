"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditLogData {
  entries: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "provider-keys", label: "Key Changes" },
  { value: "env-vars", label: "Env Vars" },
  { value: "run", label: "Runs" },
  { value: "project", label: "Config Updates" },
];

function actionBadgeColor(action: string): string {
  if (action === "create" || action === "rotate") return "bg-green-100 text-green-800";
  if (action === "delete") return "bg-red-100 text-red-800";
  if (action === "read") return "bg-blue-100 text-blue-800";
  if (action === "update") return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

export function AuditLogViewer({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AuditLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState("all");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionType !== "all") params.set("actionType", actionType);
      const res = await fetch(`/api/projects/${projectId}/audit-log?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, actionType, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (value: string) => {
    setActionType(value);
    setPage(1);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ACTION_TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              actionType === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !data || data.entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No audit log entries found.</p>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-2 font-medium">Action</th>
                  <th className="text-left px-4 py-2 font-medium">Resource</th>
                  <th className="text-left px-4 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry._id} className="border-t">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${actionBadgeColor(entry.action)}`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-muted-foreground">{entry.resourceType}</span>
                      {entry.resourceId && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({entry.resourceId})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {entry.metadata
                        ? Object.entries(entry.metadata)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} entries)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
