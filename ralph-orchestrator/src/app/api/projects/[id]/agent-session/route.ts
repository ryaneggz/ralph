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
    .select("type status provider createdAt updatedAt statusHistory logs emailMessages")
    .lean();

  if (!activeRun) {
    return NextResponse.json({ active: false });
  }

  // Check idle timeout — use last activity timestamp
  const idleTimeoutMinutes = project.idleTimeoutMinutes ?? 15;
  const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;

  // Last activity is the most recent of: updatedAt, last log entry, last email message
  let lastActivity = new Date(activeRun.updatedAt).getTime();

  if (activeRun.emailMessages && activeRun.emailMessages.length > 0) {
    const lastEmail = activeRun.emailMessages[activeRun.emailMessages.length - 1];
    const emailTime = new Date(lastEmail.timestamp).getTime();
    if (emailTime > lastActivity) lastActivity = emailTime;
  }

  if (activeRun.statusHistory && activeRun.statusHistory.length > 0) {
    const lastStatus = activeRun.statusHistory[activeRun.statusHistory.length - 1];
    const statusTime = new Date(lastStatus.timestamp).getTime();
    if (statusTime > lastActivity) lastActivity = statusTime;
  }

  const idleMs = Date.now() - lastActivity;

  // Auto spin-down if idle timeout exceeded
  if (idleMs >= idleTimeoutMs) {
    // Transition run to "canceled" with idle timeout reason
    await Run.findByIdAndUpdate(activeRun._id, {
      status: "canceled",
      $push: {
        statusHistory: {
          status: "canceled",
          timestamp: new Date(),
        },
        logs: `[${new Date().toISOString()}] Auto spin-down: agent idle for ${idleTimeoutMinutes} minutes (idle timeout exceeded)`,
      },
      failureReason: `Auto spin-down: idle timeout (${idleTimeoutMinutes}min) exceeded`,
    });

    return NextResponse.json({
      active: false,
      scaledDown: true,
      reason: `Idle timeout exceeded (${idleTimeoutMinutes} minutes)`,
    });
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
    idleTimeoutMinutes,
    idleMs,
  });
}
