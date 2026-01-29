import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { Project } from "@/lib/models/project";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Find active run (queued or running)
  const activeRun = await Run.findOne({
    projectId: id,
    userId: session.user.id,
    status: { $in: ["queued", "running"] },
  }).sort({ createdAt: -1 });

  if (!activeRun) {
    return NextResponse.json(
      { error: "No active agent session" },
      { status: 400 }
    );
  }

  // Terminate the run
  await Run.findByIdAndUpdate(activeRun._id, {
    status: "canceled",
    $push: {
      statusHistory: {
        status: "canceled",
        timestamp: new Date(),
      },
      logs: `[${new Date().toISOString()}] Agent session manually stopped by user`,
    },
    failureReason: "Manually stopped by user",
  });

  // TODO: Send terminate signal to ECS task when infrastructure is wired up

  return NextResponse.json({
    success: true,
    runId: String(activeRun._id),
    message: "Agent session stopped",
  });
}
