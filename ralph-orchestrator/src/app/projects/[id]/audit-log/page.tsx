import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";
import { AuditLogViewer } from "@/components/audit-log-viewer";
import Link from "next/link";

export default async function AuditLogPage({
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
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/projects/${id}/settings`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to settings
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-6">{project.name} — Audit Log</h2>

        <AuditLogViewer projectId={id} />
      </div>
    </AppShell>
  );
}
