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

describe("patient.update status validation", () => {
  it("accepts 'active' status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw input validation error
    await caller.patient.update({ id: 99999, status: "active" });
  });

  it("accepts 'inactive' status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, status: "inactive" });
  });

  it("accepts 'paused' status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, status: "paused" });
  });

  it("accepts 'completed' status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, status: "completed" });
  });

  it("accepts 'new' status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, status: "new" });
  });

  it("rejects invalid status value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing invalid status
      caller.patient.update({ id: 1, status: "invalid_status" })
    ).rejects.toThrow();
  });
});

describe("patient.update sex field validation", () => {
  it("accepts 'male' sex value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, sex: "male" });
  });

  it("accepts 'female' sex value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, sex: "female" });
  });

  it("accepts null sex value (to clear)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.patient.update({ id: 99999, sex: null });
  });

  it("rejects invalid sex value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing invalid sex
      caller.patient.update({ id: 1, sex: "other" })
    ).rejects.toThrow();
  });
});

describe("patient.delete input validation", () => {
  it("requires a valid patient id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error - testing missing id
      caller.patient.delete({})
    ).rejects.toThrow();
  });

  it("rejects unauthenticated delete", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patient.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("document procedures auth", () => {
  it("document.listForPatient throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.document.listForPatient({ patientId: 1 })).rejects.toThrow();
  });



  it("document.delete throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.document.delete({ id: 1 })).rejects.toThrow();
  });
});



describe("patient.create with all fields", () => {
  it("accepts subscription tier values", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const tiers = ["standard", "premium", "elite"];
    for (const tier of tiers) {
      await caller.patient.create({
        firstName: "Test",
        lastName: "User",
        email: `test-${tier}@example.com`,
        subscriptionTier: tier as any,
      });
    }
  });

  it("rejects invalid subscription tier", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.patient.create({
        firstName: "Test",
        lastName: "User",
        // @ts-expect-error - testing invalid tier
        subscriptionTier: "invalid_tier",
      })
    ).rejects.toThrow();
  });
});
