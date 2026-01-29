"use client";

import { useState } from "react";
import Link from "next/link";
import { getProviderOptions } from "@/lib/provider-registry";

const PROVIDERS = getProviderOptions();

interface RunProviderSelectorProps {
  projectId: string;
  configuredProviders: string[];
  defaultProvider: string | null;
}

export function RunProviderSelector({
  projectId,
  configuredProviders,
  defaultProvider,
}: RunProviderSelectorProps) {
  const [selected, setSelected] = useState<string>(
    defaultProvider && configuredProviders.includes(defaultProvider)
      ? defaultProvider
      : configuredProviders[0] ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const noProviders = configuredProviders.length === 0;

  async function handleSaveDefault(provider: string) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProvider: provider }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleChange(provider: string) {
    setSelected(provider);
    handleSaveDefault(provider);
  }

  if (noProviders) {
    return (
      <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
          No providers configured
        </p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          You need to configure at least one provider API key before starting a run.{" "}
          <Link
            href={`/projects/${projectId}/settings`}
            className="text-primary underline"
          >
            Go to settings
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="provider-select" className="text-sm font-medium">
          Provider
        </label>
        <select
          id="provider-select"
          value={selected}
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PROVIDERS.map(({ key, label }) => {
            const isConfigured = configuredProviders.includes(key);
            return (
              <option key={key} value={key} disabled={!isConfigured}>
                {label}{!isConfigured ? " (Not Configured)" : ""}
              </option>
            );
          })}
        </select>
        {saved && (
          <span className="text-xs text-green-600">Default saved</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Select which provider to use for runs. Only configured providers are selectable.
      </p>
    </div>
  );
}
