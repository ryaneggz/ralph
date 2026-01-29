"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/new-project-dialog";

interface ProjectItem {
  _id: string;
  name: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Projects</span>
        <NewProjectDialog>
          <Button size="sm" variant="outline">
            + New
          </Button>
        </NewProjectDialog>
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
