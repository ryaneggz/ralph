import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";

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

  const project = await Project.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  project.iacFiles = body.files;
  await project.save();

  return NextResponse.json({ files: project.iacFiles });
}
