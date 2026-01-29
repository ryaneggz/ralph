import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { Run } from "@/lib/models/run";

export async function POST(
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
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.status !== "queued" && run.status !== "running") {
    return NextResponse.json(
      { error: "Only queued or running jobs can be canceled" },
      { status: 400 }
    );
  }

  // Update status to canceled
  run.status = "canceled";
  run.statusHistory.push({ status: "canceled", timestamp: new Date() });
  run.logs.push(
    `[${new Date().toISOString()}] Run canceled by user`
  );
  await run.save();

  // TODO: Send abort signal to SQS/ECS when backend infrastructure exists

  return NextResponse.json({ success: true });
}
