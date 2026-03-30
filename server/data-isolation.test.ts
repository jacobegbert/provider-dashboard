import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

// ─── Mock db module ──────────────────────────────
vi.mock("./db", () => {
  const patients: any[] = [
    {
      id: 1,
      userId: 10,
      providerId: 100,
      firstName: "Alice",
      lastName: "Patient",
      email: "alice@example.com",
      status: "active",
      deletedAt: null,
    },
    {
      id: 2,
      userId: 20,
      providerId: 100,
      firstName: "Bob",
      lastName: "Other",
      email: "bob@example.com",
      status: "active",
      deletedAt: null,
    },
  ];

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    getPatient: vi.fn((id: number) => patients.find((p) => p.id === id) || null),
    getPatientByUserId: vi.fn((userId: number) =>
      patients.find((p) => p.userId === userId) || null
    ),
    getPatientByEmail: vi.fn(() => null),
    listPatients: vi.fn(() => patients.filter((p) => !p.deletedAt)),
    createPatient: vi.fn((data: any) => ({ id: 99, ...data })),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
    restorePatient: vi.fn(),
    permanentlyDeletePatient: vi.fn(),
    listDeletedPatients: vi.fn(() => []),
    logAudit: vi.fn(),
    getProviderStats: vi.fn(() => ({
      totalPatients: 2,
      activePatients: 2,
      upcomingAppointments: 0,
    })),
    getAttentionQueue: vi.fn(() => []),
    listActiveAssignmentsForProvider: vi.fn(() => []),
    listConversationsForProvider: vi.fn(() => []),
    listProtocolSteps: vi.fn(() => []),
    getProtocol: vi.fn(() => null),
    createProtocol: vi.fn(),
    createProtocolStep: vi.fn(),
    listAssignmentsForPatient: vi.fn(() => []),
    listTasksForPatient: vi.fn(() => []),
    listMessagesForPatient: vi.fn(() => []),
    listAppointmentsForPatient: vi.fn(() => []),
    listDocumentsForPatient: vi.fn(() => []),
    listNotesForPatient: vi.fn(() => []),
    listNotificationsForUser: vi.fn(() => []),
    getUnreadNotificationCount: vi.fn(() => 0),
    listBiomarkerEntries: vi.fn(() => []),
    listCustomMetrics: vi.fn(() => []),
    listResourcesForPatient: vi.fn(() => []),
    getProviderProfile: vi.fn(() => null),
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
  restoreDatabaseBackup: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "admin" | "user", userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Patient Data Isolation", () => {
  beforeEach(async () => {
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
    vi.clearAllMocks();
  });

  // ─── Admin (provider) access ─────────────────
  describe("Admin (provider) access", () => {
    const adminCaller = appRouter.createCaller(createCtx("admin", 100));

    it("admin can list all patients", async () => {
      const result = await adminCaller.patient.list();
      expect(result).toHaveLength(2);
    });

    it("admin can get any patient by ID", async () => {
      const result = await adminCaller.patient.get({ id: 1 });
      expect(result).toBeTruthy();
      expect(result?.firstName).toBe("Alice");
    });

    it("admin can get a different patient by ID", async () => {
      const result = await adminCaller.patient.get({ id: 2 });
      expect(result).toBeTruthy();
      expect(result?.firstName).toBe("Bob");
    });

    it("admin can access attention queue", async () => {
      const result = await adminCaller.attention.queue();
      expect(result).toBeDefined();
    });

    it("admin can access provider stats", async () => {
      const result = await adminCaller.attention.stats();
      expect(result).toBeDefined();
    });

    it("admin can access provider profile", async () => {
      const result = await adminCaller.providerProfile.get();
      // Returns null for mock, but does not throw
      expect(result).toBeNull();
    });
  });

  // ─── Patient (user) access ─────────────────
  describe("Patient (user) access — data isolation", () => {
    // User 10 is linked to patient 1 (Alice)
    const patientCaller = appRouter.createCaller(createCtx("user", 10));

    it("patient can access their own record via patient.get", async () => {
      const result = await patientCaller.patient.get({ id: 1 });
      expect(result).toBeTruthy();
      expect(result?.firstName).toBe("Alice");
    });

    it("patient CANNOT access another patient's record via patient.get", async () => {
      await expect(patientCaller.patient.get({ id: 2 })).rejects.toThrow(
        TRPCError
      );
    });

    it("patient CANNOT list all patients (admin-only)", async () => {
      await expect(patientCaller.patient.list()).rejects.toThrow(TRPCError);
    });

    it("patient CANNOT create patients (admin-only)", async () => {
      await expect(
        patientCaller.patient.create({
          firstName: "Hacker",
          lastName: "Test",
          email: "hacker@example.com",
          providerId: 100,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("patient CANNOT access attention queue (admin-only)", async () => {
      await expect(patientCaller.attention.queue()).rejects.toThrow(TRPCError);
    });

    it("patient CANNOT access provider stats (admin-only)", async () => {
      await expect(patientCaller.attention.stats()).rejects.toThrow(TRPCError);
    });

    it("patient CANNOT access provider profile (admin-only)", async () => {
      await expect(patientCaller.providerProfile.get()).rejects.toThrow(
        TRPCError
      );
    });

    it("patient can access their own assignments", async () => {
      const result = await patientCaller.assignment.listForPatient({
        patientId: 1,
      });
      expect(result).toBeDefined();
    });

    it("patient CANNOT access another patient's assignments", async () => {
      await expect(
        patientCaller.assignment.listForPatient({ patientId: 2 })
      ).rejects.toThrow(TRPCError);
    });

    it("patient can view their own biomarker entries", async () => {
      const result = await patientCaller.biomarker.listEntries({
        patientId: 1,
      });
      expect(result).toBeDefined();
    });

    it("patient CANNOT view another patient's biomarker entries", async () => {
      await expect(
        patientCaller.biomarker.listEntries({ patientId: 2 })
      ).rejects.toThrow(TRPCError);
    });

    it("patient can view their own shared resources", async () => {
      const result = await patientCaller.resource.listForPatient({
        patientId: 1,
      });
      expect(result).toBeDefined();
    });

    it("patient CANNOT view another patient's shared resources", async () => {
      await expect(
        patientCaller.resource.listForPatient({ patientId: 2 })
      ).rejects.toThrow(TRPCError);
    });
  });

  // ─── Unauthenticated user ─────────────────
  describe("Unauthenticated user — no patient link", () => {
    // User 30 is NOT linked to any patient
    const unlinkedCaller = appRouter.createCaller(createCtx("user", 30));

    it("unlinked user CANNOT access any patient data", async () => {
      await expect(unlinkedCaller.patient.get({ id: 1 })).rejects.toThrow(
        TRPCError
      );
    });

    it("unlinked user CANNOT list patients (admin-only)", async () => {
      await expect(unlinkedCaller.patient.list()).rejects.toThrow(TRPCError);
    });

    it("unlinked user CANNOT access assignments for any patient", async () => {
      await expect(
        unlinkedCaller.assignment.listForPatient({ patientId: 1 })
      ).rejects.toThrow(TRPCError);
    });
  });
});
