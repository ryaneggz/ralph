import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";
import { RepoConfigForm } from "@/components/repo-config-form";
import { EnvVarsConfigForm } from "@/components/env-vars-config-form";
import { ProjectRenameForm } from "@/components/project-rename-form";
import { ProjectDeleteSection } from "@/components/project-delete-section";
import { ProviderKeyForm } from "@/components/provider-key-form";
import { AwsRegionForm } from "@/components/aws-region-form";
import { AwsAuthForm } from "@/components/aws-auth-form";
import Link from "next/link";

export default async function ProjectSettingsPage({
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

  const envVarsData = (project.envVars ?? []).map((v: { key: string; source: "platform" | "user"; maskedValue: string }) => ({
    key: v.key,
    source: v.source,
    maskedValue: v.maskedValue,
  }));

  const providerKeysMap = new Map<string, { provider: string; maskedValue: string; configured: boolean }>();
  for (const k of project.providerKeys ?? []) {
    providerKeysMap.set(k.provider, {
      provider: k.provider,
      maskedValue: k.maskedValue,
      configured: true,
    });
  }

  const repoData = project.repo
    ? {
        url: project.repo.url,
        branch: project.repo.branch,
        hasAccessToken: !!project.repo.accessTokenArn,
      }
    : null;

  return (
    <AppShell>
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/projects/${id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to project
          </Link>
        </div>

        <h2 className="text-2xl font-bold">{project.name} — Settings</h2>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Project Name</h3>
          <ProjectRenameForm projectId={id} currentName={project.name} />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Repository Configuration</h3>
          <RepoConfigForm
            projectId={id}
            initialRepo={repoData}
          />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Provider API Keys</h3>
          <div className="space-y-4">
            <ProviderKeyForm
              projectId={id}
              provider="claude-code"
              label="Claude Code (Anthropic)"
              placeholder="sk-ant-..."
              initialData={providerKeysMap.get("claude-code") ?? null}
            />
            <ProviderKeyForm
              projectId={id}
              provider="codeex"
              label="Codeex"
              placeholder="codeex-..."
              initialData={providerKeysMap.get("codeex") ?? null}
            />
            <ProviderKeyForm
              projectId={id}
              provider="opencode"
              label="OpenCode"
              placeholder="opencode-..."
              initialData={providerKeysMap.get("opencode") ?? null}
            />
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Agent Environment Variables</h3>
          <EnvVarsConfigForm
            projectId={id}
            initialEnvVars={envVarsData}
          />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">AWS Configuration</h3>
          <AwsRegionForm
            projectId={id}
            initialRegion={project.awsRegion ?? "us-east-1"}
          />
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">AWS Authentication</h3>
          <AwsAuthForm
            projectId={id}
            initialData={
              project.awsAuth
                ? {
                    configured: true,
                    authType: project.awsAuth.authType,
                    roleArn: project.awsAuth.roleArn ?? null,
                    accessKeyId: project.awsAuth.accessKeyId ?? null,
                    maskedSecretKey: project.awsAuth.maskedSecretKey ?? null,
                  }
                : { configured: false }
            }
          />
        </section>

        <section className="mt-12 pt-8 border-t border-destructive/20">
          <h3 className="text-lg font-semibold mb-4 text-destructive">
            Danger Zone
          </h3>
          <ProjectDeleteSection projectId={id} projectName={project.name} />
        </section>
      </div>
    </AppShell>
  );
}
