"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface VersionSummary {
  versionId: string;
  label: "draft" | "applied" | "generated";
  fileCount: number;
  filePaths: string[];
  createdAt: string;
}

interface IacFile {
  path: string;
  content: string;
}

interface VersionDetail {
  versionId: string;
  label: string;
  files: IacFile[];
  createdAt: string;
}

interface IacVersionHistoryProps {
  projectId: string;
  onRestore: (files: IacFile[]) => void;
}

function labelColor(label: string): string {
  switch (label) {
    case "applied":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "draft":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "generated":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function computeLineDiff(
  oldText: string,
  newText: string
): { type: "same" | "added" | "removed"; line: string }[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: { type: "same" | "added" | "removed"; line: string }[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const diffs: { type: "same" | "added" | "removed"; line: string }[] = [];
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffs.push({ type: "same", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.push({ type: "added", line: newLines[j - 1] });
      j--;
    } else {
      diffs.push({ type: "removed", line: oldLines[i - 1] });
      i--;
    }
  }

  diffs.reverse();
  result.push(...diffs);
  return result;
}

export function IacVersionHistory({
  projectId,
  onRestore,
}: IacVersionHistoryProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diff state
  const [diffLeft, setDiffLeft] = useState<string | null>(null);
  const [diffRight, setDiffRight] = useState<string | null>(null);
  const [diffLeftDetail, setDiffLeftDetail] = useState<VersionDetail | null>(
    null
  );
  const [diffRightDetail, setDiffRightDetail] = useState<VersionDetail | null>(
    null
  );
  const [diffFile, setDiffFile] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  // Restore state
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/iac-versions`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load versions");
        return;
      }
      setVersions(data.versions);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleToggle = () => {
    if (!expanded) {
      fetchVersions();
    }
    setExpanded(!expanded);
  };

  const fetchVersionDetail = async (
    versionId: string
  ): Promise<VersionDetail | null> => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/iac-versions/${versionId}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleDiff = async () => {
    if (!diffLeft || !diffRight) return;
    setLoadingDiff(true);
    const [left, right] = await Promise.all([
      fetchVersionDetail(diffLeft),
      fetchVersionDetail(diffRight),
    ]);
    setDiffLeftDetail(left);
    setDiffRightDetail(right);
    // Pick first common file path for diff
    if (left && right) {
      const commonPath = left.files.find((f) =>
        right.files.some((rf) => rf.path === f.path)
      )?.path;
      setDiffFile(commonPath ?? left.files[0]?.path ?? null);
    }
    setLoadingDiff(false);
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/iac-versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (res.ok) {
        onRestore(data.files);
        fetchVersions();
      } else {
        setError(data.error ?? "Failed to restore");
      }
    } catch {
      setError("Network error");
    } finally {
      setRestoring(null);
    }
  };

  // Get diff lines for selected file
  const diffLines =
    diffLeftDetail && diffRightDetail && diffFile
      ? computeLineDiff(
          diffLeftDetail.files.find((f) => f.path === diffFile)?.content ?? "",
          diffRightDetail.files.find((f) => f.path === diffFile)?.content ?? ""
        )
      : null;

  // All unique file paths across both versions for diff file selector
  const allDiffPaths =
    diffLeftDetail && diffRightDetail
      ? [
          ...new Set([
            ...diffLeftDetail.files.map((f) => f.path),
            ...diffRightDetail.files.map((f) => f.path),
          ]),
        ]
      : [];

  return (
    <div className="mt-4">
      <Button variant="outline" size="sm" onClick={handleToggle}>
        {expanded ? "Hide Version History" : "Version History"}
      </Button>

      {expanded && (
        <div className="mt-3 border rounded-md p-4 space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading versions...</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && versions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No version history yet. Generate or save IaC files to create
              versions.
            </p>
          )}

          {versions.length > 0 && (
            <>
              {/* Version list */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.versionId}
                    className="flex items-center justify-between border rounded-md p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="diffLeft"
                        value={v.versionId}
                        checked={diffLeft === v.versionId}
                        onChange={() => setDiffLeft(v.versionId)}
                        className="h-3 w-3"
                        title="Select as left (older) for diff"
                      />
                      <input
                        type="radio"
                        name="diffRight"
                        value={v.versionId}
                        checked={diffRight === v.versionId}
                        onChange={() => setDiffRight(v.versionId)}
                        className="h-3 w-3"
                        title="Select as right (newer) for diff"
                      />
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${labelColor(v.label)}`}
                      >
                        {v.label}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({v.fileCount} file{v.fileCount !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={restoring === v.versionId}
                      onClick={() => handleRestore(v.versionId)}
                    >
                      {restoring === v.versionId ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Diff controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!diffLeft || !diffRight || diffLeft === diffRight || loadingDiff}
                  onClick={handleDiff}
                >
                  {loadingDiff ? "Loading Diff..." : "Compare Selected"}
                </Button>
                {diffLeft && diffRight && diffLeft === diffRight && (
                  <span className="text-xs text-muted-foreground">
                    Select two different versions to compare
                  </span>
                )}
              </div>

              {/* Diff view */}
              {diffLines && (
                <div>
                  {allDiffPaths.length > 1 && (
                    <div className="mb-2">
                      <select
                        value={diffFile ?? ""}
                        onChange={(e) => setDiffFile(e.target.value)}
                        className="text-xs border rounded px-2 py-1 bg-background"
                      >
                        {allDiffPaths.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="border rounded-md overflow-auto max-h-80 font-mono text-xs">
                    {diffLines.map((d, i) => (
                      <div
                        key={i}
                        className={`px-3 py-0.5 whitespace-pre ${
                          d.type === "added"
                            ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200"
                            : d.type === "removed"
                              ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200"
                              : ""
                        }`}
                      >
                        <span className="select-none text-muted-foreground mr-2">
                          {d.type === "added"
                            ? "+"
                            : d.type === "removed"
                              ? "-"
                              : " "}
                        </span>
                        {d.line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
