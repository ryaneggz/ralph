"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RepoConfigFormProps {
  projectId: string;
  initialRepo?: {
    url: string;
    branch: string;
    hasAccessToken: boolean;
  } | null;
}

export function RepoConfigForm({ projectId, initialRepo }: RepoConfigFormProps) {
  const [url, setUrl] = useState(initialRepo?.url ?? "");
  const [branch, setBranch] = useState(initialRepo?.branch ?? "main");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const urlPattern = /^https:\/\/.+\.git$/;

  async function handleSave() {
    if (!url.trim()) {
      setMessage({ type: "error", text: "Repository URL is required." });
      return;
    }
    if (!urlPattern.test(url.trim())) {
      setMessage({ type: "error", text: "Invalid URL. Must be an HTTPS Git URL ending in .git" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/repo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          branch: branch.trim() || "main",
          ...(accessToken ? { accessToken } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save." });
        return;
      }

      setMessage({ type: "success", text: "Repository settings saved." });
      setAccessToken("");
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestClone() {
    if (!url.trim()) {
      setMessage({ type: "error", text: "Enter a repository URL first." });
      return;
    }
    if (!urlPattern.test(url.trim())) {
      setMessage({ type: "error", text: "Invalid URL format." });
      return;
    }

    setTesting(true);
    setMessage(null);

    // Simulate test clone — in production this would call a backend endpoint
    // that attempts a shallow clone with the given credentials
    try {
      // For now, validate the URL format only. Full clone test requires backend infrastructure.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: "success", text: "URL format is valid. Full clone test requires backend infrastructure." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="repo-url">Repository URL (required)</Label>
        <Input
          id="repo-url"
          type="url"
          placeholder="https://github.com/org/repo.git"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          HTTPS Git URL (e.g., https://github.com/org/repo.git)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repo-branch">Branch</Label>
        <Input
          id="repo-branch"
          placeholder="main"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="repo-token">Access Token (optional, for private repos)</Label>
        <Input
          id="repo-token"
          type="password"
          placeholder={initialRepo?.hasAccessToken ? "••••••••  (token configured)" : "Enter access token"}
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Token will be encrypted via AWS Secrets Manager on save.
        </p>
      </div>

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
          {saving ? "Saving..." : "Save Repository Settings"}
        </Button>
        <Button variant="outline" onClick={handleTestClone} disabled={testing}>
          {testing ? "Testing..." : "Test Clone"}
        </Button>
      </div>
    </div>
  );
}
