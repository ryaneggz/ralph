"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/new-project-dialog";
import Link from "next/link";

const LAST_PROJECT_KEY = "ralph-last-project-id";

interface ProjectItem {
  _id: string;
  name: string;
}

export function getLastProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export function setLastProjectId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_PROJECT_KEY, id);
}

function extractProjectId(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match ? match[1] : null;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const currentProjectId = extractProjectId(pathname);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, [pathname]);

  // Persist current project to localStorage
  useEffect(() => {
    if (currentProjectId) {
      setLastProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  const handleSwitchProject = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const projectId = e.target.value;
      if (projectId) {
        setLastProjectId(projectId);
        router.push(`/projects/${projectId}`);
      }
    },
    [router]
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Projects</span>
          <NewProjectDialog>
            <Button size="sm" variant="outline">
              + New
            </Button>
          </NewProjectDialog>
        </div>
        {projects.length > 1 && (
          <select
            value={currentProjectId ?? ""}
            onChange={handleSwitchProject}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="" disabled>
              Switch project…
            </option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No projects yet
          </p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => {
              const href = `/projects/${project._id}`;
              const active = pathname.startsWith(href);
              return (
                <li key={project._id}>
                  <Link
                    href={href}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {project.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
