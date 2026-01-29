import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";
import { RepoConfigForm } from "@/components/repo-config-form";
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
          <h3 className="text-lg font-semibold mb-4">Repository Configuration</h3>
          <RepoConfigForm
            projectId={id}
            initialRepo={repoData}
          />
        </section>
      </div>
    </AppShell>
  );
}
