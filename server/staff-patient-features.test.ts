/**
 * Tests for Staff Invitation System and Patient-Created Protocols
 * Mocks the db module to avoid writing to the real database
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDbMock } from "./__mocks__/dbMockFactory";

// Must use factory function for vi.mock hoisting
vi.mock("./db", () => createDbMock());

vi.mock("./email", () => ({
  sendEmail: vi.fn(async () => true),
  staffInviteEmailHtml: vi.fn(() => "<html>Staff Invite</html>"),
  protocolAssignedEmailHtml: vi.fn(() => "<html>Protocol Assigned</html>"),
  protocolUpdatedEmailHtml: vi.fn(() => "<html>Protocol Updated</html>"),
  appointmentEmailHtml: vi.fn(() => "<html>Appointment</html>"),
}));

vi.mock("./sms", () => ({
  sendSms: vi.fn(async () => true),
  protocolAssignedSmsBody: vi.fn(() => "Protocol assigned SMS"),
  protocolUpdatedSmsBody: vi.fn(() => "Protocol updated SMS"),
}));

vi.mock("./patientNotify", () => ({
  notifyPatientProtocolAssigned: vi.fn(async () => {}),
  notifyPatientProtocolUpdated: vi.fn(async () => {}),
  notifyPatientAppointment: vi.fn(async () => {}),
}));

vi.mock("./googleCalendar", () => ({
  createCalendarEvent: vi.fn(async () => null),
  syncAppointmentToGoogle: vi.fn(async () => null),
}));

import * as db from "./db";
import { appRouter } from "./routers";

const ownerCtx = {
  user: { id: 1, openId: "owner-open-id", role: "admin", name: "Dr. Owner", email: "owner@test.com" },
};

const staffCtx = {
  user: { id: 2, openId: "staff-open-id", role: "staff", name: "Staff Member", email: "staff@test.com" },
};

const patientCtx = {
  user: { id: 3, openId: "patient-open-id", role: "user", name: "Patient User", email: "patient@test.com" },
};

describe("Staff Invitation System", () => {
  beforeEach(async () => {
  const { clearOwnerIdCache } = await import("./_core/trpc");
  clearOwnerIdCache();
    vi.clearAllMocks();
    process.env.OWNER_OPEN_ID = "owner-open-id";
  });

  describe("staff.invite", () => {
    it("should create a staff invite with valid email", async () => {
      const caller = appRouter.createCaller(ownerCtx as any);
      await caller.staff.invite({
        email: "assistant@test.com",
        name: "Jane Assistant",
        origin: "https://example.com",
      });
      expect(db.createStaffInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "assistant@test.com",
          name: "Jane Assistant",
          createdByUserId: 1,
        })
      );
    });

    it("should reject invite from non-owner (staff cannot invite)", async () => {
      const caller = appRouter.createCaller(staffCtx as any);
      await expect(
        caller.staff.invite({
          email: "assistant@test.com",
          name: "Jane",
          origin: "https://example.com",
        })
      ).rejects.toThrow();
    });
  });

  describe("staff.listMembers", () => {
    it("should list staff members", async () => {
      (db.listStaffMembers as any).mockResolvedValueOnce([
        { id: 2, name: "Staff A", email: "staff@test.com", role: "staff", lastSignedIn: new Date() },
      ]);
      const caller = appRouter.createCaller(ownerCtx as any);
      const result = await caller.staff.listMembers();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Staff A");
    });
  });

  describe("staff.listInvites", () => {
    it("should list pending invites", async () => {
      (db.listStaffInvites as any).mockResolvedValueOnce([
        { id: 1, email: "pending@test.com", name: "Pending", status: "pending", createdAt: new Date() },
      ]);
      const caller = appRouter.createCaller(ownerCtx as any);
      const result = await caller.staff.listInvites();
      expect(result).toHaveLength(1);
    });
  });

  describe("staff.revokeInvite", () => {
    it("should revoke a pending invite", async () => {
      const caller = appRouter.createCaller(ownerCtx as any);
      await caller.staff.revokeInvite({ id: 1 });
      expect(db.revokeStaffInvite).toHaveBeenCalledWith(1);
    });
  });

  describe("staff.removeMember", () => {
    it("should remove a staff member by downgrading to user role", async () => {
      const caller = appRouter.createCaller(ownerCtx as any);
      await caller.staff.removeMember({ userId: 2 });
      expect(db.removeStaffMember).toHaveBeenCalledWith(2);
    });
  });

  describe("Staff role access", () => {
    it("staff should be able to list patients (adminProcedure allows staff)", async () => {
      (db.listPatients as any).mockResolvedValueOnce([]);
      const caller = appRouter.createCaller(staffCtx as any);
      const result = await caller.patient.list();
      expect(result).toEqual([]);
    });

    it("staff should be able to list protocols", async () => {
      (db.listProtocols as any).mockResolvedValueOnce([]);
      const caller = appRouter.createCaller(staffCtx as any);
      const result = await caller.protocol.list();
      expect(result).toEqual([]);
    });

    it("staff should be able to create appointments", async () => {
      (db.createAppointment as any).mockResolvedValueOnce({
        id: 1,
        patientId: 1,
        providerId: 1,
        createdBy: 2,
        title: "Follow-up",
        scheduledAt: new Date(),
        durationMinutes: 30,
      });
      (db.getPatient as any).mockResolvedValueOnce({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        phone: null,
        userId: 3,
      });
      (db.getUserById as any).mockResolvedValueOnce({ id: 3, email: "john@test.com" });
      (db.getProviderProfile as any).mockResolvedValueOnce({ practiceName: "Test Practice" });

      const caller = appRouter.createCaller(staffCtx as any);
      const result = await caller.appointment.create({
        patientId: 1,
        title: "Follow-up",
        type: "follow_up",
        scheduledAt: new Date(),
        durationMinutes: 30,
        origin: "https://example.com",
      });
      expect(result.id).toBe(1);
    });
  });
});

describe("Patient-Created Protocols", () => {
  beforeEach(async () => {
  const { clearOwnerIdCache } = await import("./_core/trpc");
  clearOwnerIdCache();
    vi.clearAllMocks();
  });

  describe("protocol.patientCreate", () => {
    it("should create a protocol when patient has a record", async () => {
      (db.getPatientByUserId as any).mockResolvedValueOnce({
        id: 10,
        firstName: "John",
        lastName: "Doe",
        providerId: 1,
      });
      (db.createProtocol as any).mockResolvedValueOnce({
        id: 50,
        name: "My Morning Routine",
        createdBy: 1,
        createdByPatientId: 10,
        isTemplate: false,
      });

      const caller = appRouter.createCaller(patientCtx as any);
      const result = await caller.protocol.patientCreate({
        name: "My Morning Routine",
        description: "My daily morning wellness routine",
        category: "lifestyle",
        steps: [
          { title: "Meditation", frequency: "daily", timeOfDay: "morning" },
          { title: "Cold shower", frequency: "daily", timeOfDay: "morning" },
        ],
      });

      expect(result.id).toBe(50);
      expect(db.createProtocol).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Morning Routine",
          createdByPatientId: 10,
          isTemplate: false,
        })
      );
      expect(db.createProtocolStep).toHaveBeenCalledTimes(2);
      expect(db.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "protocol.patientCreate",
          details: expect.objectContaining({ patientId: 10 }),
        })
      );
    });

    it("should reject if user is not a registered patient", async () => {
      (db.getPatientByUserId as any).mockResolvedValueOnce(null);

      const caller = appRouter.createCaller(patientCtx as any);
      await expect(
        caller.protocol.patientCreate({
          name: "Test Protocol",
          category: "other",
        })
      ).rejects.toThrow("You must be a registered patient");
    });

    it("should create protocol without steps", async () => {
      (db.getPatientByUserId as any).mockResolvedValueOnce({
        id: 10,
        firstName: "John",
        lastName: "Doe",
        providerId: 1,
      });
      (db.createProtocol as any).mockResolvedValueOnce({
        id: 51,
        name: "Simple Protocol",
        createdBy: 1,
        createdByPatientId: 10,
      });

      const caller = appRouter.createCaller(patientCtx as any);
      const result = await caller.protocol.patientCreate({
        name: "Simple Protocol",
        category: "nutrition",
      });

      expect(result.id).toBe(51);
      expect(db.createProtocolStep).not.toHaveBeenCalled();
    });
  });

  describe("protocol.listMyCreated", () => {
    it("should return patient's created protocols", async () => {
      (db.getPatientByUserId as any).mockResolvedValueOnce({ id: 10 });
      (db.listPatientCreatedProtocols as any).mockResolvedValueOnce([
        { id: 50, name: "My Protocol", createdByPatientId: 10 },
      ]);

      const caller = appRouter.createCaller(patientCtx as any);
      const result = await caller.protocol.listMyCreated();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("My Protocol");
    });

    it("should return empty array if user is not a patient", async () => {
      (db.getPatientByUserId as any).mockResolvedValueOnce(null);

      const caller = appRouter.createCaller(patientCtx as any);
      const result = await caller.protocol.listMyCreated();
      expect(result).toEqual([]);
    });
  });

  describe("protocol.listPatientCreated (provider view)", () => {
    it("should list all patient-created protocols for the provider", async () => {
      (db.listAllPatientCreatedProtocols as any).mockResolvedValueOnce([
        { id: 50, name: "Patient Protocol", createdByPatientId: 10, createdBy: 1 },
      ]);
      (db.listProtocolSteps as any).mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
      (db.getPatient as any).mockResolvedValueOnce({ id: 10, firstName: "John", lastName: "Doe" });

      const caller = appRouter.createCaller(ownerCtx as any);
      const result = await caller.protocol.listPatientCreated();
      expect(result).toHaveLength(1);
      expect(result[0].stepCount).toBe(2);
      expect(result[0].patientName).toBe("John Doe");
    });
  });
});
