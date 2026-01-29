import { randomUUID } from "crypto";

export interface RalphEmailPayload {
  subject: string;
  body: string;
  threadId: string;
  projectId: string;
  runId: string;
  provider: string;
  type: string;
}

export interface RalphEmailResult {
  threadId: string;
  subject: string;
  sentAt: Date;
}

/**
 * Constructs and sends an email to kick off the Ralph agent loop.
 * In production, this would send via SES/SendGrid to the agent endpoint.
 * Currently stubbed — logs the email and returns a generated thread ID.
 */
export async function sendRalphEmail({
  promptMd,
  projectName,
  projectId,
  runId,
  runType,
  provider,
}: {
  promptMd: string;
  projectName: string;
  projectId: string;
  runId: string;
  runType: string;
  provider: string;
}): Promise<RalphEmailResult> {
  const threadId = `thread-${randomUUID()}`;
  const subject = `[Ralph] ${runType.charAt(0).toUpperCase() + runType.slice(1)} — ${projectName}`;

  const payload: RalphEmailPayload = {
    subject,
    body: promptMd,
    threadId,
    projectId,
    runId,
    provider,
    type: runType,
  };

  // TODO: Replace with real email service (SES, SendGrid, etc.)
  // In production: POST to agent email endpoint or SQS queue
  console.log(`[RALPH-EMAIL] Sending email to agent:`, {
    threadId: payload.threadId,
    subject: payload.subject,
    projectId: payload.projectId,
    runId: payload.runId,
    provider: payload.provider,
    bodyLength: payload.body.length,
  });

  return {
    threadId,
    subject,
    sentAt: new Date(),
  };
}
