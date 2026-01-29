import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { generateIacFiles } from "@/lib/iac-generators";

export async function POST(
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

  if (!project.iacTemplate) {
    return NextResponse.json(
      { error: "No IaC template selected. Choose a template in project settings first." },
      { status: 400 }
    );
  }

  const files = generateIacFiles(project.iacTemplate, {
    projectName: project.name,
    awsRegion: project.awsRegion ?? "us-east-1",
  });

  if (!files) {
    return NextResponse.json(
      { error: "Unknown template: " + project.iacTemplate },
      { status: 400 }
    );
  }

  project.iacFiles = files;

  // Add version history entry
  const crypto = await import("crypto");
  const versionEntry = {
    versionId: crypto.randomUUID(),
    label: "generated" as const,
    files,
    createdAt: new Date(),
  };
  if (!project.iacVersions) project.iacVersions = [];
  project.iacVersions.push(versionEntry);

  await project.save();

  return NextResponse.json({ files });
}
