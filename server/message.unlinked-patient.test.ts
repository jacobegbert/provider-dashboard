import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Track calls
let mockGetPatientReturn: any = null;

// Mock the db module — inline factory (no external imports)
vi.mock("./db", () => {
  return {
    getMessage: vi.fn(() => null),
    deleteMessageContent: vi.fn(),
    createMessage: vi.fn((data: any) => ({ id: 999 })),
    listMessagesForPatient: vi.fn(() => []),
    markMessagesRead: vi.fn(),
    listConversationsForProvider: vi.fn(() => []),
    listPatients: vi.fn(() => []),
    getPatient: vi.fn(() => mockGetPatientReturn),
    getPatientByUserId: vi.fn(() => null),
    getPatientByEmail: vi.fn(() => null),
    updatePatient: vi.fn(),
    logAudit: vi.fn(),
    getProviderStats: vi.fn(() => ({})),
    getAttentionQueue: vi.fn(() => []),
    listActiveAssignmentsForProvider: vi.fn(() => []),
    listProtocolSteps: vi.fn(() => []),
    getProtocol: vi.fn(() => null),
    createProtocol: vi.fn(),
    createProtocolStep: vi.fn(),
    deletePatient: vi.fn(),
    restorePatient: vi.fn(),
    permanentlyDeletePatient: vi.fn(),
    listDeletedPatients: vi.fn(() => []),
    createNotificationWithEmail: vi.fn(),
    getProviderProfile: vi.fn(() => ({
      firstName: "Jacob",
      lastName: "Egbert",
      practiceName: "Black Label Medicine",
    })),
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

// Mock patientNotify module
vi.mock("./patientNotify", () => ({
  notifyPatientNewMessage: vi.fn(async () => ({ emailSent: true, smsSent: true })),
  notifyPatientAppointment: vi.fn(async () => ({ emailSent: true, smsSent: true })),
  notifyPatientProtocolAssigned: vi.fn(async () => ({ emailSent: true, smsSent: true })),
  notifyPatientProtocolUpdated: vi.fn(async () => ({ emailSent: true, smsSent: true })),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-open-id",
    email: "jacob@test.com",
    name: "Jacob Egbert",
    loginMethod: "google",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Messaging patients without user accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPatientReturn = null;
  });

  it("should allow sending a message to a patient without a userId (unlinked)", async () => {
    // Jordan Jones: has patientId 210001 but no userId (hasn't created account yet)
    mockGetPatientReturn = {
      id: 210001,
      firstName: "Jordan",
      lastName: "Jones",
      email: null,
      phone: "8016886538",
      userId: null,
      providerId: 1,
      status: "active",
    };

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.message.send({
      receiverId: 210001,
      patientId: 210001,
      content: "Welcome to Black Label Medicine!",
      origin: "https://www.blacklabelmedicine.com",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(999);
    expect(db.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        senderId: 1,
        receiverId: 210001,
        patientId: 210001,
        content: "Welcome to Black Label Medicine!",
      })
    );
  });

  it("should NOT create in-app notification for patient without userId", async () => {
    mockGetPatientReturn = {
      id: 210001,
      firstName: "Jordan",
      lastName: "Jones",
      email: null,
      phone: "8016886538",
      userId: null,
      providerId: 1,
      status: "active",
    };

    const caller = appRouter.createCaller(createAdminContext());
    await caller.message.send({
      receiverId: 210001,
      patientId: 210001,
      content: "Test message",
      origin: "https://www.blacklabelmedicine.com",
    });

    // In-app notification should be skipped since userId is null
    expect(db.createNotificationWithEmail).not.toHaveBeenCalled();
  });

  it("should still send SMS to unlinked patient with phone number", async () => {
    const patientNotify = await import("./patientNotify");
    mockGetPatientReturn = {
      id: 210001,
      firstName: "Jordan",
      lastName: "Jones",
      email: null,
      phone: "8016886538",
      userId: null,
      providerId: 1,
      status: "active",
    };

    const caller = appRouter.createCaller(createAdminContext());
    await caller.message.send({
      receiverId: 210001,
      patientId: 210001,
      content: "Welcome!",
      origin: "https://www.blacklabelmedicine.com",
    });

    // Email/SMS should still be sent even without userId
    expect(patientNotify.notifyPatientNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "8016886538",
        messagePreview: "Welcome!",
      })
    );
  });

  it("should create in-app notification for patient WITH userId", async () => {
    // David Fajardo: has both patientId and userId
    mockGetPatientReturn = {
      id: 150004,
      firstName: "David",
      lastName: "Fajardo",
      email: "fajardodavid89@gmail.com",
      phone: "7025750356",
      userId: 1020492,
      providerId: 1,
      status: "active",
    };

    const caller = appRouter.createCaller(createAdminContext());
    await caller.message.send({
      receiverId: 1020492,
      patientId: 150004,
      content: "Follow-up message",
      origin: "https://www.blacklabelmedicine.com",
    });

    // In-app notification should be created using the patient's userId
    expect(db.createNotificationWithEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1020492,
        title: expect.stringContaining("New Message from"),
      }),
      expect.any(Object)
    );
  });

  it("should update lastProviderInteraction for unlinked patients", async () => {
    mockGetPatientReturn = {
      id: 210001,
      firstName: "Jordan",
      lastName: "Jones",
      email: null,
      phone: "8016886538",
      userId: null,
      providerId: 1,
      status: "active",
    };

    const caller = appRouter.createCaller(createAdminContext());
    await caller.message.send({
      receiverId: 210001,
      patientId: 210001,
      content: "Test",
    });

    expect(db.updatePatient).toHaveBeenCalledWith(
      210001,
      expect.objectContaining({
        lastProviderInteraction: expect.any(Date),
      })
    );
  });
});
