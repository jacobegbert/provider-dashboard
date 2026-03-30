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

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Dr. Jacob Egbert");
    expect(result?.role).toBe("admin");
  });
});

describe("protected procedures", () => {
  it("patient.list throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patient.list()).rejects.toThrow();
  });

  it("protocol.list throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.protocol.list()).rejects.toThrow();
  });

  it("message.conversations throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.message.conversations()).rejects.toThrow();
  });

  it("attention.stats throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.attention.stats()).rejects.toThrow();
  });

  it("notification.list throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.list()).rejects.toThrow();
  });
});

describe("patient.create input validation", () => {
  it("rejects empty firstName", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patient.create({ firstName: "", lastName: "Test" })).rejects.toThrow();
  });

  it("rejects empty lastName", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patient.create({ firstName: "Test", lastName: "" })).rejects.toThrow();
  });

  it("rejects invalid email format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.patient.create({ firstName: "Test", lastName: "User", email: "not-an-email" })
    ).rejects.toThrow();
  });
});

describe("protocol.create input validation", () => {
  it("rejects empty name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.protocol.create({ name: "", category: "nutrition" })).rejects.toThrow();
  });

  it("rejects invalid category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing invalid input
      caller.protocol.create({ name: "Test", category: "invalid_category" })
    ).rejects.toThrow();
  });
});

describe("message.send input validation", () => {
  it("rejects empty content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.message.send({ receiverId: 2, patientId: 1, content: "" })
    ).rejects.toThrow();
  });
});

describe("appointment.create input validation", () => {
  it("rejects missing title", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing missing required field
      caller.appointment.create({ patientId: 1, type: "follow_up", scheduledAt: new Date() })
    ).rejects.toThrow();
  });

  it("rejects invalid appointment type", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.appointment.create({
        patientId: 1,
        title: "Test",
        // @ts-expect-error - testing invalid type
        type: "invalid_type",
        scheduledAt: new Date(),
      })
    ).rejects.toThrow();
  });
});
