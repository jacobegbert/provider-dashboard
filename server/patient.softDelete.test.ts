import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => {
  const patients: any[] = [];
  let idCounter = 100;

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    listPatients: vi.fn((userId: number) =>
      patients.filter((p) => p.deletedAt === null)
    ),
    getPatient: vi.fn((id: number) => patients.find((p) => p.id === id) || null),
    createPatient: vi.fn((data: any) => {
      const p = { id: ++idCounter, ...data, deletedAt: null, createdAt: new Date() };
      patients.push(p);
      return p;
    }),
    deletePatient: vi.fn((id: number) => {
      const p = patients.find((p: any) => p.id === id);
      if (p) p.deletedAt = new Date();
      return p;
    }),
    restorePatient: vi.fn((id: number) => {
      const p = patients.find((p: any) => p.id === id);
      if (p) p.deletedAt = null;
      return p;
    }),
    permanentlyDeletePatient: vi.fn((id: number) => {
      const idx = patients.findIndex((p: any) => p.id === id);
      if (idx >= 0) patients.splice(idx, 1);
    }),
    listDeletedPatients: vi.fn(() =>
      patients.filter((p) => p.deletedAt !== null)
    ),
    logAudit: vi.fn(),
    // Other mocks needed by the router
    getProviderStats: vi.fn(() => ({})),
    getAttentionQueue: vi.fn(() => []),
    listActiveAssignmentsForProvider: vi.fn(() => []),
    listConversationsForProvider: vi.fn(() => []),
    getPatientByUserId: vi.fn(() => null),
    getPatientByEmail: vi.fn(() => null),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    listProtocolSteps: vi.fn(() => []),
    getProtocol: vi.fn(() => null),
    createProtocol: vi.fn(),
    createProtocolStep: vi.fn(),
    // Expose helpers
    __resetAll: () => {
      patients.length = 0;
      idCounter = 100;
    },
    __addPatient: (patient: any) => {
      patients.push(patient);
    },
    __getPatients: () => patients,
  };
});

// Mock googleCalendar module
vi.mock("./googleCalendar", () => ({
  getGoogleAuthUrl: vi.fn(),
  getConnectionStatus: vi.fn(() => ({ connected: false })),
  disconnectGoogle: vi.fn(),
  syncAppointmentToGoogle: vi.fn(),
  deleteGoogleEvent: vi.fn(),
  syncAllAppointments: vi.fn(),
}));

// Mock backup module
vi.mock("./backup", () => ({
  createDatabaseBackup: vi.fn(),
  listBackups: vi.fn(() => []),
  addToManifest: vi.fn(),
  getBackupDownloadUrl: vi.fn(),
}));

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

describe("patient.softDelete", () => {
  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
    (db as any).__resetAll();
  });

  it("should soft delete a patient (set deletedAt instead of removing)", async () => {
    (db as any).__addPatient({
      id: 1,
      firstName: "Amelia",
      lastName: "Egbert",
      email: "amelia@example.com",
      deletedAt: null,
      createdBy: 1,
    });

    await caller.patient.delete({ id: 1 });

    expect(db.deletePatient).toHaveBeenCalledWith(1);
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "patient.delete",
        entityType: "patient",
        entityId: 1,
      })
    );
  });

  it("should restore a soft-deleted patient", async () => {
    (db as any).__addPatient({
      id: 2,
      firstName: "Samantha",
      lastName: "Buker",
      email: "samantha@example.com",
      deletedAt: new Date(),
      createdBy: 1,
    });

    await caller.patient.restore({ id: 2 });

    expect(db.restorePatient).toHaveBeenCalledWith(2);
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "patient.restore",
        entityType: "patient",
        entityId: 2,
      })
    );
  });

  it("should permanently delete a patient", async () => {
    (db as any).__addPatient({
      id: 3,
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      deletedAt: new Date(),
      createdBy: 1,
    });

    await caller.patient.permanentDelete({ id: 3 });

    expect(db.permanentlyDeletePatient).toHaveBeenCalledWith(3);
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "patient.permanentDelete",
        entityType: "patient",
        entityId: 3,
      })
    );
  });

  it("should list only deleted patients via listDeleted", async () => {
    (db as any).__addPatient({
      id: 4,
      firstName: "Active",
      lastName: "Patient",
      email: "active@example.com",
      deletedAt: null,
      createdBy: 1,
    });

    (db as any).__addPatient({
      id: 5,
      firstName: "Deleted",
      lastName: "Patient",
      email: "deleted@example.com",
      deletedAt: new Date(),
      createdBy: 1,
    });

    const result = await caller.patient.listDeleted();

    expect(db.listDeletedPatients).toHaveBeenCalled();
    // The mock returns patients with deletedAt !== null
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Deleted");
  });

  it("should not include soft-deleted patients in the regular list", async () => {
    (db as any).__addPatient({
      id: 6,
      firstName: "Visible",
      lastName: "Patient",
      email: "visible@example.com",
      deletedAt: null,
      createdBy: 1,
    });

    (db as any).__addPatient({
      id: 7,
      firstName: "Hidden",
      lastName: "Patient",
      email: "hidden@example.com",
      deletedAt: new Date(),
      createdBy: 1,
    });

    const result = await caller.patient.list();

    expect(db.listPatients).toHaveBeenCalled();
    // The mock filters out deletedAt !== null
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Visible");
  });
});
