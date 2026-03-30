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
    updateProtocolStep: vi.fn((id: number, data: any) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) steps[idx] = { ...steps[idx], ...data };
      return steps[idx] || null;
    }),
    deleteProtocolStep: vi.fn((id: number) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) steps.splice(idx, 1);
    }),
    updateProtocol: vi.fn((id: number, data: any) => {
      const idx = protocols.findIndex((p) => p.id === id);
      if (idx >= 0) protocols[idx] = { ...protocols[idx], ...data };
      return protocols[idx] || null;
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

describe("protocol steps with dosage and route fields", () => {
  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
    (db as any).__resetAll();
  });

  it("should create a protocol with dosage and route on steps", async () => {
    const result = await caller.protocol.create({
      name: "TRT Protocol",
      category: "hormone",
      durationDays: 90,
      steps: [
        {
          title: "Testosterone Cypionate",
          description: "IM injection",
          frequency: "weekly",
          timeOfDay: "morning",
          startDay: null,
          endDay: null,
          dosageAmount: "200",
          dosageUnit: "mg",
          route: "intramuscular",
        },
      ],
    });

    expect(result.name).toBe("TRT Protocol");
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Testosterone Cypionate",
        dosageAmount: "200",
        dosageUnit: "mg",
        route: "intramuscular",
      })
    );
  });

  it("should create a protocol step with null dosage fields when not provided", async () => {
    const result = await caller.protocol.create({
      name: "Lifestyle Protocol",
      category: "lifestyle",
      durationDays: 30,
      steps: [
        {
          title: "Morning meditation",
          frequency: "daily",
          timeOfDay: "morning",
          startDay: null,
          endDay: null,
          dosageAmount: null,
          dosageUnit: null,
          route: null,
        },
      ],
    });

    expect(result.name).toBe("Lifestyle Protocol");
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Morning meditation",
        dosageAmount: null,
        dosageUnit: null,
        route: null,
      })
    );
  });

  it("should create a protocol step with optional start day (null)", async () => {
    const result = await caller.protocol.create({
      name: "Flexible Protocol",
      category: "supplement",
      durationDays: null,
      steps: [
        {
          title: "Vitamin D3",
          frequency: "daily",
          timeOfDay: "morning",
          startDay: null,
          endDay: null,
          dosageAmount: "5000",
          dosageUnit: "IU",
          route: "oral",
        },
      ],
    });

    expect(result.name).toBe("Flexible Protocol");
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Vitamin D3",
        startDay: null,
        endDay: null,
        dosageAmount: "5000",
        dosageUnit: "IU",
        route: "oral",
      })
    );
  });

  it("should clone a protocol and preserve dosage/route fields", async () => {
    (db as any).__addProtocol({
      id: 1,
      name: "BPC-157 Protocol",
      description: "Healing peptide",
      category: "peptides",
      durationDays: 60,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    (db as any).__addStep({
      id: 10,
      protocolId: 1,
      title: "BPC-157 Injection",
      description: "Subcutaneous injection",
      frequency: "daily",
      customDays: null,
      startDay: null,
      endDay: null,
      timeOfDay: "morning",
      sortOrder: 0,
      dosageAmount: "250",
      dosageUnit: "mcg",
      route: "subcutaneous",
    });

    const result = await caller.protocol.clone({ id: 1 });

    expect(result.name).toBe("BPC-157 Protocol (Copy)");
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "BPC-157 Injection",
        dosageAmount: "250",
        dosageUnit: "mcg",
        route: "subcutaneous",
        startDay: null,
        endDay: null,
      })
    );
  });

  it("should update a protocol with dosage/route via fullUpdate", async () => {
    (db as any).__addProtocol({
      id: 5,
      name: "Update Test",
      description: "Test",
      category: "supplement",
      durationDays: 30,
      milestones: null,
      labCheckpoints: null,
      createdBy: 1,
      isTemplate: true,
    });

    (db as any).__addStep({
      id: 50,
      protocolId: 5,
      title: "Old Step",
      description: null,
      frequency: "daily",
      customDays: null,
      startDay: 1,
      endDay: 30,
      timeOfDay: "any",
      sortOrder: 0,
      dosageAmount: null,
      dosageUnit: null,
      route: null,
    });

    await caller.protocol.fullUpdate({
      id: 5,
      name: "Updated Protocol",
      category: "supplement",
      steps: [
        {
          id: 50,
          title: "Updated Step",
          frequency: "daily",
          timeOfDay: "morning",
          startDay: null,
          endDay: null,
          dosageAmount: "500",
          dosageUnit: "mg",
          route: "oral",
        },
      ],
    });

    expect(db.updateProtocolStep).toHaveBeenCalledWith(
      50,
      expect.objectContaining({
        title: "Updated Step",
        dosageAmount: "500",
        dosageUnit: "mg",
        route: "oral",
        startDay: null,
        endDay: null,
      })
    );
  });

  it("should handle multiple dosage units correctly", async () => {
    const units = ["mg", "mcg", "g", "mL", "IU", "units", "capsules", "tablets", "drops"];

    for (const unit of units) {
      (db as any).__resetAll();
      vi.clearAllMocks();

      const result = await caller.protocol.create({
        name: `${unit} Protocol`,
        category: "supplement",
        steps: [
          {
            title: `Step with ${unit}`,
            frequency: "daily",
            timeOfDay: "any",
            startDay: null,
            endDay: null,
            dosageAmount: "100",
            dosageUnit: unit,
            route: "oral",
          },
        ],
      });

      expect(result.name).toBe(`${unit} Protocol`);
      expect(db.createProtocolStep).toHaveBeenCalledWith(
        expect.objectContaining({
          dosageUnit: unit,
        })
      );
    }
  });
});
