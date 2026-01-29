import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { Run } from "@/lib/models/run";

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

  // TODO: Send message to SQS queue for async processing
  // For now, the run stays in "queued" status until backend infrastructure is implemented

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
