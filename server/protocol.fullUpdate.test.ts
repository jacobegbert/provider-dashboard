import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  const steps: any[] = [];
  let stepIdCounter = 100;

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    updateProtocol: vi.fn(),
    listProtocolSteps: vi.fn(() => steps),
    deleteProtocolStep: vi.fn(),
    updateProtocolStep: vi.fn((id: number, data: any) => {
      const step = steps.find((s) => s.id === id);
      if (step) Object.assign(step, data);
    }),
    createProtocolStep: vi.fn((data: any) => {
      const newStep = { id: ++stepIdCounter, ...data };
      steps.push(newStep);
      return { id: newStep.id };
    }),
    logAudit: vi.fn(),
    // Expose helpers for test setup
    __resetSteps: () => {
      steps.length = 0;
      stepIdCounter = 100;
    },
    __addStep: (step: any) => {
      steps.push(step);
    },
    __getSteps: () => steps,
  };
});

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "provider-user",
    email: "provider@example.com",
    name: "Test Provider",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("protocol.fullUpdate", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
    (db as any).__resetSteps();
  });

  it("updates protocol metadata", async () => {
    await caller.protocol.fullUpdate({
      id: 1,
      name: "Updated Protocol",
      description: "New description",
      category: "hormone",
      durationDays: 90,
      steps: [],
    });

    expect(db.updateProtocol).toHaveBeenCalledWith(1, {
      name: "Updated Protocol",
      description: "New description",
      category: "hormone",
      durationDays: 90,
    });
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "protocol.fullUpdate",
        entityType: "protocol",
        entityId: 1,
      })
    );
  });

  it("creates new steps when none existed before", async () => {
    await caller.protocol.fullUpdate({
      id: 1,
      name: "Protocol With Steps",
      category: "supplement",
      steps: [
        { title: "Step A", frequency: "daily" },
        { title: "Step B", frequency: "weekly", timeOfDay: "morning" },
      ],
    });

    expect(db.createProtocolStep).toHaveBeenCalledTimes(2);
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 1,
        sortOrder: 0,
        title: "Step A",
        frequency: "daily",
      })
    );
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 1,
        sortOrder: 1,
        title: "Step B",
        frequency: "weekly",
        timeOfDay: "morning",
      })
    );
  });

  it("updates existing steps and preserves their ids", async () => {
    (db as any).__addStep({ id: 10, protocolId: 1, title: "Old Step", sortOrder: 0 });

    await caller.protocol.fullUpdate({
      id: 1,
      name: "Protocol",
      category: "nutrition",
      steps: [
        { id: 10, title: "Updated Step", frequency: "daily", timeOfDay: "evening" },
      ],
    });

    expect(db.updateProtocolStep).toHaveBeenCalledWith(10, expect.objectContaining({
      title: "Updated Step",
      frequency: "daily",
      timeOfDay: "evening",
      sortOrder: 0,
    }));
    expect(db.deleteProtocolStep).not.toHaveBeenCalled();
  });

  it("deletes steps that are removed from the list", async () => {
    (db as any).__addStep({ id: 10, protocolId: 1, title: "Keep", sortOrder: 0 });
    (db as any).__addStep({ id: 11, protocolId: 1, title: "Remove", sortOrder: 1 });
    (db as any).__addStep({ id: 12, protocolId: 1, title: "Also Remove", sortOrder: 2 });

    await caller.protocol.fullUpdate({
      id: 1,
      name: "Protocol",
      category: "nutrition",
      steps: [
        { id: 10, title: "Keep", frequency: "daily" },
      ],
    });

    expect(db.deleteProtocolStep).toHaveBeenCalledWith(11);
    expect(db.deleteProtocolStep).toHaveBeenCalledWith(12);
    expect(db.deleteProtocolStep).toHaveBeenCalledTimes(2);
  });

  it("handles mixed operations: update existing, add new, delete removed", async () => {
    (db as any).__addStep({ id: 20, protocolId: 1, title: "Existing A", sortOrder: 0 });
    (db as any).__addStep({ id: 21, protocolId: 1, title: "To Delete", sortOrder: 1 });

    await caller.protocol.fullUpdate({
      id: 1,
      name: "Mixed Update",
      category: "lifestyle",
      steps: [
        { id: 20, title: "Updated A", frequency: "weekly" },
        { title: "Brand New Step", frequency: "daily" },
      ],
    });

    // Updated existing
    expect(db.updateProtocolStep).toHaveBeenCalledWith(20, expect.objectContaining({
      title: "Updated A",
      sortOrder: 0,
    }));
    // Deleted removed
    expect(db.deleteProtocolStep).toHaveBeenCalledWith(21);
    // Created new
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: 1,
        sortOrder: 1,
        title: "Brand New Step",
      })
    );
  });

  it("supports ongoing protocols with null durationDays", async () => {
    await caller.protocol.fullUpdate({
      id: 1,
      name: "Ongoing Protocol",
      category: "hormone",
      durationDays: null,
    });

    expect(db.updateProtocol).toHaveBeenCalledWith(1, expect.objectContaining({
      durationDays: null,
    }));
  });

  it("supports custom days in steps", async () => {
    await caller.protocol.fullUpdate({
      id: 1,
      name: "Custom Days Protocol",
      category: "exercise",
      steps: [
        {
          title: "MWF Injection",
          frequency: "custom",
          customDays: ["mon", "wed", "fri"],
          timeOfDay: "morning",
        },
      ],
    });

    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "MWF Injection",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
        timeOfDay: "morning",
      })
    );
  });
});
