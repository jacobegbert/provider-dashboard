import { describe, it, expect, vi, beforeEach } from "vitest";
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

beforeEach(async () => {
  const { clearOwnerIdCache } = await import("./_core/trpc");
  clearOwnerIdCache();
  vi.clearAllMocks();
});

describe("assignment.bulkAssign", () => {
  it("assigns a protocol to multiple patients", async () => {
    const db = await import("./db");
    (db.getProtocol as any).mockResolvedValue({ id: 1, name: "Test Protocol" });
    (db.listProtocolSteps as any).mockResolvedValue([
      { id: 1, title: "Step 1" },
      { id: 2, title: "Step 2" },
    ]);
    (db.getProviderProfile as any).mockResolvedValue({
      firstName: "Dr.",
      lastName: "Test",
    });
    (db.createAssignment as any).mockResolvedValue({ id: 100 });
    (db.duplicateStepsToAssignment as any).mockResolvedValue(undefined);
    (db.updatePatient as any).mockResolvedValue(undefined);
    (db.getPatient as any).mockResolvedValue({ id: 1, userId: 10, email: "test@test.com", phone: null });
    (db.createNotificationWithEmail as any).mockResolvedValue(undefined);
    (db.getUserById as any).mockResolvedValue({ id: 10, email: "test@test.com" });
    (db.logAudit as any).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.assignment.bulkAssign({
      patientIds: [1, 2, 3],
      protocolId: 1,
      startDate: new Date(),
    });

    expect(result.assigned).toBe(3);
    expect(result.protocolName).toBe("Test Protocol");
    expect(db.createAssignment).toHaveBeenCalledTimes(3);
    expect(db.duplicateStepsToAssignment).toHaveBeenCalledTimes(3);
    expect(db.logAudit).toHaveBeenCalledTimes(3);
  });

  it("requires at least one patient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.assignment.bulkAssign({
        patientIds: [],
        protocolId: 1,
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });
});

describe("message.bulkSend", () => {
  it("sends a message to multiple patients", async () => {
    const db = await import("./db");
    (db.getProviderProfile as any).mockResolvedValue({
      firstName: "Dr.",
      lastName: "Test",
    });
    (db.getPatient as any).mockResolvedValue({
      id: 1,
      userId: 10,
      email: "test@test.com",
      phone: "+1234567890",
    });
    (db.createMessage as any).mockResolvedValue({ id: 200 });
    (db.updatePatient as any).mockResolvedValue(undefined);
    (db.createNotificationWithEmail as any).mockResolvedValue(undefined);
    (db.logAudit as any).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.message.bulkSend({
      patientIds: [1, 2],
      content: "Hello everyone!",
    });

    expect(result.sent).toBe(2);
    expect(db.createMessage).toHaveBeenCalledTimes(2);
    expect(db.logAudit).toHaveBeenCalledTimes(2);
  });

  it("skips patients without userId", async () => {
    const db = await import("./db");
    (db.getProviderProfile as any).mockResolvedValue({
      firstName: "Dr.",
      lastName: "Test",
    });
    (db.getPatient as any)
      .mockResolvedValueOnce({ id: 1, userId: null, email: null, phone: null })
      .mockResolvedValueOnce({ id: 2, userId: 20, email: "b@test.com", phone: null });
    (db.createMessage as any).mockResolvedValue({ id: 201 });
    (db.updatePatient as any).mockResolvedValue(undefined);
    (db.createNotificationWithEmail as any).mockResolvedValue(undefined);
    (db.logAudit as any).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.message.bulkSend({
      patientIds: [1, 2],
      content: "Test message",
    });

    expect(result.sent).toBe(1);
    expect(db.createMessage).toHaveBeenCalledTimes(1);
  });

  it("requires non-empty message content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.message.bulkSend({
        patientIds: [1],
        content: "",
      })
    ).rejects.toThrow();
  });
});
