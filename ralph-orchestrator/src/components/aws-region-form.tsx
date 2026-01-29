"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AWS_REGIONS, AWS_REGION_LABELS } from "@/lib/aws-regions";

interface AwsRegionFormProps {
  projectId: string;
  initialRegion: string;
}

export function AwsRegionForm({ projectId, initialRegion }: AwsRegionFormProps) {
  const router = useRouter();
  const [region, setRegion] = useState(initialRegion);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = region !== initialRegion;

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awsRegion: region }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setMessage({ type: "success", text: "AWS region saved" });
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="aws-region" className="block text-sm font-medium mb-1">
          AWS Region
        </label>
        <select
          id="aws-region"
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            setMessage(null);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {AWS_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r} — {AWS_REGION_LABELS[r] ?? r}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Runs will target this AWS region for infrastructure provisioning.
        </p>
      </div>

      {hasChanges && (
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Region"}
        </Button>
      )}

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
