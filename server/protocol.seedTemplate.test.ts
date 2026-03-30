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
    __resetAll: () => {
      protocols.length = 0;
      steps.length = 0;
      protocolIdCounter = 100;
      stepIdCounter = 200;
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

describe("protocol.seedTemplate", () => {
  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
    (db as any).__resetAll();
  });

  it("should seed BPC-157 template with correct protocol data", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "bpc157-healing" });

    expect(result.name).toBe("BPC-157 Healing Protocol");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "BPC-157 Healing Protocol",
        category: "peptides",
        durationDays: 42,
        isTemplate: true,
        createdBy: 1,
      })
    );
  });

  it("should seed BPC-157 template with all 5 steps including dosage/route", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "bpc157-healing" });

    expect(db.createProtocolStep).toHaveBeenCalledTimes(5);

    // First step: BPC-157 injection with dosage
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "BPC-157 Subcutaneous Injection",
        dosageAmount: "250",
        dosageUnit: "mcg",
        route: "subcutaneous",
        frequency: "daily",
        sortOrder: 0,
      })
    );

    // Third step: L-Glutamine
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        protocolId: result.id,
        title: "Gut Support — L-Glutamine",
        dosageAmount: "5",
        dosageUnit: "g",
        route: "oral",
        sortOrder: 2,
      })
    );
  });

  it("should seed Vitamin D Loading template with loading and maintenance phases", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "vitamin-d-loading" });

    expect(result.name).toBe("Vitamin D Loading Protocol");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "supplement",
        durationDays: 90,
      })
    );

    expect(db.createProtocolStep).toHaveBeenCalledTimes(5);

    // Loading phase step
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Vitamin D3 — Loading Phase",
        dosageAmount: "10000",
        dosageUnit: "IU",
        route: "oral",
        startDay: 1,
        endDay: 30,
      })
    );

    // Maintenance phase step
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Vitamin D3 — Maintenance Phase",
        dosageAmount: "5000",
        dosageUnit: "IU",
        startDay: 31,
        endDay: 90,
      })
    );
  });

  it("should seed Retatrutide template with titration phases", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "retatrutide" });

    expect(result.name).toBe("Retatrutide Protocol");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "peptides",
        durationDays: 168,
      })
    );

    expect(db.createProtocolStep).toHaveBeenCalledTimes(6);

    // Initiation phase
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Retatrutide — Initiation Phase",
        dosageAmount: "1",
        dosageUnit: "mg",
        route: "subcutaneous",
        frequency: "weekly",
      })
    );
  });

  it("should seed Tesamorelin template", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "tesamorelin" });

    expect(result.name).toBe("Tesamorelin Protocol");
    expect(db.createProtocolStep).toHaveBeenCalledTimes(5);

    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Tesamorelin Subcutaneous Injection",
        dosageAmount: "2",
        dosageUnit: "mg",
        route: "subcutaneous",
        timeOfDay: "evening",
      })
    );
  });

  it("should seed Sermorelin template", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "sermorelin" });

    expect(result.name).toBe("Sermorelin Protocol");
    expect(db.createProtocolStep).toHaveBeenCalledTimes(5);

    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sermorelin Subcutaneous Injection",
        dosageAmount: "300",
        dosageUnit: "mcg",
        route: "subcutaneous",
        timeOfDay: "evening",
      })
    );
  });

  it("should seed VO2 Max Training template with custom days", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "vo2max-training" });

    expect(result.name).toBe("VO2 Max Training Protocol");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "exercise",
        durationDays: 84,
      })
    );

    expect(db.createProtocolStep).toHaveBeenCalledTimes(5);

    // Norwegian 4x4 intervals with custom days
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "VO2 Max Intervals — 4×4 Norwegian Method",
        frequency: "custom",
        customDays: ["tue", "fri"],
        sortOrder: 0,
      })
    );
  });

  it("should seed Zone 2 Cardio template with null duration (ongoing)", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "zone2-cardio" });

    expect(result.name).toBe("Zone 2 Cardio Protocol");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "exercise",
        durationDays: null,
      })
    );

    expect(db.createProtocolStep).toHaveBeenCalledTimes(4);

    // Steps with null startDay/endDay (ongoing)
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Zone 2 Cardio Session — 45 min",
        frequency: "custom",
        customDays: ["mon", "wed", "fri", "sun"],
        startDay: null,
        endDay: null,
      })
    );
  });

  it("should seed Low-Carb Pseudo-Carnivore Diet template", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "low-carb-pseudo-carnivore" });

    expect(result.name).toBe("Low-Carb Single-Ingredient Pseudo-Carnivore Diet");
    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "nutrition",
        durationDays: 90,
      })
    );

    expect(db.createProtocolStep).toHaveBeenCalledTimes(6);

    // Carb target step
    expect(db.createProtocolStep).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Daily Carb Target — 110 g Maximum",
        dosageAmount: "110",
        dosageUnit: "g",
        route: "oral",
      })
    );
  });

  it("should throw NOT_FOUND for non-existent template key", async () => {
    await expect(
      caller.protocol.seedTemplate({ templateKey: "nonexistent-template" })
    ).rejects.toThrow("Template not found");
  });

  it("should log audit with templateKey in details", async () => {
    const result = await caller.protocol.seedTemplate({ templateKey: "bpc157-healing" });

    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        action: "protocol.seedTemplate",
        entityType: "protocol",
        entityId: result.id,
        details: { templateKey: "bpc157-healing" },
      })
    );
  });

  it("should set milestones and labCheckpoints from template", async () => {
    await caller.protocol.seedTemplate({ templateKey: "bpc157-healing" });

    expect(db.createProtocol).toHaveBeenCalledWith(
      expect.objectContaining({
        milestones: expect.arrayContaining([
          expect.objectContaining({ day: 7 }),
          expect.objectContaining({ day: 42 }),
        ]),
        labCheckpoints: expect.arrayContaining([
          expect.objectContaining({ day: 1 }),
          expect.objectContaining({ day: 28 }),
        ]),
      })
    );
  });
});
