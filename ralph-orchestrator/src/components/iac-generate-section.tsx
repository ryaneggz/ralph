"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface IacFile {
  path: string;
  content: string;
}

interface IacGenerateSectionProps {
  projectId: string;
  iacTemplate: string | null;
  initialFiles: IacFile[];
}

function getLanguage(path: string): string {
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  return "plaintext";
}

export function IacGenerateSection({
  projectId,
  iacTemplate,
  initialFiles,
}: IacGenerateSectionProps) {
  const [files, setFiles] = useState<IacFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<string>(
    initialFiles[0]?.path ?? ""
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [hasMarkerErrors, setHasMarkerErrors] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setEditing(false);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/projects/${projectId}/iac-generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate IaC files");
        return;
      }
      setFiles(data.files);
      setSelectedFile(data.files[0]?.path ?? "");
    } catch {
      setError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!editing || value === undefined) return;
      setFiles((prev) =>
        prev.map((f) =>
          f.path === selectedFile ? { ...f, content: value } : f
        )
      );
      setSaveStatus("idle");
    },
    [editing, selectedFile]
  );

  const checkMarkerErrors = useCallback(() => {
    if (!monacoRef.current || !editorRef.current) return false;
    const model = editorRef.current.getModel();
    if (!model) return false;
    const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
    const hasErrors = markers.some(
      (m: editor.IMarker) => m.severity === monacoRef.current!.MarkerSeverity.Error
    );
    setHasMarkerErrors(hasErrors);
    return hasErrors;
  }, []);

  const handleSave = async () => {
    const hasErrors = checkMarkerErrors();
    if (hasErrors) {
      setSaveStatus("error");
      setError("Fix syntax errors before saving (see inline markers).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/iac-files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        setSaveStatus("error");
        return;
      }
      setSaveStatus("success");
    } catch {
      setError("Network error");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEdit = () => {
    if (editing) {
      // Exiting edit mode — revert unsaved changes
      setFiles(initialFiles);
      setEditing(false);
      setSaveStatus("idle");
      setError(null);
      setHasMarkerErrors(false);
    } else {
      setEditing(true);
      setSaveStatus("idle");
    }
  };

  const activeFile = files.find((f) => f.path === selectedFile);

  if (!iacTemplate) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an IaC template in project settings before generating files.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button onClick={handleGenerate} disabled={generating}>
          {generating
            ? "Generating..."
            : files.length > 0
              ? "Regenerate IaC Files"
              : "Generate IaC Files"}
        </Button>
        {files.length > 0 && (
          <>
            <Button
              variant={editing ? "outline" : "secondary"}
              onClick={handleToggleEdit}
            >
              {editing ? "Cancel Edit" : "Edit"}
            </Button>
            {editing && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} generated
              {editing && " — editing"}
            </span>
            {saveStatus === "success" && (
              <span className="text-xs text-green-600">Saved</span>
            )}
            {hasMarkerErrors && editing && (
              <span className="text-xs text-destructive">Syntax errors detected</span>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {files.length > 0 && (
        <div className="border rounded-md overflow-hidden flex" style={{ height: 500 }}>
          {/* File tree sidebar */}
          <div className="w-48 shrink-0 border-r bg-muted/50 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Files
            </div>
            {files.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors block ${
                  selectedFile === f.path
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>
          {/* Monaco editor */}
          <div className="flex-1 min-w-0">
            {activeFile && (
              <Editor
                height="100%"
                language={getLanguage(activeFile.path)}
                value={activeFile.content}
                theme="vs-dark"
                onMount={handleEditorMount}
                onChange={handleEditorChange}
                options={{
                  readOnly: !editing,
                  domReadOnly: !editing,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
