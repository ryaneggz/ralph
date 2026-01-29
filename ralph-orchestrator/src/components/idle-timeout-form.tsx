"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function IdleTimeoutForm({
  projectId,
  initialTimeout,
}: {
  projectId: string;
  initialTimeout: number;
}) {
  const [value, setValue] = useState(initialTimeout);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idleTimeoutMinutes: value }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Idle timeout updated" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Agent sessions automatically spin down after being idle for the configured timeout.
        Changes apply to the next agent session.
      </p>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm font-medium tabular-nums w-20 text-right">
          {value} min
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || value === initialTimeout}
          size="sm"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        {message && (
          <span
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
