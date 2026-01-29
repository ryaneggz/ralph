"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateKeyFormat } from "@/lib/provider-registry";

interface ProviderKeyData {
  provider: string;
  maskedValue: string;
  configured: boolean;
}

interface ProviderKeyFormProps {
  projectId: string;
  provider: string;
  label: string;
  placeholder?: string;
  initialData?: ProviderKeyData | null;
}

export function ProviderKeyForm({
  projectId,
  provider,
  label,
  placeholder = "sk-...",
  initialData,
}: ProviderKeyFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(initialData?.configured ?? false);
  const [maskedValue, setMaskedValue] = useState(initialData?.maskedValue ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/provider-keys`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save key" });
        return;
      }

      const data = await res.json();
      setConfigured(true);
      setMaskedValue(data.maskedValue);
      setApiKey("");
      setRotating(false);
      setMessage({ type: "success", text: rotating ? "API key rotated successfully" : "API key saved successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to save key" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!apiKey.trim() && !configured) return;
    setTesting(true);
    setMessage(null);

    // Test connection validates key format
    // Full validation against Anthropic API requires backend integration
    const keyToTest = apiKey.trim() || "";

    if (keyToTest) {
      // Format validation via provider registry
      const formatError = validateKeyFormat(provider, keyToTest);
      if (formatError) {
        setMessage({ type: "error", text: formatError });
        setTesting(false);
        return;
      }
      setMessage({ type: "success", text: "Key format looks valid. Full validation will occur on first use." });
    } else if (configured) {
      setMessage({ type: "success", text: "Key is configured. Full validation will occur on first use." });
    }

    setTesting(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/provider-keys`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete key" });
        return;
      }

      setConfigured(false);
      setMaskedValue("");
      setApiKey("");
      setConfirmDelete(false);
      setMessage({ type: "success", text: "API key deleted successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to delete key" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {configured ? (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
            Configured ✓
          </span>
        ) : (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
            Not Configured
          </span>
        )}
      </div>

      {configured && maskedValue && (
        <p className="text-sm text-muted-foreground">
          Current key: <code className="bg-muted px-1 rounded">{maskedValue}</code>
        </p>
      )}

      {configured && !rotating ? (
        confirmDelete ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-destructive">Delete this key? This cannot be undone.</p>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
              size="sm"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
            <Button
              onClick={() => { setConfirmDelete(false); setMessage(null); }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => { setRotating(true); setMessage(null); }}
              variant="outline"
              size="sm"
            >
              Rotate
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              {testing ? "Testing..." : "Test"}
            </Button>
            <Button
              onClick={() => { setConfirmDelete(true); setMessage(null); }}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        )
      ) : (
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder={configured ? "Enter new key to rotate" : placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={saving || !apiKey.trim()} size="sm">
            {saving ? "Saving..." : configured ? "Rotate Key" : "Save"}
          </Button>
          <Button
            onClick={handleTestConnection}
            disabled={testing || !apiKey.trim()}
            variant="outline"
            size="sm"
          >
            {testing ? "Testing..." : "Test"}
          </Button>
          {configured && (
            <Button
              onClick={() => { setRotating(false); setApiKey(""); setMessage(null); }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
