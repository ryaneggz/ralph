import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { generateDefaultPromptMd } from "@/lib/default-prompt-template";
import { Project } from "@/lib/models/project";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
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

  return NextResponse.json({ promptMd: project.promptMd ?? null });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { promptMd } = body;

  if (typeof promptMd !== "string") {
    return NextResponse.json({ error: "promptMd must be a string" }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { promptMd } },
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
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

  const defaultPrompt = generateDefaultPromptMd({
    repoUrl: project.repo?.url,
    branch: project.repo?.branch,
  });

  project.promptMd = defaultPrompt;
  await project.save();

  return NextResponse.json({ success: true, promptMd: defaultPrompt });
}
