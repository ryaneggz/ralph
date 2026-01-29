import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { Run } from "@/lib/models/run";
import { redactLogLines } from "@/lib/redact-secrets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, runId } = await params;

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const run = await Run.findOne({
    _id: runId,
    projectId: id,
    userId: session.user.id,
  }).lean();

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  // Redact secrets from logs before returning to client
  const redactedRun = {
    ...run,
    logs: redactLogLines(run.logs || []),
  };

  return NextResponse.json(redactedRun);
}
