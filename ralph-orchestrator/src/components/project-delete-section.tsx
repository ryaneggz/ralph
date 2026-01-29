"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectDeleteSectionProps {
  projectId: string;
  projectName: string;
}

export function ProjectDeleteSection({
  projectId,
  projectName,
}: ProjectDeleteSectionProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText === projectName;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete project");
        setDeleting(false);
        return;
      }

      router.push("/inbox");
      router.refresh();
    } catch {
      setError("Failed to delete project");
      setDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this project and all associated data including runs,
          drafts, and IaC configurations. This action is irreversible.
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowConfirm(true)}
        >
          Delete Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive mb-2">
          This action is irreversible.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently delete the project{" "}
          <strong>{projectName}</strong> and all associated data including runs,
          drafts, and IaC configurations.
        </p>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Type <strong>{projectName}</strong> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
          />
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <Button
            variant="destructive"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirm(false);
              setConfirmText("");
              setError("");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
