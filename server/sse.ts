/**
 * Server-Sent Events (SSE) module for real-time notifications.
 *
 * Architecture:
 * - In-memory EventEmitter acts as a lightweight pub/sub bus.
 * - Each connected client registers a listener keyed by userId.
 * - When a notification is created, `emitNotification(userId, payload)` pushes
 *   the event to every open SSE connection for that user.
 * - Heartbeat keeps connections alive through proxies/load balancers.
 */

import { EventEmitter } from "events";
import type { Request, Response } from "express";

// Increase default max listeners since each connected user adds one
const bus = new EventEmitter();
bus.setMaxListeners(500);

export interface SSENotificationPayload {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt: Date | string;
}

/**
 * Emit a notification event to all SSE connections for a given user.
 */
export function emitNotification(userId: number, payload: SSENotificationPayload) {
  bus.emit(`notification:${userId}`, payload);
}

/**
 * Express route handler for SSE streaming.
 * GET /api/sse/notifications
 *
 * Requires authentication via session cookie (same as tRPC context).
 */
export function sseNotificationHandler(
  authenticateRequest: (req: Request) => Promise<{ id: number } | null>
) {
  return async (req: Request, res: Response) => {
    // Authenticate
    let user: { id: number } | null = null;
    try {
      user = await authenticateRequest(req);
    } catch {
      user = null;
    }

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = user.id;

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    // Listener for notification events
    const onNotification = (payload: SSENotificationPayload) => {
      res.write(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    bus.on(`notification:${userId}`, onNotification);

    // Heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30_000);

    // Cleanup on disconnect
    req.on("close", () => {
      bus.off(`notification:${userId}`, onNotification);
      clearInterval(heartbeat);
    });
  };
}
