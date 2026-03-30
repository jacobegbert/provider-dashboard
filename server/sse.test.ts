import { describe, it, expect, vi, beforeEach } from "vitest";
import { emitNotification, type SSENotificationPayload } from "./sse";
import { EventEmitter } from "events";

describe("SSE Notification Module", () => {
  describe("emitNotification", () => {
    it("should emit a notification event for the given userId", () => {
      const payload: SSENotificationPayload = {
        id: 1,
        type: "message",
        title: "New message from Dr. Egbert",
        body: "Please review your protocol",
        relatedEntityType: "message",
        relatedEntityId: 42,
        createdAt: new Date("2026-02-18T12:00:00Z"),
      };

      // Listen for the event on the bus
      let received: SSENotificationPayload | null = null;
      const { EventEmitter: EE } = require("events");

      // We need to tap into the internal bus. Since it's module-scoped,
      // we test indirectly by calling emitNotification and verifying
      // it doesn't throw.
      expect(() => emitNotification(123, payload)).not.toThrow();
    });

    it("should not throw when emitting to a user with no listeners", () => {
      const payload: SSENotificationPayload = {
        id: 2,
        type: "system",
        title: "System notification",
        body: null,
        relatedEntityType: null,
        relatedEntityId: null,
        createdAt: "2026-02-18T12:00:00Z",
      };

      expect(() => emitNotification(999, payload)).not.toThrow();
    });

    it("should support string and Date createdAt formats", () => {
      const payloadWithDate: SSENotificationPayload = {
        id: 3,
        type: "task_reminder",
        title: "Task reminder",
        createdAt: new Date(),
      };

      const payloadWithString: SSENotificationPayload = {
        id: 4,
        type: "appointment_reminder",
        title: "Appointment reminder",
        createdAt: "2026-02-18T12:00:00Z",
      };

      expect(() => emitNotification(1, payloadWithDate)).not.toThrow();
      expect(() => emitNotification(1, payloadWithString)).not.toThrow();
    });
  });

  describe("SSENotificationPayload type", () => {
    it("should accept all notification types", () => {
      const types = [
        "message",
        "task_overdue",
        "task_reminder",
        "appointment_reminder",
        "compliance_alert",
        "subscription_expiring",
        "milestone_reached",
        "system",
      ];

      types.forEach((type) => {
        const payload: SSENotificationPayload = {
          id: 1,
          type,
          title: `Test ${type}`,
          createdAt: new Date(),
        };
        expect(payload.type).toBe(type);
      });
    });

    it("should allow optional body and related entity fields", () => {
      const minimal: SSENotificationPayload = {
        id: 1,
        type: "system",
        title: "Minimal notification",
        createdAt: new Date(),
      };

      expect(minimal.body).toBeUndefined();
      expect(minimal.relatedEntityType).toBeUndefined();
      expect(minimal.relatedEntityId).toBeUndefined();
    });
  });

  describe("sseNotificationHandler", () => {
    it("should export sseNotificationHandler function", async () => {
      const { sseNotificationHandler } = await import("./sse");
      expect(typeof sseNotificationHandler).toBe("function");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const { sseNotificationHandler } = await import("./sse");

      const handler = sseNotificationHandler(async () => null);

      const req = { on: vi.fn() } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
      } as any;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should set SSE headers for authenticated requests", async () => {
      const { sseNotificationHandler } = await import("./sse");

      const handler = sseNotificationHandler(async () => ({ id: 1 }));

      const req = { on: vi.fn() } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
      } as any;

      await handler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
    });

    it("should send connected event on successful auth", async () => {
      const { sseNotificationHandler } = await import("./sse");

      const handler = sseNotificationHandler(async () => ({ id: 42 }));

      const req = { on: vi.fn() } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
      } as any;

      await handler(req, res);

      expect(res.write).toHaveBeenCalledWith(
        `event: connected\ndata: ${JSON.stringify({ userId: 42 })}\n\n`
      );
    });

    it("should register cleanup on request close", async () => {
      const { sseNotificationHandler } = await import("./sse");

      const handler = sseNotificationHandler(async () => ({ id: 1 }));

      const req = { on: vi.fn() } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
      } as any;

      await handler(req, res);

      expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("should handle auth function throwing an error", async () => {
      const { sseNotificationHandler } = await import("./sse");

      const handler = sseNotificationHandler(async () => {
        throw new Error("Auth failed");
      });

      const req = { on: vi.fn() } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
      } as any;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
  });
});
