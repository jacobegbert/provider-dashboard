import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// In-memory message store
const messagesStore: any[] = [];
let idCounter = 100;

// Mock the db module
vi.mock("./db", () => {
  return {
    getMessage: vi.fn((id: number) => messagesStore.find((m) => m.id === id) || null),
    deleteMessageContent: vi.fn((id: number) => {
      const m = messagesStore.find((m: any) => m.id === id);
      if (m) m.content = "[Attachment deleted]";
    }),
    createMessage: vi.fn((data: any) => {
      const m = { id: ++idCounter, ...data, createdAt: new Date(), isRead: false };
      messagesStore.push(m);
      return { id: m.id };
    }),
    listMessagesForPatient: vi.fn(() => messagesStore),
    markMessagesRead: vi.fn(),
    listConversationsForProvider: vi.fn(() => []),
    listPatients: vi.fn(() => []),
    getPatient: vi.fn(() => null),
    getPatientByUserId: vi.fn(() => null),
    getPatientByEmail: vi.fn(() => null),
    updatePatient: vi.fn(),
    logAudit: vi.fn(),
    // Other mocks needed by the router
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

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
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

describe("message.deleteAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messagesStore.length = 0;
    idCounter = 100;
  });

  it("should delete an image attachment sent by the current user", async () => {
    messagesStore.push({
      id: 1,
      senderId: 1,
      receiverId: 2,
      patientId: 10,
      content: "📎 [photo.jpg](https://example.com/photo.jpg)",
      messageType: "text",
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext(1));
    const result = await caller.message.deleteAttachment({ messageId: 1 });

    expect(result).toEqual({ success: true });
    expect(db.deleteMessageContent).toHaveBeenCalledWith(1);
    expect(db.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "message.deleteAttachment",
        entityType: "message",
        entityId: 1,
      })
    );
  });

  it("should delete a file attachment sent by the current user", async () => {
    messagesStore.push({
      id: 2,
      senderId: 1,
      receiverId: 2,
      patientId: 10,
      content: "📎 [report.pdf](https://example.com/report.pdf)",
      messageType: "text",
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext(1));
    const result = await caller.message.deleteAttachment({ messageId: 2 });

    expect(result).toEqual({ success: true });
    expect(db.deleteMessageContent).toHaveBeenCalledWith(2);
  });

  it("should reject deletion if the user is not the sender", async () => {
    messagesStore.push({
      id: 3,
      senderId: 2, // Different user
      receiverId: 1,
      patientId: 10,
      content: "📎 [photo.png](https://example.com/photo.png)",
      messageType: "text",
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext(1));
    await expect(caller.message.deleteAttachment({ messageId: 3 })).rejects.toThrow(
      "You can only delete your own attachments"
    );
    expect(db.deleteMessageContent).not.toHaveBeenCalled();
  });

  it("should reject deletion if the message is not an attachment", async () => {
    messagesStore.push({
      id: 4,
      senderId: 1,
      receiverId: 2,
      patientId: 10,
      content: "Hello, how are you?",
      messageType: "text",
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext(1));
    await expect(caller.message.deleteAttachment({ messageId: 4 })).rejects.toThrow(
      "This message is not an attachment"
    );
    expect(db.deleteMessageContent).not.toHaveBeenCalled();
  });

  it("should reject deletion if the message does not exist", async () => {
    const caller = appRouter.createCaller(createAuthContext(1));
    await expect(caller.message.deleteAttachment({ messageId: 999 })).rejects.toThrow(
      "Message not found"
    );
    expect(db.deleteMessageContent).not.toHaveBeenCalled();
  });
});
