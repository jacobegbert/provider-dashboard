import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  const protocols: any[] = [];
  const steps: any[] = [];
  let protocolIdCounter = 100;
  let stepIdCounter = 200;

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    getProtocol: vi.fn((id: number) => protocols.find((p) => p.id === id) || null),
    listProtocolSteps: vi.fn((protocolId: number) =>
      steps.filter((s) => s.protocolId === protocolId).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    ),
    createProtocol: vi.fn((data: any) => {
      const newProtocol = { id: ++protocolIdCounter, ...data, createdAt: new Date() };
      protocols.push(newProtocol);
      return newProtocol;
    }),
    createProtocolStep: vi.fn((data: any) => {
      const newStep = { id: ++stepIdCounter, ...data, createdAt: new Date() };
      steps.push(newStep);
      return { id: newStep.id };
    }),
    logAudit: vi.fn(),
    // Expose helpers for test setup
    __resetAll: () => {
      protocols.length = 0;
      steps.length = 0;
      protocolIdCounter = 100;
      stepIdCounter = 200;
    },
    __addProtocol: (protocol: any) => {
      protocols.push(protocol);
    },
    __addStep: (step: any) => {
      steps.push(step);
    },
    __getProtocols: () => protocols,
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
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller(createAuthContext());

describe("protocol.clone", () => {
  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
    (db as any).__resetAll();
  });

  it("should clone a protocol with (Copy) suffix", async () => {
    (db as any).__addProtocol({
      id: 1,
      name: "TRT Protocol",
      description: "Testosterone replacement therapy",
      category: "hormone",
      durationDays: 90,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    const result = await caller.protocol.clone({ id: 1 });

    expect(result.name).toBe("TRT Protocol (Copy)");
    expect(result.description).toBe("Testosterone replacement therapy");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "TRT Protocol (Copy)",
        category: "hormone",
        durationDays: 90,
        isTemplate: true,
      })
    );
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "protocol.clone",
        entityType: "protocol",
      })
    );
  });

  it("should clone all steps from the original protocol", async () => {
    (db as any).__addProtocol({
      id: 2,
      name: "Peptide Stack",
      description: "BPC-157 + TB-500",
      category: "peptides",
      durationDays: 60,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    (db as any).__addStep({
      id: 10,
      protocolId: 2,
      title: "BPC-157 Injection",
      description: "250mcg subcutaneous",
      frequency: "daily",
      customDays: null,
      startDay: 1,
      endDay: 30,
      timeOfDay: "morning",
      sortOrder: 0,
    });

    (db as any).__addStep({
      id: 11,
      protocolId: 2,
      title: "TB-500 Injection",
      description: "2.5mg subcutaneous",
      frequency: "weekly",
      customDays: null,
      startDay: 1,
      endDay: 60,
      timeOfDay: "evening",
      sortOrder: 1,
    });

    const result = await caller.protocol.clone({ id: 2 });

    // Should have called createProtocolStep twice
    expect(db.createProtocolStep).toHaveBeenCalledTimes(2);

    // First step
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "BPC-157 Injection",
        description: "250mcg subcutaneous",
        frequency: "daily",
        startDay: 1,
        endDay: 30,
        timeOfDay: "morning",
        sortOrder: 0,
      })
    );

    // Second step
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "TB-500 Injection",
        description: "2.5mg subcutaneous",
        frequency: "weekly",
        startDay: 1,
        endDay: 60,
        timeOfDay: "evening",
        sortOrder: 1,
      })
    );
  });

  it("should clone a protocol with no steps", async () => {
    (db as any).__addProtocol({
      id: 3,
      name: "Empty Protocol",
      description: null,
      category: "general",
      durationDays: null,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    const result = await caller.protocol.clone({ id: 3 });

    expect(result.name).toBe("Empty Protocol (Copy)");
    expect(db.createProtocolStep).not.toHaveBeenCalled();
    expect(db.logAudit).toHaveBeenCalled();
  });

  it("should throw NOT_FOUND for non-existent protocol", async () => {
    await expect(caller.protocol.clone({ id: 999 })).rejects.toThrow("Protocol not found");
  });

  it("should clone steps with custom days", async () => {
    (db as any).__addProtocol({
      id: 4,
      name: "Custom Days Protocol",
      description: "Protocol with custom schedule",
      category: "lifestyle",
      durationDays: 30,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    (db as any).__addStep({
      id: 20,
      protocolId: 4,
      title: "Workout",
      description: "Strength training",
      frequency: "custom",
      customDays: ["mon", "wed", "fri"],
      startDay: 1,
      endDay: 30,
      timeOfDay: "morning",
      sortOrder: 0,
    });

    const result = await caller.protocol.clone({ id: 4 });

    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "Workout",
        frequency: "custom",
        customDays: ["mon", "wed", "fri"],
      })
    );
  });
});
