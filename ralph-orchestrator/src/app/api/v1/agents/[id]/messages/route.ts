import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: runId } = await params;
  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  await connectDB();

  const run = await Run.findOne({
    _id: runId,
    userId: session.user.id,
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const isActive = run.status === "queued" || run.status === "running";
  if (!isActive) {
    return NextResponse.json(
      { error: "Cannot send message to a run that is not active" },
      { status: 400 }
    );
  }

  const messageId = `msg-${randomUUID()}`;
  const now = new Date();

  run.emailMessages.push({
    messageId,
    direction: "outbound",
    subject: "User message",
    body: message.trim(),
    timestamp: now,
  });

  run.logs.push(
    `[${now.toISOString()}] [USER] ${message.trim()}`
  );

  await run.save();

  return NextResponse.json({
    message_id: messageId,
    status: "delivered",
    run_id: runId,
    timestamp: now.toISOString(),
  });
}
