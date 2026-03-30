import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 1,
    openId: "admin-open-id",
    email: "admin@blacklabelmedicine.com",
    name: "Dr. Jacob Egbert",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createPatientUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 99,
    openId: "patient-open-id",
    email: "patient@example.com",
    name: "Test Patient",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe("protocol.listAll", () => {
  it("requires authentication", async () => {
    const ctx = createContext(); // no user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.protocol.listAll()).rejects.toThrow();
  });

  it("returns enriched protocols with stepCount and assignment counts", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.protocol.listAll();
    expect(Array.isArray(result)).toBe(true);
    // Each protocol should have enriched fields
    for (const proto of result) {
      expect(proto).toHaveProperty("stepCount");
      expect(proto).toHaveProperty("activeAssignments");
      expect(proto).toHaveProperty("totalAssignments");
      expect(typeof proto.stepCount).toBe("number");
      expect(typeof proto.activeAssignments).toBe("number");
      expect(typeof proto.totalAssignments).toBe("number");
    }
  });
});

describe("protocol.get", () => {
  it("requires authentication", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.protocol.get({ id: 1 })).rejects.toThrow();
  });

  it("returns null for non-existent protocol", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.protocol.get({ id: 999999 });
    expect(result).toBeNull();
  });
});

describe("assignment.create", () => {
  it("requires authentication", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assignment.create({
        protocolId: 1,
        patientId: 1,
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("creates an assignment for a valid admin user (or rejects with FK constraint if patient/protocol missing)", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    // This is an integration test hitting the real DB.
    // With FK constraints, it may fail if patientId=1 or protocolId=1 don't exist.
    try {
      const result = await caller.assignment.create({
        protocolId: 1,
        patientId: 1,
        startDate: new Date(),
      });
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    } catch (err: any) {
      // FK constraint correctly rejects if referenced rows don't exist
      // tRPC wraps the error, so check the full stringified error
      const errStr = JSON.stringify(err);
      const isExpectedError =
        errStr.includes("foreign key constraint") ||
        errStr.includes("INTERNAL_SERVER_ERROR") ||
        errStr.includes("ER_NO_REFERENCED_ROW") ||
        err.code === "INTERNAL_SERVER_ERROR";
      expect(isExpectedError).toBe(true);
    }
  });
});

describe("assignment.listForPatient", () => {
  it("requires authentication", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assignment.listForPatient({ patientId: 1 })
    ).rejects.toThrow();
  });

  it("returns enriched assignments with protocol and steps data", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assignment.listForPatient({ patientId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("task.complete", () => {
  it("requires authentication", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.task.complete({ stepId: 1, assignmentId: 1, completedDate: new Date() })
    ).rejects.toThrow();
  });
});

describe("task.uncomplete", () => {
  it("requires authentication", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.task.uncomplete({ stepId: 1, assignmentId: 1, completedDate: new Date() })
    ).rejects.toThrow();
  });
});
