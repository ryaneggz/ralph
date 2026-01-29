"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectRenameFormProps {
  projectId: string;
  currentName: string;
}

export function ProjectRenameForm({
  projectId,
  currentName,
}: ProjectRenameFormProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to rename project");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Failed to rename project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          maxLength={100}
          required
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {name.trim().length}/100 characters
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Project renamed successfully</p>
      )}
      <Button type="submit" disabled={saving || name.trim() === currentName}>
        {saving ? "Saving..." : "Rename Project"}
      </Button>
    </form>
  );
}
