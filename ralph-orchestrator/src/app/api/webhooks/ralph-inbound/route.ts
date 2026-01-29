import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";

/**
 * POST /api/webhooks/ralph-inbound
 *
 * Inbound webhook endpoint for Ralph agent email responses.
 * Captures inbound messages, appends to run's emailMessages and logs.
 *
 * Expected payload:
 * {
 *   threadId: string;       // matches run.threadId
 *   subject: string;        // email subject
 *   body: string;           // email body content
 *   runId?: string;         // optional direct run ID lookup
 * }
 *
 * Authentication: Uses a shared webhook secret (WEBHOOK_SECRET env var).
 * If not configured, the endpoint is open (for development).
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret if configured
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = request.headers.get("x-webhook-secret");
    if (authHeader !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: {
    threadId?: string;
    subject?: string;
    body?: string;
    runId?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { threadId, subject, body, runId } = payload;

  if (!body || typeof body !== "string") {
    return NextResponse.json(
      { error: "Missing required field: body" },
      { status: 400 }
    );
  }

  if (!threadId && !runId) {
    return NextResponse.json(
      { error: "Must provide threadId or runId" },
      { status: 400 }
    );
  }

  await connectDB();

  // Find the run by threadId or runId
  let run;
  if (runId) {
    run = await Run.findById(runId);
  }
  if (!run && threadId) {
    run = await Run.findOne({ threadId });
  }

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const now = new Date();
  const messageId = `msg-${randomUUID()}`;
  const emailSubject = subject || `Re: ${run.emailSubject || "Ralph Response"}`;

  // Append inbound email message
  run.emailMessages.push({
    messageId,
    direction: "inbound",
    subject: emailSubject,
    body,
    timestamp: now,
  });

  // Append to run logs
  const logPrefix = `[${now.toISOString()}]`;
  run.logs.push(`${logPrefix} Inbound email received — subject: ${emailSubject}`);

  // Append email body content as log lines
  const bodyLines = body.split("\n");
  for (const line of bodyLines) {
    run.logs.push(`${logPrefix} [RALPH] ${line}`);
  }

  await run.save();

  return NextResponse.json({
    ok: true,
    messageId,
    runId: run._id.toString(),
  });
}
