import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { Run } from "@/lib/models/run";
import { sendRalphEmail } from "@/lib/ralph-email";

const VALID_TYPES = ["plan", "apply", "destroy"];
const VALID_PROVIDERS = ["claude-code", "codeex", "opencode"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { type, provider } = body;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid run type" }, { status: 400 });
  }

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify provider is configured
  const providerConfigured = (project.providerKeys ?? []).some(
    (k: { provider: string }) => k.provider === provider
  );
  if (!providerConfigured) {
    return NextResponse.json(
      { error: "Provider not configured. Add an API key in project settings." },
      { status: 400 }
    );
  }

  const now = new Date();
  const run = await Run.create({
    projectId: id,
    userId: session.user.id,
    type,
    status: "queued",
    provider,
    logs: [`[${now.toISOString()}] Run queued — type: ${type}, provider: ${provider}`],
    statusHistory: [{ status: "queued", timestamp: now }],
  });

  // Generate email from PROMPT.md and send to agent endpoint
  const promptMd = project.promptMd ?? "";
  try {
    const emailResult = await sendRalphEmail({
      promptMd,
      projectName: project.name,
      projectId: id,
      runId: run._id.toString(),
      runType: type,
      provider,
    });

    // Store thread info on run record
    run.threadId = emailResult.threadId;
    run.emailSubject = emailResult.subject;
    run.emailMessages.push({
      messageId: `msg-${randomUUID()}`,
      direction: "outbound",
      subject: emailResult.subject,
      body: promptMd,
      timestamp: emailResult.sentAt,
    });
    run.logs.push(
      `[${new Date().toISOString()}] Email sent to agent — thread: ${emailResult.threadId}`
    );
    await run.save();
  } catch (err) {
    // Log email failure but don't fail the run creation
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    run.logs.push(
      `[${new Date().toISOString()}] Warning: Failed to send email to agent — ${errMsg}`
    );
    await run.save();
  }

  return NextResponse.json(run, { status: 201 });
}

export async function GET(
  _request: NextRequest,
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const runs = await Run.find({ projectId: id, userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("-logs")
    .lean();

  return NextResponse.json(runs);
}
