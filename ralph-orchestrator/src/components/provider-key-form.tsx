"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      setMessage({ type: "success", text: "API key saved successfully" });
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
      // Basic format validation for Claude Code keys
      if (provider === "claude-code" && !keyToTest.startsWith("sk-ant-")) {
        setMessage({ type: "error", text: "Invalid key format. Claude Code keys start with sk-ant-" });
        setTesting(false);
        return;
      }
      setMessage({ type: "success", text: "Key format looks valid. Full validation will occur on first use." });
    } else if (configured) {
      setMessage({ type: "success", text: "Key is configured. Full validation will occur on first use." });
    }

    setTesting(false);
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

      <div className="flex gap-2">
        <Input
          type="password"
          placeholder={configured ? "Enter new key to replace" : placeholder}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSave} disabled={saving || !apiKey.trim()} size="sm">
          {saving ? "Saving..." : configured ? "Replace" : "Save"}
        </Button>
        <Button
          onClick={handleTestConnection}
          disabled={testing || (!apiKey.trim() && !configured)}
          variant="outline"
          size="sm"
        >
          {testing ? "Testing..." : "Test"}
        </Button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
