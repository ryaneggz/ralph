import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";
import { Project } from "@/lib/models/project";

export async function GET(
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

  // Find active run (queued or running) for this project
  const activeRun = await Run.findOne({
    projectId: id,
    userId: session.user.id,
    status: { $in: ["queued", "running"] },
  })
    .sort({ createdAt: -1 })
    .select("type status provider createdAt statusHistory")
    .lean();

  if (!activeRun) {
    return NextResponse.json({ active: false });
  }

  // Count total runs for this project to derive iteration number
  const totalRuns = await Run.countDocuments({
    projectId: id,
    userId: session.user.id,
  });

  // Calculate uptime from when the run was created
  const startedAt = activeRun.createdAt;
  const uptimeMs = Date.now() - new Date(startedAt).getTime();

  return NextResponse.json({
    active: true,
    runId: String(activeRun._id),
    type: activeRun.type,
    status: activeRun.status,
    provider: activeRun.provider,
    startedAt: new Date(startedAt).toISOString(),
    uptimeMs,
    iterationNumber: totalRuns,
  });
}
