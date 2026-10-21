import { EventEmitter } from "events";
import type { Request, Response } from "express";

export type PortalEvent = {
  type: "plan" | "message";
  patientId: number;
  version?: number;
  at: string;
};

const bus = new EventEmitter();
bus.setMaxListeners(500);

export function emitPortalEvent(userId: number, event: Omit<PortalEvent, "at"> & { at?: string }) {
  const payload: PortalEvent = { ...event, at: event.at ?? new Date().toISOString() };
  bus.emit(`portal:${userId}`, payload);
}

export function subscribePortal(userId: number, listener: (event: PortalEvent) => void) {
  const channel = `portal:${userId}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}

/**
 * Live plan and message events for the signed-in user.
 * The bus is in-process. More than one server instance needs a shared bus
 * before this can be treated as production delivery.
 */
export function portalEventsHandler(
  authenticateRequest: (req: Request) => Promise<{ id: number } | null>,
) {
  return async (req: Request, res: Response) => {
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

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.id })}\n\n`);

    const unsubscribe = subscribePortal(user.id, (event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 25_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  };
}
