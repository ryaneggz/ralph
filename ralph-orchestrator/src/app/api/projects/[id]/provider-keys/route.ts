import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/lib/models/project";
import type { IProviderKey } from "@/lib/models/project";

const VALID_PROVIDERS = ["claude-code", "codeex", "opencode"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function maskKey(value: string): string {
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

  const providerKeys = (project.providerKeys ?? []).map((k: IProviderKey) => ({
    provider: k.provider,
    maskedValue: k.maskedValue,
    configured: true,
  }));

  return NextResponse.json({ providerKeys });
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
  const { provider, apiKey } = body as { provider: string; apiKey: string };

  if (!provider || !VALID_PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json(
      { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "API key is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const keys: IProviderKey[] = [...(project.providerKeys ?? [])];
  const existingIdx = keys.findIndex((k) => k.provider === provider);

  const newEntry: IProviderKey = {
    provider,
    // TODO: Store in AWS Secrets Manager at /ralph/{userId}/keys/{provider}
    keyArn: "pending-encryption",
    maskedValue: maskKey(apiKey),
  };

  if (existingIdx >= 0) {
    keys[existingIdx] = newEntry;
  } else {
    keys.push(newEntry);
  }

  project.providerKeys = keys;
  await project.save();

  return NextResponse.json({
    provider,
    maskedValue: newEntry.maskedValue,
    configured: true,
  });
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
  const { provider } = body as { provider: string };

  if (!provider) {
    return NextResponse.json({ error: "Provider is required" }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOne({ _id: id, userId: session.user.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // TODO: Delete from AWS Secrets Manager
  project.providerKeys = (project.providerKeys ?? []).filter(
    (k: IProviderKey) => k.provider !== provider
  );
  await project.save();

  return NextResponse.json({ success: true });
}
