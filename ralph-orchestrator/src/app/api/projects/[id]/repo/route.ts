import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";

const HTTPS_GIT_URL_REGEX = /^https:\/\/.+\.git$/;

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
  const { url, branch, accessToken } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Repository URL is required" },
      { status: 400 }
    );
  }

  if (!HTTPS_GIT_URL_REGEX.test(url.trim())) {
    return NextResponse.json(
      { error: "Invalid repository URL. Must be an HTTPS Git URL ending in .git" },
      { status: 400 }
    );
  }

  const branchValue = (branch && typeof branch === "string" ? branch.trim() : "main") || "main";

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      repo: {
        url: url.trim(),
        branch: branchValue,
        // TODO: Store accessToken in AWS Secrets Manager and save ARN here
        // For now, store the ARN placeholder
        ...(accessToken ? { accessTokenArn: `pending-encryption` } : {}),
      },
    },
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    repo: {
      url: project.repo?.url,
      branch: project.repo?.branch,
      hasAccessToken: !!project.repo?.accessTokenArn,
    },
  });
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

  return NextResponse.json({
    repo: project.repo
      ? {
          url: project.repo.url,
          branch: project.repo.branch,
          hasAccessToken: !!project.repo.accessTokenArn,
        }
      : null,
  });
}
