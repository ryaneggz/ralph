import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { Run } from "@/lib/models/run";
import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { RunDetailView } from "@/components/run-detail-view";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, runId } = await params;

  await connectDB();

  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  });
  if (!project) {
    redirect("/inbox");
  }

  const run = await Run.findOne({
    _id: runId,
    projectId: id,
    userId: session.user.id,
  }).lean();

  if (!run) {
    redirect(`/projects/${id}`);
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link
            href={`/projects/${id}`}
            className="text-sm text-primary hover:underline"
          >
            &larr; Back to project
          </Link>
        </div>
        <h2 className="text-2xl font-bold capitalize">
          {String(run.type)} Run
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {project.name} &middot; {run.provider}
        </p>
        <RunDetailView
          projectId={id}
          runId={runId}
          initialRun={{
            _id: String(run._id),
            type: String(run.type),
            status: String(run.status),
            provider: String(run.provider),
            createdAt: String(run.createdAt),
            updatedAt: String(run.updatedAt),
            statusHistory: (run.statusHistory ?? []).map(
              (h: { status: string; timestamp: Date }) => ({
                status: String(h.status),
                timestamp: String(h.timestamp),
              })
            ),
            logs: ((run.logs as string[]) ?? []).map(String),
          }}
        />
      </div>
    </AppShell>
  );
}
