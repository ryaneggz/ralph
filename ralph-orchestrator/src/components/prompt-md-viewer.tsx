"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";

interface PromptMdViewerProps {
  content: string | null;
  projectId: string;
}

export function PromptMdViewer({ content, projectId }: PromptMdViewerProps) {
  const parsed = useMemo(() => {
    if (!content) return null;
    try {
      const { data, content: body } = matter(content);
      return { frontmatter: data, body };
    } catch {
      return { frontmatter: {}, body: content };
    }
  }, [content]);

  if (!content || !parsed) {
    return (
      <div className="rounded-md border p-6 text-center text-muted-foreground">
        <p>No PROMPT.md configured for this project.</p>
        <p className="mt-1 text-xs">
          Edit the prompt in the{" "}
          <a
            href={`/projects/${projectId}/prompt`}
            className="text-primary hover:underline"
          >
            Prompt Editor
          </a>{" "}
          to get started.
        </p>
      </div>
    );
  }

  const frontmatterEntries = Object.entries(parsed.frontmatter);

  return (
    <div className="rounded-md border">
      {frontmatterEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          {frontmatterEntries.map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              <span className="text-muted-foreground">{key}:</span>
              <span>{String(value)}</span>
            </span>
          ))}
        </div>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none p-4">
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
          {parsed.body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
