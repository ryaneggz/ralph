import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Run } from "@/lib/models/run";

/**
 * GET /api/v1/agents/:id/stream
 * Server-Sent Events endpoint for streaming run updates.
 * Supports reconnection via Last-Event-ID header for message replay.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: runId } = await params;

  await connectDB();

  const run = await Run.findOne({
    _id: runId,
    userId: session.user.id,
  });

  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  // Parse Last-Event-ID for reconnection replay
  const lastEventId = request.headers.get("Last-Event-ID");
  const lastSeenIndex = lastEventId ? parseInt(lastEventId, 10) : -1;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown, id?: string) {
        let msg = `event: ${event}\n`;
        if (id !== undefined) {
          msg += `id: ${id}\n`;
        }
        msg += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg));
      }

      // Send initial status
      send("status", {
        status: run.status,
        type: run.type,
        provider: run.provider,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        failureReason: run.failureReason,
      });

      // Replay logs from after lastSeenIndex
      const startIndex = lastSeenIndex >= 0 ? lastSeenIndex + 1 : 0;
      for (let i = startIndex; i < run.logs.length; i++) {
        send("log", { index: i, line: run.logs[i] }, String(i));
      }

      // Replay email messages
      if (run.emailMessages && run.emailMessages.length > 0) {
        send("messages", {
          messages: run.emailMessages,
        });
      }

      let lastLogCount = run.logs.length;
      let lastMessageCount = run.emailMessages?.length ?? 0;
      let lastStatus = run.status;
      let closed = false;

      // Poll for updates every 2s
      const interval = setInterval(async () => {
        if (closed) return;
        try {
          const updated = await Run.findById(runId).lean();
          if (!updated) {
            send("error", { message: "Run not found" });
            clearInterval(interval);
            controller.close();
            closed = true;
            return;
          }

          // Send new log lines
          const logs = (updated.logs as string[]) ?? [];
          if (logs.length > lastLogCount) {
            for (let i = lastLogCount; i < logs.length; i++) {
              send("log", { index: i, line: logs[i] }, String(i));
            }
            lastLogCount = logs.length;
          }

          // Send new email messages
          const messages = (updated.emailMessages as typeof run.emailMessages) ?? [];
          if (messages.length > lastMessageCount) {
            const newMessages = messages.slice(lastMessageCount);
            send("messages", { messages: newMessages });
            lastMessageCount = messages.length;
          }

          // Send status change
          const currentStatus = updated.status as string;
          if (currentStatus !== lastStatus) {
            send("status", {
              status: currentStatus,
              updatedAt: updated.updatedAt,
              failureReason: (updated as Record<string, unknown>).failureReason ?? null,
              statusHistory: updated.statusHistory,
            });
            lastStatus = currentStatus;

            // Close stream when run reaches terminal state
            const terminal = ["succeeded", "failed", "canceled"];
            if (terminal.includes(currentStatus)) {
              send("done", { status: currentStatus });
              clearInterval(interval);
              controller.close();
              closed = true;
            }
          }
        } catch {
          // Ignore poll errors, will retry next interval
        }
      }, 2000);

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });

      // If already terminal, send done and close
      const terminal = ["succeeded", "failed", "canceled"];
      if (terminal.includes(run.status)) {
        send("done", { status: run.status });
        clearInterval(interval);
        controller.close();
        closed = true;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
