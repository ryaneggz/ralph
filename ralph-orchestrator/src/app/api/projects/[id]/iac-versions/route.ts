import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";

// GET — list all versions (without file contents for performance)
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
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const versions = (project.iacVersions ?? []).map(
    (v: { versionId: string; label: string; files: { path: string; content: string }[]; createdAt: Date }) => ({
      versionId: v.versionId,
      label: v.label,
      fileCount: v.files.length,
      filePaths: v.files.map((f: { path: string }) => f.path),
      createdAt: v.createdAt,
    })
  );

  // Return newest first
  versions.reverse();

  return NextResponse.json({ versions });
}

// POST — restore a version by versionId
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

  if (!body.versionId || typeof body.versionId !== "string") {
    return NextResponse.json(
      { error: "versionId is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const version = (project.iacVersions ?? []).find(
    (v: { versionId: string }) => v.versionId === body.versionId
  );

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Restore: set iacFiles to version files, clear draft
  project.iacFiles = version.files;
  project.iacDraftFiles = undefined;
  project.iacDraftUpdatedAt = undefined;

  // Create a new "applied" version entry for the restore
  const crypto = await import("crypto");
  const restoreEntry = {
    versionId: crypto.randomUUID(),
    label: "applied" as const,
    files: version.files,
    createdAt: new Date(),
  };
  project.iacVersions.push(restoreEntry);

  await project.save();

  return NextResponse.json({
    files: version.files,
    restoredVersionId: body.versionId,
  });
}
