import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AppShell } from "@/components/app-shell";
import { PromptMdEditor } from "@/components/prompt-md-editor";
import Link from "next/link";

export default async function PromptEditorPage({
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
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/projects/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to project
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-1">Edit PROMPT.md</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure the prompt that will be sent to Ralph agents. Edit frontmatter fields and the Markdown body below.
        </p>
        <PromptMdEditor
          projectId={id}
          initialContent={project.promptMd ?? null}
        />
      </div>
    </AppShell>
  );
}
