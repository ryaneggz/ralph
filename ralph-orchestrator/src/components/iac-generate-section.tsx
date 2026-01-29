"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  initialDraftFiles: IacFile[] | null;
  initialDraftUpdatedAt: string | null;
}

function getLanguage(path: string): string {
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  return "plaintext";
}

const AUTOSAVE_DELAY = 2000;

export function IacGenerateSection({
  projectId,
  iacTemplate,
  initialFiles,
  initialDraftFiles,
  initialDraftUpdatedAt,
}: IacGenerateSectionProps) {
  const hasDraft = initialDraftFiles !== null && initialDraftFiles.length > 0;
  const [files, setFiles] = useState<IacFile[]>(
    hasDraft ? initialDraftFiles : initialFiles
  );
  const [selectedFile, setSelectedFile] = useState<string>(
    (hasDraft ? initialDraftFiles : initialFiles)[0]?.path ?? ""
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [hasMarkerErrors, setHasMarkerErrors] = useState(false);
  const [isDraft, setIsDraft] = useState(hasDraft);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(
    initialDraftUpdatedAt
  );
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesRef = useRef(files);

  // Keep filesRef in sync
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const saveDraft = useCallback(
    async (draftFiles: IacFile[]) => {
      setDraftSaving(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/iac-draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: draftFiles }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsDraft(true);
          setDraftUpdatedAt(data.draftUpdatedAt);
        }
      } catch {
        // Silent fail for auto-save
      } finally {
        setDraftSaving(false);
      }
    },
    [projectId]
  );

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(filesRef.current);
    }, AUTOSAVE_DELAY);
  }, [saveDraft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setEditing(false);
    setSaveStatus("idle");
    setIsDraft(false);
    setDraftUpdatedAt(null);
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
      scheduleAutosave();
    },
    [editing, selectedFile, scheduleAutosave]
  );

  const checkMarkerErrors = useCallback(() => {
    if (!monacoRef.current || !editorRef.current) return false;
    const model = editorRef.current.getModel();
    if (!model) return false;
    const markers = monacoRef.current.editor.getModelMarkers({
      resource: model.uri,
    });
    const hasErrors = markers.some(
      (m: editor.IMarker) =>
        m.severity === monacoRef.current!.MarkerSeverity.Error
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

    // Cancel pending autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
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
      setIsDraft(false);
      setDraftUpdatedAt(null);
    } catch {
      setError("Network error");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    await saveDraft(files);
  };

  const handleToggleEdit = () => {
    if (editing) {
      // Cancel pending autosave
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      // Exiting edit mode — revert unsaved changes to initial (non-draft) files
      setFiles(initialFiles);
      setEditing(false);
      setSaveStatus("idle");
      setError(null);
      setHasMarkerErrors(false);
      setIsDraft(initialDraftFiles !== null && initialDraftFiles.length > 0);
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
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={draftSaving}
                >
                  {draftSaving ? "Saving Draft..." : "Save Draft"}
                </Button>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} generated
              {editing && " — editing"}
            </span>
            {isDraft && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Draft
                {draftUpdatedAt && (
                  <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                    · {new Date(draftUpdatedAt).toLocaleTimeString()}
                  </span>
                )}
              </span>
            )}
            {draftSaving && (
              <span className="text-xs text-muted-foreground">
                Auto-saving...
              </span>
            )}
            {saveStatus === "success" && (
              <span className="text-xs text-green-600">Saved</span>
            )}
            {hasMarkerErrors && editing && (
              <span className="text-xs text-destructive">
                Syntax errors detected
              </span>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {files.length > 0 && (
        <div
          className="border rounded-md overflow-hidden flex"
          style={{ height: 500 }}
        >
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
