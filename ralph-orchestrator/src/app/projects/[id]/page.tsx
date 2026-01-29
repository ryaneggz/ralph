import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";

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
        <div className="mt-8">
          <p className="text-muted-foreground">
            Project workspace — runs, settings, and IaC will appear here.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
