import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { IacGenerateSection } from "@/components/iac-generate-section";
import { IacVersionHistoryWrapper } from "@/components/iac-version-history-wrapper";
import { PromptMdViewer } from "@/components/prompt-md-viewer";
import { RunProviderSelector } from "@/components/run-provider-selector";

const PROVIDERS = [
  { key: "claude-code", label: "Claude Code (Anthropic)" },
  { key: "codeex", label: "Codeex" },
  { key: "opencode", label: "OpenCode" },
] as const;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  await connectDB();
  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!project) {
    redirect("/inbox");
  }

  return (
    <AppShell>
      <div className="p-6">
        <h2 className="text-2xl font-bold">{project.name}</h2>
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
        {project.repoUrl && (
          <p className="mt-1 text-sm text-muted-foreground">
            Repository: {project.repoUrl}
          </p>
        )}
        <div className="mt-4">
          <Link
            href={`/projects/${id}/settings`}
            className="text-sm text-primary hover:underline"
          >
            Project Settings
          </Link>
        </div>
        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Provider Status</h3>
          <div className="space-y-2">
            {PROVIDERS.map(({ key, label }) => {
              const pk = (project.providerKeys ?? []).find(
                (k: { provider: string; maskedValue: string }) => k.provider === key
              );
              const configured = !!pk;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    {configured && pk?.maskedValue && (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {pk.maskedValue}
                      </code>
                    )}
                    {configured ? (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                        Configured
                      </span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        Not Configured
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <Link href={`/projects/${id}/settings`} className="text-primary hover:underline">
              Manage provider keys in settings
            </Link>
          </p>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Run Provider</h3>
          <RunProviderSelector
            projectId={id}
            configuredProviders={(project.providerKeys ?? []).map(
              (k: { provider: string }) => k.provider
            )}
            defaultProvider={project.defaultProvider ?? null}
          />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">PROMPT.md</h3>
          <PromptMdViewer
            content={project.promptMd ?? null}
            projectId={id}
          />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Infrastructure as Code</h3>
          <IacGenerateSection
            projectId={id}
            iacTemplate={project.iacTemplate ?? null}
            initialFiles={(project.iacFiles ?? []).map((f: { path: string; content: string }) => ({
              path: f.path,
              content: f.content,
            }))}
            initialDraftFiles={
              project.iacDraftFiles && project.iacDraftFiles.length > 0
                ? project.iacDraftFiles.map((f: { path: string; content: string }) => ({
                    path: f.path,
                    content: f.content,
                  }))
                : null
            }
            initialDraftUpdatedAt={
              project.iacDraftUpdatedAt
                ? project.iacDraftUpdatedAt.toISOString()
                : null
            }
          />
          <IacVersionHistoryWrapper projectId={id} />
        </section>
      </div>
    </AppShell>
  );
}
