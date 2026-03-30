import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock } from "./__mocks__/dbMockFactory";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => createDbMock());

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "provider-user",
    email: "dr.egbert@blacklabelmedicine.com",
    name: "Dr. Jacob Egbert",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(async () => {
  const { clearOwnerIdCache } = await import("./_core/trpc");
  clearOwnerIdCache();
  vi.clearAllMocks();
});

describe("notification.list", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.list()).rejects.toThrow();
  });
});

describe("notification.listPaginated", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.listPaginated()).rejects.toThrow();
  });

  it("accepts valid pagination input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.listPaginated({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
  });

  it("accepts type filter input", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.listPaginated({ type: "message", unreadOnly: true });
    expect(result).toBeDefined();
  });

  it("rejects invalid type filter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing invalid type
      caller.notification.listPaginated({ type: "invalid_type" })
    ).rejects.toThrow();
  });

  it("rejects limit below minimum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.listPaginated({ limit: 0 })).rejects.toThrow();
  });

  it("rejects limit above maximum", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.listPaginated({ limit: 51 })).rejects.toThrow();
  });

  it("rejects negative offset", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.listPaginated({ offset: -1 })).rejects.toThrow();
  });
});

describe("notification.unreadCount", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.unreadCount()).rejects.toThrow();
  });
});

describe("notification.markRead", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markRead({ id: 1 })).rejects.toThrow();
  });

  it("rejects missing id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing missing required field
      caller.notification.markRead({})
    ).rejects.toThrow();
  });
});

describe("notification.markAllRead", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markAllRead()).rejects.toThrow();
  });
});

describe("notification.delete", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.delete({ id: 1 })).rejects.toThrow();
  });

  it("rejects missing id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing missing required field
      caller.notification.delete({})
    ).rejects.toThrow();
  });
});

describe("notification.create input validation", () => {
  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notification.create({ targetUserId: 2, title: "Test", type: "system" })
    ).rejects.toThrow();
  });

  it("rejects empty title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notification.create({ targetUserId: 2, title: "", type: "system" })
    ).rejects.toThrow();
  });

  it("rejects invalid notification type", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing invalid type
      caller.notification.create({ targetUserId: 2, title: "Test", type: "invalid_type" })
    ).rejects.toThrow();
  });

  it("accepts valid create input with all fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.create({
      targetUserId: 2,
      title: "Test Notification",
      body: "This is a test notification body",
      type: "message",
      relatedEntityType: "message",
      relatedEntityId: 1,
      sendEmail: false,
    });
    expect(result).toBeDefined();
  });

  it("accepts all valid notification types", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const validTypes = [
      "message", "task_overdue", "task_reminder", "appointment_reminder",
      "compliance_alert", "subscription_expiring", "milestone_reached", "system",
    ] as const;
    for (const type of validTypes) {
      const result = await caller.notification.create({
        targetUserId: 2,
        title: `Test ${type}`,
        type,
      });
      expect(result).toBeDefined();
    }
  });
});
