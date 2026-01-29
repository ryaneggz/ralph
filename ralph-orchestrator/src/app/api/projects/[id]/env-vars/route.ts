import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import type { IEnvVar } from "@/lib/models/project";
import { encrypt, isEncryptionConfigured } from "@/lib/crypto";
import { logAudit } from "@/lib/models/audit-log";

const ENV_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

function maskValue(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
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

  logAudit({
    userId: session.user.id,
    projectId: id,
    action: "read",
    resourceType: "env-vars",
  });

  const envVars = (project.envVars ?? []).map((v: IEnvVar) => ({
    key: v.key,
    source: v.source,
    maskedValue: v.maskedValue,
  }));

  return NextResponse.json({ envVars });
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
  const { envVars } = body as {
    envVars: { key: string; value?: string; source?: "platform" | "user" }[];
  };

  if (!Array.isArray(envVars)) {
    return NextResponse.json(
      { error: "envVars must be an array" },
      { status: 400 }
    );
  }

  // Validate keys
  const keys = new Set<string>();
  for (const v of envVars) {
    if (!v.key || !ENV_KEY_REGEX.test(v.key)) {
      return NextResponse.json(
        { error: `Invalid env var key: "${v.key}". Must match [A-Za-z_][A-Za-z0-9_]*` },
        { status: 400 }
      );
    }
    if (keys.has(v.key)) {
      return NextResponse.json(
        { error: `Duplicate env var key: "${v.key}"` },
        { status: 400 }
      );
    }
    keys.add(v.key);
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const existingMap = new Map<string, IEnvVar>();
  for (const v of project.envVars ?? []) {
    existingMap.set(v.key, v);
  }

  const useEncryption = isEncryptionConfigured();

  const updatedEnvVars: IEnvVar[] = envVars.map((v) => {
    const existing = existingMap.get(v.key);
    const source = v.source ?? "user";

    if (v.value) {
      // Encrypt value at rest using AES-256-GCM
      const encryptedValue = useEncryption ? encrypt(v.value) : "pending-encryption";
      return {
        key: v.key,
        valueArn: encryptedValue,
        source,
        maskedValue: maskValue(v.value),
      };
    }

    // No new value provided — keep existing if available
    if (existing) {
      return {
        key: v.key,
        valueArn: existing.valueArn,
        source: v.source ?? existing.source,
        maskedValue: existing.maskedValue,
      };
    }

    // New key without value
    return {
      key: v.key,
      valueArn: "",
      source,
      maskedValue: "(not set)",
    };
  });

  project.envVars = updatedEnvVars;
  await project.save();

  logAudit({
    userId: session.user.id,
    projectId: id,
    action: "update",
    resourceType: "env-vars",
    metadata: { keys: envVars.map((v) => v.key) },
  });

  const result = updatedEnvVars.map((v) => ({
    key: v.key,
    source: v.source,
    maskedValue: v.maskedValue,
  }));

  return NextResponse.json({ envVars: result });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { key } = body as { key: string };

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  project.envVars = (project.envVars ?? []).filter(
    (v: IEnvVar) => v.key !== key
  );
  await project.save();

  logAudit({
    userId: session.user.id,
    projectId: id,
    action: "delete",
    resourceType: "env-var",
    resourceId: key,
  });

  return NextResponse.json({ success: true });
}
