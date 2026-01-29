import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { AWS_REGIONS } from "@/lib/aws-regions";
import { IAC_TEMPLATE_IDS } from "@/lib/iac-templates";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, awsRegion, iacTemplate, defaultProvider, idleTimeoutMinutes } = body;

  const update: Record<string, string | number> = {};

  if (name !== undefined) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }
    update.name = name.trim();
  }

  if (awsRegion !== undefined) {
    if (typeof awsRegion !== "string" || !(AWS_REGIONS as readonly string[]).includes(awsRegion)) {
      return NextResponse.json({ error: "Invalid AWS region" }, { status: 400 });
    }
    update.awsRegion = awsRegion;
  }

  if (iacTemplate !== undefined) {
    if (typeof iacTemplate !== "string" || !IAC_TEMPLATE_IDS.includes(iacTemplate)) {
      return NextResponse.json({ error: "Invalid IaC template" }, { status: 400 });
    }
    update.iacTemplate = iacTemplate;
  }

  if (defaultProvider !== undefined) {
    const validProviders = ["claude-code", "codeex", "opencode"];
    if (typeof defaultProvider !== "string" || !validProviders.includes(defaultProvider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    update.defaultProvider = defaultProvider;
  }

  if (idleTimeoutMinutes !== undefined) {
    const val = Number(idleTimeoutMinutes);
    if (!Number.isInteger(val) || val < 5 || val > 60) {
      return NextResponse.json(
        { error: "Idle timeout must be an integer between 5 and 60 minutes" },
        { status: 400 }
      );
    }
    update.idleTimeoutMinutes = val;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    update,
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
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

  const project = await Project.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
