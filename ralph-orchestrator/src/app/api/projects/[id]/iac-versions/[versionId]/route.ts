import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";

// GET — get full version data including file contents
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, versionId } = await params;

  await connectDB();

  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const version = (project.iacVersions ?? []).find(
    (v: { versionId: string }) => v.versionId === versionId
  );

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({
    versionId: version.versionId,
    label: version.label,
    files: version.files,
    createdAt: version.createdAt,
  });
}
