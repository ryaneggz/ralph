"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface IacFile {
  path: string;
  content: string;
}

interface IacGenerateSectionProps {
  projectId: string;
  iacTemplate: string | null;
  initialFiles: IacFile[];
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

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
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
          <span className="text-xs text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""} generated
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {files.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="flex border-b bg-muted/50">
            {files.map((f) => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                className={`px-3 py-2 text-xs font-mono transition-colors ${
                  selectedFile === f.path
                    ? "bg-background text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>
          {activeFile && (
            <pre className="p-4 text-xs font-mono overflow-auto max-h-[500px] bg-background">
              <code>{activeFile.content}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
