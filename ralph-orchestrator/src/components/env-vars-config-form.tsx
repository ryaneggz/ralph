"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnvVarRow {
  key: string;
  value: string;
  source: "platform" | "user";
  maskedValue?: string;
  isNew: boolean;
}

interface EnvVarsConfigFormProps {
  projectId: string;
  initialEnvVars: { key: string; source: "platform" | "user"; maskedValue: string }[];
}

export function EnvVarsConfigForm({
  projectId,
  initialEnvVars,
}: EnvVarsConfigFormProps) {
  const [rows, setRows] = useState<EnvVarRow[]>(
    initialEnvVars.map((v) => ({
      key: v.key,
      value: "",
      source: v.source,
      maskedValue: v.maskedValue,
      isNew: false,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { key: "", value: "", source: "user", isNew: true },
    ]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setRows((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
      );
    },
    []
  );

  async function handleSave() {
    // Validate
    for (const row of rows) {
      if (!row.key.trim()) {
        setMessage({ type: "error", text: "All env var keys must be non-empty." });
        return;
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.key.trim())) {
        setMessage({
          type: "error",
          text: `Invalid key "${row.key}". Must start with a letter or underscore and contain only letters, digits, and underscores.`,
        });
        return;
      }
    }

    const keys = rows.map((r) => r.key.trim());
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      setMessage({ type: "error", text: "Duplicate keys are not allowed." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const envVars = rows.map((r) => ({
        key: r.key.trim(),
        ...(r.value ? { value: r.value } : {}),
        source: r.source,
      }));

      const res = await fetch(`/api/projects/${projectId}/env-vars`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envVars }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save." });
        return;
      }

      const data = await res.json();
      setRows(
        data.envVars.map(
          (v: { key: string; source: "platform" | "user"; maskedValue: string }) => ({
            key: v.key,
            value: "",
            source: v.source,
            maskedValue: v.maskedValue,
            isNew: false,
          })
        )
      );
      setMessage({ type: "success", text: "Environment variables saved." });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(index: number) {
    const row = rows[index];
    if (row.isNew) {
      removeRow(index);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/env-vars`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: row.key }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete." });
        return;
      }

      removeRow(index);
      setMessage({ type: "success", text: `Removed "${row.key}".` });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
  }

  // Merged preview: platform vars first, then user vars (user overrides platform)
  const mergedPreview = (() => {
    const merged = new Map<string, { source: "platform" | "user"; display: string }>();
    for (const row of rows) {
      if (!row.key.trim()) continue;
      const display = row.value
        ? "••••••••"
        : row.maskedValue ?? "(not set)";
      merged.set(row.key.trim(), { source: row.source, display });
    }
    return Array.from(merged.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));
  })();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              {index === 0 && (
                <Label className="text-xs text-muted-foreground">Key</Label>
              )}
              <Input
                placeholder="VARIABLE_NAME"
                value={row.key}
                onChange={(e) => updateRow(index, "key", e.target.value)}
                disabled={row.source === "platform" && !row.isNew}
              />
            </div>
            <div className="flex-1 space-y-1">
              {index === 0 && (
                <Label className="text-xs text-muted-foreground">Value</Label>
              )}
              <Input
                type="password"
                placeholder={
                  row.maskedValue && !row.isNew
                    ? `${row.maskedValue} (enter to update)`
                    : "Value"
                }
                value={row.value}
                onChange={(e) => updateRow(index, "value", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {index === 0 && (
                <Label className="text-xs text-muted-foreground">Source</Label>
              )}
              <span
                className={`inline-block px-2 py-2 text-xs rounded ${
                  row.source === "platform"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {row.source}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800"
              onClick={() => handleDelete(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addRow}>
        + Add Variable
      </Button>

      {mergedPreview.length > 0 && (
        <div className="mt-4">
          <Label className="text-sm font-medium">
            Merged Environment Preview (values masked)
          </Label>
          <div className="mt-2 rounded border bg-muted/50 p-3 font-mono text-xs space-y-1">
            {mergedPreview.map((v) => (
              <div key={v.key} className="flex gap-2">
                <span className="text-muted-foreground">{v.key}=</span>
                <span>{v.display}</span>
                <span
                  className={`ml-auto text-[10px] px-1 rounded ${
                    v.source === "platform"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {v.source}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Environment Variables"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Values are encrypted via AWS Secrets Manager. Platform-injected variables
        (e.g., ANTHROPIC_API_KEY) are marked as &quot;platform&quot;. User-defined
        variables can override platform variables.
      </p>
    </div>
  );
}
