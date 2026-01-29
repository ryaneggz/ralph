"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IAC_TEMPLATES } from "@/lib/iac-templates";

interface IacTemplateSelectorProps {
  projectId: string;
  initialTemplate: string | null;
}

export function IacTemplateSelector({ projectId, initialTemplate }: IacTemplateSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(initialTemplate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = selected !== initialTemplate;

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iacTemplate: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setMessage({ type: "success", text: "IaC template saved" });
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
      <p className="text-sm text-muted-foreground">
        Choose an infrastructure template for agent provisioning. This determines how your agents run on AWS.
      </p>
      <div className="grid gap-3">
        {IAC_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => {
              setSelected(template.id);
              setMessage(null);
            }}
            className={`text-left rounded-lg border p-4 transition-colors ${
              selected === template.id
                ? "border-primary bg-primary/5 ring-2 ring-primary"
                : "border-input hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{template.name}</span>
              <span className="text-xs text-muted-foreground">{template.estimatedCostRange}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </button>
        ))}
      </div>

      {hasChanges && selected && (
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Template"}
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
