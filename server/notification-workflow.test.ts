/**
 * End-to-End Notification Workflow Test
 *
 * Verifies the complete notification chain across three key provider actions:
 *   1. Appointment creation  → email with ICS attachment + SMS
 *   2. Protocol assignment   → email with protocol details + SMS
 *   3. Protocol update       → email + SMS to all assigned patients
 *
 * Also verifies:
 *   - In-app notification records created in the database
 *   - ICS calendar file is RFC 5545 compliant and attached to appointment emails
 *   - Google Calendar link included in appointment emails
 *   - Graceful degradation when patient has no email or no phone
 *   - Multiple patients notified on protocol update
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Shared test data ──────────────────────────

const PROVIDER_USER = {
  id: 1,
  openId: "provider-open-id",
  email: "dr.smith@blacklabelmedicine.com",
  name: "Dr. Smith",
  loginMethod: "manus" as const,
  role: "admin" as const,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  lastSignedIn: new Date("2026-02-19"),
};

const PATIENT_A = {
  id: 100,
  firstName: "Alice",
  lastName: "Johnson",
  email: "alice@example.com",
  phone: "+18015551234",
  userId: 10,
  status: "active",
  createdBy: 1,
  deletedAt: null,
};

const PATIENT_B = {
  id: 101,
  firstName: "Bob",
  lastName: "Williams",
  email: "bob@example.com",
  phone: "+18015555678",
  userId: 11,
  status: "active",
  createdBy: 1,
  deletedAt: null,
};

const PATIENT_NO_PHONE = {
  id: 102,
  firstName: "Carol",
  lastName: "Davis",
  email: "carol@example.com",
  phone: null,
  userId: 12,
  status: "active",
  createdBy: 1,
  deletedAt: null,
};

const PATIENT_NO_EMAIL = {
  id: 103,
  firstName: "Dan",
  lastName: "Brown",
  email: null,
  phone: "+18015559999",
  userId: null,
  status: "active",
  createdBy: 1,
  deletedAt: null,
};

const USER_ALICE = { id: 10, email: "alice@example.com", name: "Alice Johnson" };
const USER_BOB = { id: 11, email: "bob@example.com", name: "Bob Williams" };
const USER_CAROL = { id: 12, email: "carol@example.com", name: "Carol Davis" };

const PROVIDER_PROFILE = {
  id: 1,
  userId: 1,
  firstName: "Jacob",
  lastName: "Egbert",
  practiceName: "Black Label Medicine",
  email: "dr.egbert@blacklabelmedicine.com",
};

const PROTOCOL = {
  id: 50,
  name: "Testosterone Maintenance",
  description: "Weekly testosterone injections with monitoring",
  category: "hormone",
  durationDays: 90,
  createdBy: 1,
};

const PROTOCOL_STEPS = [
  { id: 501, protocolId: 50, title: "Morning injection", frequency: "custom", customDays: ["mon", "wed", "fri"], sortOrder: 0 },
  { id: 502, protocolId: 50, title: "Blood pressure check", frequency: "daily", sortOrder: 1 },
  { id: 503, protocolId: 50, title: "Lab work", frequency: "monthly", sortOrder: 2 },
];

// ─── Mock tracking ──────────────────────────

const sendEmailMock = vi.fn().mockResolvedValue(true);
const sendSmsMock = vi.fn().mockResolvedValue(true);

// ─── Mock modules ──────────────────────────

// Mock email module
vi.mock("./email", () => ({
  sendEmail: (...args: any[]) => sendEmailMock(...args),
  inviteEmailHtml: vi.fn().mockReturnValue("<html>invite</html>"),
  newMessageEmailHtml: vi.fn().mockReturnValue("<html>message</html>"),
  appointmentEmailHtml: vi.fn().mockReturnValue("<html>appointment with ICS</html>"),
  notificationEmailHtml: vi.fn().mockReturnValue("<html>notification</html>"),
  protocolAssignedEmailHtml: vi.fn().mockReturnValue("<html>protocol assigned</html>"),
  protocolUpdatedEmailHtml: vi.fn().mockReturnValue("<html>protocol updated</html>"),
}));

// Mock SMS module
vi.mock("./sms", () => ({
  sendSms: (...args: any[]) => sendSmsMock(...args),
  inviteSmsBody: vi.fn().mockReturnValue("SMS invite"),
  newMessageSmsBody: vi.fn().mockReturnValue("SMS message"),
  appointmentReminderSmsBody: vi.fn().mockReturnValue("SMS appointment"),
  genericNotificationSmsBody: vi.fn().mockReturnValue("SMS notification"),
  protocolAssignedSmsBody: vi.fn().mockReturnValue("SMS protocol assigned"),
  protocolUpdatedSmsBody: vi.fn().mockReturnValue("SMS protocol updated"),
}));

// Mock Google Calendar (non-blocking, should not interfere)
vi.mock("./googleCalendar", () => ({
  getGoogleAuthUrl: vi.fn(),
  getConnectionStatus: vi.fn().mockResolvedValue({ connected: false }),
  disconnectGoogle: vi.fn(),
  syncAppointmentToGoogle: vi.fn().mockResolvedValue(undefined),
  deleteGoogleEvent: vi.fn(),
  syncAllAppointments: vi.fn(),
}));

// Mock backup module
vi.mock("./backup", () => ({
  createDatabaseBackup: vi.fn(),
  listBackups: vi.fn().mockResolvedValue([]),
  addToManifest: vi.fn(),
  getBackupDownloadUrl: vi.fn(),
  restoreDatabaseBackup: vi.fn(),
}));

// Patients map for lookup
const patientsMap: Record<number, any> = {
  100: PATIENT_A,
  101: PATIENT_B,
  102: PATIENT_NO_PHONE,
  103: PATIENT_NO_EMAIL,
};

// Users map for lookup
const usersMap: Record<number, any> = {
  10: USER_ALICE,
  11: USER_BOB,
  12: USER_CAROL,
};

// Track created notifications
const createdNotifications: any[] = [];
let appointmentIdCounter = 1000;
let assignmentIdCounter = 2000;

// Mock the db module
vi.mock("./db", () => ({
  // Patient queries
  getPatient: vi.fn((id: number) => patientsMap[id] || null),
  getPatientByEmail: vi.fn(() => null),
  getPatientByUserId: vi.fn(() => null),
  listPatients: vi.fn(() => Object.values(patientsMap)),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn(),
  restorePatient: vi.fn(),
  permanentlyDeletePatient: vi.fn(),
  listDeletedPatients: vi.fn(() => []),

  // User queries
  getUserByOpenId: vi.fn(() => PROVIDER_USER),
  getUserById: vi.fn((id: number) => usersMap[id] || null),

  // Protocol queries
  getProtocol: vi.fn((id: number) => (id === 50 ? PROTOCOL : null)),
  listProtocols: vi.fn(() => [PROTOCOL]),
  listAllProtocols: vi.fn(() => [PROTOCOL]),
  createProtocol: vi.fn(() => ({ id: 50 })),
  updateProtocol: vi.fn(),
  listProtocolSteps: vi.fn((protocolId: number) => (protocolId === 50 ? PROTOCOL_STEPS : [])),
  createProtocolStep: vi.fn(() => ({ id: 999 })),
  updateProtocolStep: vi.fn(),
  deleteProtocolStep: vi.fn(),

  // Assignment queries
  createAssignment: vi.fn(() => ({ id: ++assignmentIdCounter })),
  getAssignment: vi.fn(() => null),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  listAssignmentsForPatient: vi.fn(() => []),
  listActiveAssignmentsForProvider: vi.fn(() => []),
  listAssignmentsForProtocol: vi.fn(() => []),
  duplicateStepsToAssignment: vi.fn(),
  listAssignmentSteps: vi.fn(() => []),
  createAssignmentStep: vi.fn(),
  updateAssignmentStep: vi.fn(),
  deleteAssignmentStep: vi.fn(),
  deleteAssignmentStepsByAssignment: vi.fn(),

  // Appointment queries
  createAppointment: vi.fn(() => ({ id: ++appointmentIdCounter })),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  listAppointmentsForProvider: vi.fn(() => []),
  listAppointmentsForPatient: vi.fn(() => []),
  getAppointmentById: vi.fn(() => null),

  // Notification queries
  createNotification: vi.fn((data: any) => {
    const notif = { id: createdNotifications.length + 1, ...data };
    createdNotifications.push(notif);
    return notif;
  }),
  createNotificationWithEmail: vi.fn(async (data: any, opts: any) => {
    const notif = { id: createdNotifications.length + 1, ...data, emailSent: opts?.sendEmail || false };
    createdNotifications.push(notif);
    return notif;
  }),

  // Provider profile
  getProviderProfile: vi.fn(() => PROVIDER_PROFILE),

  // Completions
  listCompletionsForAssignment: vi.fn(() => []),
  createTaskCompletion: vi.fn(),
  deleteTaskCompletion: vi.fn(),

  // Messages
  listConversationsForProvider: vi.fn(() => []),
  listMessagesForConversation: vi.fn(() => []),
  sendMessage: vi.fn(),
  getMessage: vi.fn(),
  deleteMessageContent: vi.fn(),

  // Misc
  logAudit: vi.fn(),
  linkPatientToUser: vi.fn(),

  // Notes, tasks, documents, etc.
  listNotesForPatient: vi.fn(() => []),
  createNote: vi.fn(() => ({ id: 1 })),
  listTasksForPatient: vi.fn(() => []),
  createTask: vi.fn(() => ({ id: 1 })),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  listDocumentsForPatient: vi.fn(() => []),
  createDocument: vi.fn(() => ({ id: 1 })),
  deleteDocument: vi.fn(),
  getDocument: vi.fn(),

  // Biomarkers
  listBiomarkerEntries: vi.fn(() => []),
  listCustomMetrics: vi.fn(() => []),
  addBiomarkerEntry: vi.fn(),
  updateBiomarkerEntry: vi.fn(),
  deleteBiomarkerEntry: vi.fn(),
  addCustomMetric: vi.fn(),
  deleteCustomMetric: vi.fn(),

  // Resources
  listResources: vi.fn(() => []),
  createResource: vi.fn(() => ({ id: 1 })),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  getResourceById: vi.fn(),

  // Invites
  createInvite: vi.fn(() => ({ id: 1 })),
  getInviteByToken: vi.fn(() => null),
  markInviteUsed: vi.fn(),
  listInvitesForProvider: vi.fn(() => []),
  deleteInvite: vi.fn(),

  // Notifications
  listNotificationsForUser: vi.fn(() => []),
  countUnreadNotifications: vi.fn(() => 0),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),

  // Attention queue
  listAttentionItems: vi.fn(() => []),
  updateAttentionItem: vi.fn(),
  createAttentionItem: vi.fn(),
  deleteAttentionItem: vi.fn(),

  // Analytics
  getAnalytics: vi.fn(() => ({
    totalPatients: 4,
    activePatients: 3,
    totalProtocols: 1,
    totalAppointments: 0,
    upcomingAppointments: 0,
  })),

  // Google tokens
  getGoogleTokens: vi.fn(() => null),
  upsertGoogleTokens: vi.fn(),
  deleteGoogleTokens: vi.fn(),

  // Seed templates
  seedProtocolTemplates: vi.fn(),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { sendEmail, appointmentEmailHtml, protocolAssignedEmailHtml, protocolUpdatedEmailHtml } from "./email";
import { sendSms, appointmentReminderSmsBody, protocolAssignedSmsBody, protocolUpdatedSmsBody } from "./sms";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  return {
    user: PROVIDER_USER as AuthenticatedUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST SUITE: Complete Notification Workflow
// ═══════════════════════════════════════════════════════════════

describe("End-to-End Notification Workflow", () => {
  const ctx = createAdminContext();
  const caller = appRouter.createCaller(ctx);

  beforeEach(() => {
    vi.clearAllMocks();
    createdNotifications.length = 0;
    sendEmailMock.mockResolvedValue(true);
    sendSmsMock.mockResolvedValue(true);
  });

  // ─── STAGE 1: Appointment Creation ──────────────────────────

  describe("Stage 1: Appointment creation notifications", () => {
    it("sends email with ICS attachment and SMS when patient has both channels", async () => {
      const scheduledAt = new Date("2026-03-15T15:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Follow-up",
        type: "follow_up",
        scheduledAt,
        durationMinutes: 60,
        origin: "https://portal.blacklabelmedicine.com",
      });

      // Verify in-app notification was created
      expect(db.createNotificationWithEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PATIENT_A.userId,
          title: "New Appointment Scheduled",
          type: "appointment_reminder",
        }),
        { sendEmail: false }
      );

      // Verify email was sent
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      const emailCall = sendEmailMock.mock.calls[0][0];
      expect(emailCall.to).toBe("alice@example.com");
      expect(emailCall.subject).toContain("Follow-up");
      expect(emailCall.subject).toContain("New Appointment");

      // Verify ICS attachment is present
      expect(emailCall.attachments).toBeDefined();
      expect(emailCall.attachments).toHaveLength(1);
      expect(emailCall.attachments[0].filename).toBe("appointment.ics");
      expect(emailCall.attachments[0].contentType).toBe("text/calendar");

      // Verify ICS content is RFC 5545 compliant
      const icsContent = emailCall.attachments[0].content;
      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("VERSION:2.0");
      expect(icsContent).toContain("METHOD:REQUEST");
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("DTSTART:20260315T150000Z");
      expect(icsContent).toContain("DTEND:20260315T160000Z");
      expect(icsContent).toContain("SUMMARY:Follow-up");
      expect(icsContent).toContain("BEGIN:VALARM");
      expect(icsContent).toContain("TRIGGER:-PT30M");
      expect(icsContent).toContain("END:VCALENDAR");

      // Verify attendee info in ICS
      expect(icsContent).toContain("ATTENDEE;CN=Alice Johnson;RSVP=TRUE:mailto:alice@example.com");

      // Verify SMS was sent
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock.mock.calls[0][0].to).toBe("+18015551234");

      // Verify appointment email template was called with correct params
      expect(appointmentEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: "Jacob Egbert",
          appointmentType: "Follow-up",
          portalUrl: "https://portal.blacklabelmedicine.com/patient/schedule",
          googleCalUrl: expect.stringContaining("calendar.google.com"),
        })
      );

      // Verify Google Calendar link is in the template params
      const templateCall = (appointmentEmailHtml as any).mock.calls[0][0];
      expect(templateCall.googleCalUrl).toContain("action=TEMPLATE");
      expect(templateCall.googleCalUrl).toContain("Follow-up");
    });

    it("sends email but skips SMS when patient has no phone", async () => {
      const scheduledAt = new Date("2026-03-20T10:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_NO_PHONE.id,
        title: "Lab Work",
        type: "lab_work",
        scheduledAt,
        durationMinutes: 30,
      });

      // Email should be sent
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendEmailMock.mock.calls[0][0].to).toBe("carol@example.com");

      // ICS should still be attached
      expect(sendEmailMock.mock.calls[0][0].attachments).toHaveLength(1);
      expect(sendEmailMock.mock.calls[0][0].attachments[0].filename).toBe("appointment.ics");

      // SMS should NOT be sent
      expect(sendSmsMock).not.toHaveBeenCalled();
    });

    it("sends SMS but skips email when patient has no email and no linked user", async () => {
      const scheduledAt = new Date("2026-03-22T14:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_NO_EMAIL.id,
        title: "Urgent Check",
        type: "urgent",
        scheduledAt,
      });

      // Email should NOT be sent (no email, no linked user)
      expect(sendEmailMock).not.toHaveBeenCalled();

      // SMS should be sent
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock.mock.calls[0][0].to).toBe("+18015559999");
    });

    it("includes patient notes in ICS description when provided", async () => {
      const scheduledAt = new Date("2026-04-01T09:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Initial Consultation",
        type: "initial",
        scheduledAt,
        durationMinutes: 90,
        patientNotes: "Please fast for 12 hours before appointment.",
        origin: "https://portal.blacklabelmedicine.com",
      });

      const emailCall = sendEmailMock.mock.calls[0][0];
      const icsContent = emailCall.attachments[0].content;

      // ICS should include notes in description
      expect(icsContent).toContain("Please fast for 12 hours before appointment.");
    });

    it("calculates correct end time based on durationMinutes", async () => {
      const scheduledAt = new Date("2026-05-01T08:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Quick Check-in",
        type: "check_in",
        scheduledAt,
        durationMinutes: 15,
      });

      const emailCall = sendEmailMock.mock.calls[0][0];
      const icsContent = emailCall.attachments[0].content;

      // Start: 08:00 UTC, Duration: 15 min → End: 08:15 UTC
      expect(icsContent).toContain("DTSTART:20260501T080000Z");
      expect(icsContent).toContain("DTEND:20260501T081500Z");
    });

    it("defaults to 60 minutes when durationMinutes is not specified", async () => {
      const scheduledAt = new Date("2026-05-10T12:00:00Z");

      await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Standard Visit",
        type: "follow_up",
        scheduledAt,
      });

      const emailCall = sendEmailMock.mock.calls[0][0];
      const icsContent = emailCall.attachments[0].content;

      // Start: 12:00 UTC, Default duration: 60 min → End: 13:00 UTC
      expect(icsContent).toContain("DTSTART:20260510T120000Z");
      expect(icsContent).toContain("DTEND:20260510T130000Z");
    });
  });

  // ─── STAGE 2: Protocol Assignment ──────────────────────────

  describe("Stage 2: Protocol assignment notifications", () => {
    it("sends email and SMS with protocol details when assigning to patient", async () => {
      await caller.assignment.create({
        patientId: PATIENT_A.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-03-01"),
        origin: "https://portal.blacklabelmedicine.com",
      });

      // Verify in-app notification was created
      expect(db.createNotificationWithEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PATIENT_A.userId,
          title: "New Protocol Assigned",
          body: expect.stringContaining("Testosterone Maintenance"),
          type: "system",
          relatedEntityType: "assignment",
        }),
        { sendEmail: true }
      );

      // Verify email was sent with protocol details
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      const emailCall = sendEmailMock.mock.calls[0][0];
      expect(emailCall.to).toBe("alice@example.com");
      expect(emailCall.subject).toContain("Testosterone Maintenance");

      // Verify protocol assigned template was called with correct params
      expect(protocolAssignedEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: "Black Label Medicine",
          protocolName: "Testosterone Maintenance",
          protocolDescription: "Weekly testosterone injections with monitoring",
          stepCount: 3,
          portalUrl: "https://portal.blacklabelmedicine.com/patient/protocols",
        })
      );

      // Verify SMS was sent
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock.mock.calls[0][0].to).toBe("+18015551234");

      // Verify SMS template was called
      expect(protocolAssignedSmsBody).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: "Black Label Medicine",
          protocolName: "Testosterone Maintenance",
        })
      );

      // Verify steps were duplicated to assignment
      expect(db.duplicateStepsToAssignment).toHaveBeenCalledWith(
        PROTOCOL.id,
        expect.any(Number)
      );

      // Verify patient status was updated to active
      expect(db.updatePatient).toHaveBeenCalledWith(
        PATIENT_A.id,
        expect.objectContaining({ status: "active" })
      );
    });

    it("sends email but skips SMS when patient has no phone", async () => {
      await caller.assignment.create({
        patientId: PATIENT_NO_PHONE.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-03-01"),
      });

      // Email should be sent
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendEmailMock.mock.calls[0][0].to).toBe("carol@example.com");

      // SMS should NOT be sent
      expect(sendSmsMock).not.toHaveBeenCalled();
    });

    it("sends SMS but skips email when patient has no email and no linked user", async () => {
      await caller.assignment.create({
        patientId: PATIENT_NO_EMAIL.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-03-01"),
      });

      // No in-app notification (no userId)
      expect(db.createNotificationWithEmail).not.toHaveBeenCalled();

      // Email should NOT be sent (no email)
      expect(sendEmailMock).not.toHaveBeenCalled();

      // SMS should be sent
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock.mock.calls[0][0].to).toBe("+18015559999");
    });

    it("creates audit log entry for assignment creation", async () => {
      await caller.assignment.create({
        patientId: PATIENT_A.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-03-01"),
      });

      expect(db.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PROVIDER_USER.id,
          action: "assignment.create",
          entityType: "assignment",
        })
      );
    });
  });

  // ─── STAGE 3: Protocol Update ──────────────────────────

  describe("Stage 3: Protocol update notifications to all assigned patients", () => {
    it("notifies all patients with active assignments when protocol is updated", async () => {
      // Set up: two patients have active assignments for this protocol
      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([
        { id: 2001, patientId: PATIENT_A.id, protocolId: PROTOCOL.id, status: "active" },
        { id: 2002, patientId: PATIENT_B.id, protocolId: PROTOCOL.id, status: "active" },
        { id: 2003, patientId: PATIENT_A.id, protocolId: PROTOCOL.id, status: "completed" }, // should be skipped
      ]);

      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Testosterone Maintenance v2",
        description: "Updated dosage schedule",
        category: "hormone",
        durationDays: 90,
        steps: [
          { id: 501, title: "Morning injection (updated dose)", frequency: "custom", customDays: ["mon", "wed", "fri"] },
          { title: "New evening supplement", frequency: "daily", timeOfDay: "evening" },
        ],
      });

      // Wait for async notifications to settle
      await new Promise((r) => setTimeout(r, 100));

      // Verify email sent to both active patients (not the completed one)
      expect(sendEmailMock).toHaveBeenCalledTimes(2);

      const emailRecipients = sendEmailMock.mock.calls.map((c: any) => c[0].to);
      expect(emailRecipients).toContain("alice@example.com");
      expect(emailRecipients).toContain("bob@example.com");

      // Verify protocol updated template was called for each patient
      expect(protocolUpdatedEmailHtml).toHaveBeenCalledTimes(2);
      // Note: getProtocol is called after updateProtocol but our mock returns the original name.
      // The notification uses the *fetched* protocol name, which in production would be the updated name.
      // Here we verify the template was called with the correct structure.
      expect(protocolUpdatedEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          protocolName: expect.any(String),
          changeDescription: expect.stringContaining("updated"),
          providerName: "Jacob Egbert",
          portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
        })
      );

      // Verify SMS sent to both active patients
      expect(sendSmsMock).toHaveBeenCalledTimes(2);
      const smsRecipients = sendSmsMock.mock.calls.map((c: any) => c[0].to);
      expect(smsRecipients).toContain("+18015551234");
      expect(smsRecipients).toContain("+18015555678");
    });

    it("skips notification when no active assignments exist", async () => {
      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([
        { id: 2003, patientId: PATIENT_A.id, protocolId: PROTOCOL.id, status: "completed" },
        { id: 2004, patientId: PATIENT_B.id, protocolId: PROTOCOL.id, status: "cancelled" },
      ]);

      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Testosterone Maintenance v3",
        category: "hormone",
      });

      await new Promise((r) => setTimeout(r, 100));

      // No emails or SMS should be sent (all assignments are inactive)
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(sendSmsMock).not.toHaveBeenCalled();
    });

    it("handles mixed contact info: some patients with email only, some with phone only", async () => {
      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([
        { id: 2005, patientId: PATIENT_NO_PHONE.id, protocolId: PROTOCOL.id, status: "active" },
        { id: 2006, patientId: PATIENT_NO_EMAIL.id, protocolId: PROTOCOL.id, status: "active" },
      ]);

      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Testosterone Maintenance v4",
        category: "hormone",
      });

      await new Promise((r) => setTimeout(r, 100));

      // Carol (no phone): email sent, no SMS
      // Dan (no email, no userId): no email, SMS sent
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendEmailMock.mock.calls[0][0].to).toBe("carol@example.com");

      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock.mock.calls[0][0].to).toBe("+18015559999");
    });

    it("creates audit log for protocol update", async () => {
      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([]);

      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Updated Protocol",
        category: "hormone",
      });

      expect(db.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: PROVIDER_USER.id,
          action: "protocol.fullUpdate",
          entityType: "protocol",
          entityId: PROTOCOL.id,
        })
      );
    });
  });

  // ─── STAGE 4: Full Workflow (Appointment → Assign → Update) ──────────────────────────

  describe("Stage 4: Complete workflow — appointment, then assign, then update", () => {
    it("fires all notifications in sequence for a single patient journey", async () => {
      // Step 1: Create an appointment for Alice
      const scheduledAt = new Date("2026-04-01T14:00:00Z");
      await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Initial Consultation",
        type: "initial",
        scheduledAt,
        durationMinutes: 60,
        origin: "https://portal.blacklabelmedicine.com",
      });

      // Verify appointment notifications
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      const apptEmail = sendEmailMock.mock.calls[0][0];
      expect(apptEmail.attachments[0].filename).toBe("appointment.ics");
      expect(apptEmail.attachments[0].content).toContain("Initial Consultation");

      // Reset mocks for next stage
      sendEmailMock.mockClear();
      sendSmsMock.mockClear();

      // Step 2: Assign a protocol to Alice
      await caller.assignment.create({
        patientId: PATIENT_A.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-04-02"),
        origin: "https://portal.blacklabelmedicine.com",
      });

      // Verify protocol assignment notifications
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      const assignEmail = sendEmailMock.mock.calls[0][0];
      expect(assignEmail.subject).toContain("Testosterone Maintenance");
      // Protocol assignment emails should NOT have ICS attachment
      expect(assignEmail.attachments).toBeUndefined();

      // Reset mocks for next stage
      sendEmailMock.mockClear();
      sendSmsMock.mockClear();

      // Step 3: Update the protocol (Alice has active assignment)
      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([
        { id: 2001, patientId: PATIENT_A.id, protocolId: PROTOCOL.id, status: "active" },
      ]);

      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Testosterone Maintenance (Revised)",
        category: "hormone",
        steps: [
          { id: 501, title: "Updated injection schedule", frequency: "custom", customDays: ["mon", "thu"] },
        ],
      });

      await new Promise((r) => setTimeout(r, 100));

      // Verify protocol update notifications
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
      expect(sendSmsMock).toHaveBeenCalledTimes(1);
      const updateEmail = sendEmailMock.mock.calls[0][0];
      expect(updateEmail.subject).toContain("Protocol Updated");
      expect(updateEmail.to).toBe("alice@example.com");

      // Total across all stages: 3 emails, 3 SMS, 2 in-app notifications
      // (appointment notification + assignment notification; protocol update doesn't create in-app notif in the router)
    });
  });

  // ─── STAGE 5: Error Resilience ──────────────────────────

  describe("Stage 5: Error resilience — notifications fail gracefully", () => {
    it("appointment creation succeeds even when email sending fails", async () => {
      sendEmailMock.mockRejectedValueOnce(new Error("Resend API down"));

      const scheduledAt = new Date("2026-06-01T10:00:00Z");

      // Should not throw — notification failure is caught
      const result = await caller.appointment.create({
        patientId: PATIENT_A.id,
        title: "Resilient Appointment",
        type: "follow_up",
        scheduledAt,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("protocol assignment succeeds even when SMS sending fails", async () => {
      sendSmsMock.mockRejectedValueOnce(new Error("Twilio API down"));

      const result = await caller.assignment.create({
        patientId: PATIENT_A.id,
        protocolId: PROTOCOL.id,
        startDate: new Date("2026-06-01"),
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("protocol update succeeds even when all notifications fail", async () => {
      sendEmailMock.mockRejectedValue(new Error("Email service down"));
      sendSmsMock.mockRejectedValue(new Error("SMS service down"));

      (db.listAssignmentsForProtocol as any).mockResolvedValueOnce([
        { id: 2001, patientId: PATIENT_A.id, protocolId: PROTOCOL.id, status: "active" },
      ]);

      // Should not throw
      await caller.protocol.fullUpdate({
        id: PROTOCOL.id,
        name: "Resilient Update",
        category: "hormone",
      });

      await new Promise((r) => setTimeout(r, 100));

      // Protocol update itself should still succeed (audit log created)
      expect(db.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "protocol.fullUpdate" })
      );
    });
  });
});
