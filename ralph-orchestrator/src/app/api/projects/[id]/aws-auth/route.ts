import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import { encrypt, isEncryptionConfigured } from "@/lib/crypto";
import { logAudit } from "@/lib/models/audit-log";

const ARN_REGEX = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;

function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "..." + value.slice(-4);
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

  if (!project.awsAuth) {
    return NextResponse.json({ configured: false });
  }

  const { authType, roleArn, accessKeyId, maskedSecretKey } = project.awsAuth;

  logAudit({
    userId: session.user.id,
    projectId: id,
    action: "read",
    resourceType: "aws-auth",
  });

  return NextResponse.json({
    configured: true,
    authType,
    roleArn: roleArn ?? null,
    accessKeyId: accessKeyId ?? null,
    maskedSecretKey: maskedSecretKey ?? null,
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
  const { authType, roleArn, accessKeyId, secretAccessKey } = body;

  if (!authType || !["role", "access-keys"].includes(authType)) {
    return NextResponse.json(
      { error: "authType must be 'role' or 'access-keys'" },
      { status: 400 }
    );
  }

  if (authType === "role") {
    if (!roleArn || typeof roleArn !== "string") {
      return NextResponse.json({ error: "Role ARN is required" }, { status: 400 });
    }
    if (!ARN_REGEX.test(roleArn.trim())) {
      return NextResponse.json(
        { error: "Invalid IAM Role ARN format. Expected: arn:aws:iam::<account-id>:role/<role-name>" },
        { status: 400 }
      );
    }
  }

  if (authType === "access-keys") {
    if (!accessKeyId || typeof accessKeyId !== "string" || accessKeyId.trim().length === 0) {
      return NextResponse.json({ error: "Access Key ID is required" }, { status: 400 });
    }
    if (!secretAccessKey || typeof secretAccessKey !== "string" || secretAccessKey.trim().length === 0) {
      return NextResponse.json({ error: "Secret Access Key is required" }, { status: 400 });
    }
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (authType === "role") {
    project.awsAuth = {
      authType: "role",
      roleArn: roleArn.trim(),
    };
  } else {
    const encryptedSecret = isEncryptionConfigured()
      ? encrypt(secretAccessKey.trim())
      : "pending-encryption";

    project.awsAuth = {
      authType: "access-keys",
      accessKeyId: accessKeyId.trim(),
      secretAccessKeyArn: encryptedSecret,
      maskedSecretKey: maskValue(secretAccessKey.trim()),
    };
  }

  await project.save();

  const isUpdate = !!body._isUpdate;
  logAudit({
    userId: session.user.id,
    projectId: id,
    action: isUpdate ? "update" : "create",
    resourceType: "aws-auth",
    metadata: { authType },
  });

  return NextResponse.json({ success: true });
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
    { $unset: { awsAuth: 1 } },
    { new: true }
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  logAudit({
    userId: session.user.id,
    projectId: id,
    action: "delete",
    resourceType: "aws-auth",
  });

  return NextResponse.json({ success: true });
}
