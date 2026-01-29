import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";

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

  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  }).select("iacDraftFiles iacDraftUpdatedAt");

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    draftFiles: project.iacDraftFiles ?? null,
    draftUpdatedAt: project.iacDraftUpdatedAt ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json(
      { error: "files array is required" },
      { status: 400 }
    );
  }

  for (const file of body.files) {
    if (typeof file.path !== "string" || typeof file.content !== "string") {
      return NextResponse.json(
        { error: "Each file must have path (string) and content (string)" },
        { status: 400 }
      );
    }
  }

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      $set: {
        iacDraftFiles: body.files,
        iacDraftUpdatedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    draftFiles: project.iacDraftFiles,
    draftUpdatedAt: project.iacDraftUpdatedAt,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $unset: { iacDraftFiles: 1, iacDraftUpdatedAt: 1 } },
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
