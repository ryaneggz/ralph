"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PromptMdEditorProps {
  projectId: string;
  initialContent: string | null;
}

const DEFAULT_FRONTMATTER_KEYS = ["title", "agent", "iterations", "provider"];

export function PromptMdEditor({ projectId, initialContent }: PromptMdEditorProps) {
  const initialParsed = useMemo(() => {
    if (!initialContent) return { frontmatter: {} as Record<string, string>, body: "" };
    try {
      const { data, content: body } = matter(initialContent);
      return { frontmatter: data as Record<string, string>, body };
    } catch {
      return { frontmatter: {} as Record<string, string>, body: initialContent };
    }
  }, [initialContent]);

  const [frontmatter, setFrontmatter] = useState<Record<string, string>>(initialParsed.frontmatter);
  const [body, setBody] = useState(initialParsed.body);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const assembledContent = useMemo(() => {
    const fmEntries = Object.entries(frontmatter).filter(([, v]) => v.trim() !== "");
    if (fmEntries.length === 0) return body;
    const fmBlock = fmEntries.map(([k, v]) => `${k}: ${v}`).join("\n");
    return `---\n${fmBlock}\n---\n${body}`;
  }, [frontmatter, body]);

  const updateFrontmatter = useCallback((key: string, value: string) => {
    setFrontmatter((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/prompt-md`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptMd: assembledContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setFeedback({ type: "success", message: "PROMPT.md saved successfully" });
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  // Frontmatter keys to show: union of defaults + any existing keys
  const fmKeys = useMemo(() => {
    const existing = Object.keys(frontmatter);
    const all = new Set([...DEFAULT_FRONTMATTER_KEYS, ...existing]);
    return Array.from(all);
  }, [frontmatter]);

  return (
    <div className="space-y-6">
      {/* Frontmatter form */}
      <div className="rounded-md border p-4">
        <h4 className="text-sm font-semibold mb-3">Frontmatter</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fmKeys.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{key}</label>
              <input
                type="text"
                value={frontmatter[key] ?? ""}
                onChange={(e) => updateFrontmatter(key, e.target.value)}
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
                placeholder={key}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Split pane: editor + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border overflow-hidden" data-color-mode="light">
          <div className="px-3 py-2 border-b bg-muted text-xs font-medium">Editor</div>
          <MDEditor
            value={body}
            onChange={(val) => setBody(val ?? "")}
            height={400}
            preview="edit"
            hideToolbar={false}
          />
        </div>
        <div className="rounded-md border overflow-hidden">
          <div className="px-3 py-2 border-b bg-muted text-xs font-medium">Preview</div>
          <div className="prose prose-sm dark:prose-invert max-w-none p-4 h-[400px] overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="overflow-x-auto rounded-md bg-muted p-3">
                      <code className={`text-xs ${className ?? ""}`} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Save button + feedback */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save PROMPT.md"}
        </button>
        {feedback && (
          <span
            className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  );
}
