import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── ICS Calendar Generation Tests ──────────────────────────

describe("ICS calendar generation", () => {
  it("generates valid ICS content with required fields", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "Follow-up — Dr. Smith",
      description: "Appointment with Dr. Smith at Black Label Medicine.",
      startTime: new Date("2026-03-15T15:00:00Z"),
      endTime: new Date("2026-03-15T16:00:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Black Label Medicine//Patient Portal//EN");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("DTSTART:20260315T150000Z");
    expect(ics).toContain("DTEND:20260315T160000Z");
    expect(ics).toContain("SUMMARY:Follow-up — Dr. Smith");
    expect(ics).toContain("ORGANIZER;CN=Dr. Smith:mailto:notifications@blacklabelmedicine.com");
  });

  it("includes attendee when email is provided", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "Check-in",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
      attendeeName: "John Doe",
      attendeeEmail: "john@example.com",
    });

    expect(ics).toContain("ATTENDEE;CN=John Doe;RSVP=TRUE:mailto:john@example.com");
  });

  it("includes 30-minute reminder alarm", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "Test",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    });

    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics).toContain("ACTION:DISPLAY");
    expect(ics).toContain("END:VALARM");
  });

  it("escapes special characters in text fields", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "Follow-up; Check-in, Review",
      description: "Notes: line1\nline2",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    });

    expect(ics).toContain("Follow-up\\; Check-in\\, Review");
    expect(ics).toContain("Notes: line1\\nline2");
  });

  it("includes location when provided", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "In-person visit",
      location: "123 Main St, Suite 100",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    });

    expect(ics).toContain("LOCATION:123 Main St\\, Suite 100");
  });

  it("uses CRLF line endings per RFC 5545", async () => {
    const { generateIcs } = await import("./ics");
    const ics = generateIcs({
      summary: "Test",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    });

    // Should use \r\n line endings
    expect(ics).toContain("\r\n");
    // Lines should be separated by \r\n
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
  });

  it("generates unique UIDs for each event", async () => {
    const { generateIcs } = await import("./ics");
    const params = {
      summary: "Test",
      startTime: new Date("2026-04-01T10:00:00Z"),
      endTime: new Date("2026-04-01T10:30:00Z"),
      organizerName: "Dr. Smith",
      organizerEmail: "notifications@blacklabelmedicine.com",
    };

    const ics1 = generateIcs(params);
    const ics2 = generateIcs(params);

    const uid1 = ics1.match(/UID:(.+)/)?.[1];
    const uid2 = ics2.match(/UID:(.+)/)?.[1];
    expect(uid1).toBeTruthy();
    expect(uid2).toBeTruthy();
    expect(uid1).not.toBe(uid2);
  });
});

// ─── Protocol Email Template Tests ──────────────────────────

describe("Protocol email templates", () => {
  it("protocolAssignedEmailHtml includes protocol details", async () => {
    const { protocolAssignedEmailHtml } = await import("./email");
    const html = protocolAssignedEmailHtml({
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
      protocolDescription: "Weekly testosterone injections with monitoring",
      stepCount: 8,
      portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
    });

    expect(html).toContain("Dr. Smith");
    expect(html).toContain("Testosterone Maintenance");
    expect(html).toContain("Weekly testosterone injections with monitoring");
    expect(html).toContain("8 steps");
    expect(html).toContain("View Protocol");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Black Label Medicine");
  });

  it("protocolAssignedEmailHtml handles single step correctly", async () => {
    const { protocolAssignedEmailHtml } = await import("./email");
    const html = protocolAssignedEmailHtml({
      providerName: "Dr. Smith",
      protocolName: "Simple Protocol",
      stepCount: 1,
      portalUrl: "https://example.com/patient/protocols",
    });

    expect(html).toContain("1 step");
    expect(html).not.toContain("1 steps");
  });

  it("protocolAssignedEmailHtml handles missing description", async () => {
    const { protocolAssignedEmailHtml } = await import("./email");
    const html = protocolAssignedEmailHtml({
      providerName: "Dr. Smith",
      protocolName: "Test Protocol",
      stepCount: 3,
      portalUrl: "https://example.com/patient/protocols",
    });

    expect(html).toContain("Test Protocol");
    expect(html).toContain("3 steps");
  });

  it("protocolUpdatedEmailHtml includes update details", async () => {
    const { protocolUpdatedEmailHtml } = await import("./email");
    const html = protocolUpdatedEmailHtml({
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
      changeDescription: "Dosage adjusted from 40mg to 50mg twice weekly.",
      portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
    });

    expect(html).toContain("Dr. Smith");
    expect(html).toContain("Testosterone Maintenance");
    expect(html).toContain("Dosage adjusted from 40mg to 50mg twice weekly.");
    expect(html).toContain("View Protocol");
    expect(html).toContain("updated");
  });
});

// ─── Protocol SMS Template Tests ──────────────────────────

describe("Protocol SMS templates", () => {
  it("protocolAssignedSmsBody generates concise text", async () => {
    const { protocolAssignedSmsBody } = await import("./sms");
    const body = protocolAssignedSmsBody({
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
    });

    expect(body).toContain("Dr. Smith");
    expect(body).toContain("Testosterone Maintenance");
    expect(body).toContain("Black Label Medicine");
    expect(body.length).toBeLessThan(320);
  });

  it("protocolUpdatedSmsBody generates concise text", async () => {
    const { protocolUpdatedSmsBody } = await import("./sms");
    const body = protocolUpdatedSmsBody({
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
    });

    expect(body).toContain("Dr. Smith");
    expect(body).toContain("Testosterone Maintenance");
    expect(body).toContain("updated");
    expect(body).toContain("Black Label Medicine");
    expect(body.length).toBeLessThan(320);
  });
});

// ─── Appointment Email with ICS Tests ──────────────────────────

describe("Appointment email with ICS attachment", () => {
  it("appointmentEmailHtml includes Google Calendar link", async () => {
    const { appointmentEmailHtml } = await import("./email");
    const html = appointmentEmailHtml({
      providerName: "Dr. Smith",
      appointmentDate: "Monday, March 15, 2026",
      appointmentTime: "3:00 PM",
      appointmentType: "Follow-up",
      portalUrl: "https://www.blacklabelmedicine.com/patient/schedule",
      googleCalUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Follow-up",
    });

    expect(html).toContain("Add to Google Calendar");
    expect(html).toContain("calendar.google.com");
    expect(html).toContain(".ics");
    expect(html).toContain("Monday, March 15, 2026");
    expect(html).toContain("3:00 PM");
    expect(html).toContain("Follow-up");
  });

  it("appointmentEmailHtml includes notes when provided", async () => {
    const { appointmentEmailHtml } = await import("./email");
    const html = appointmentEmailHtml({
      providerName: "Dr. Smith",
      appointmentDate: "Monday, March 15, 2026",
      appointmentTime: "3:00 PM",
      appointmentType: "Lab Work",
      portalUrl: "https://example.com/patient/schedule",
      notes: "Fasting required for 12 hours before appointment.",
    });

    expect(html).toContain("Fasting required for 12 hours before appointment.");
    expect(html).toContain("Notes:");
  });
});

// ─── Protocol Notification Orchestration Tests ──────────────────────────

describe("Protocol notification orchestration", () => {
  it("notifyPatientProtocolAssigned sends email and SMS", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      protocolAssignedEmailHtml: vi.fn().mockReturnValue("<html>assigned</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      protocolAssignedSmsBody: vi.fn().mockReturnValue("SMS assigned"),
    }));
    vi.doMock("./ics", () => ({
      generateIcs: vi.fn().mockReturnValue("BEGIN:VCALENDAR..."),
    }));

    const { notifyPatientProtocolAssigned } = await import("./patientNotify");
    const result = await notifyPatientProtocolAssigned({
      email: "patient@example.com",
      phone: "+18015551234",
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
      protocolDescription: "Weekly injections",
      stepCount: 8,
      portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(true);
  });

  it("notifyPatientProtocolAssigned handles missing phone", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      protocolAssignedEmailHtml: vi.fn().mockReturnValue("<html>assigned</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      protocolAssignedSmsBody: vi.fn().mockReturnValue("SMS assigned"),
    }));
    vi.doMock("./ics", () => ({
      generateIcs: vi.fn().mockReturnValue("BEGIN:VCALENDAR..."),
    }));

    const { notifyPatientProtocolAssigned } = await import("./patientNotify");
    const result = await notifyPatientProtocolAssigned({
      email: "patient@example.com",
      phone: null,
      providerName: "Dr. Smith",
      protocolName: "Test Protocol",
      stepCount: 3,
      portalUrl: "https://example.com/patient/protocols",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(false);
  });

  it("notifyPatientProtocolUpdated sends email and SMS", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      protocolUpdatedEmailHtml: vi.fn().mockReturnValue("<html>updated</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      protocolUpdatedSmsBody: vi.fn().mockReturnValue("SMS updated"),
    }));
    vi.doMock("./ics", () => ({
      generateIcs: vi.fn().mockReturnValue("BEGIN:VCALENDAR..."),
    }));

    const { notifyPatientProtocolUpdated } = await import("./patientNotify");
    const result = await notifyPatientProtocolUpdated({
      email: "patient@example.com",
      phone: "+18015551234",
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
      changeDescription: "Dosage increased to 50mg.",
      portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(true);
  });

  it("notifyPatientProtocolUpdated handles missing email", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      protocolUpdatedEmailHtml: vi.fn().mockReturnValue("<html>updated</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      protocolUpdatedSmsBody: vi.fn().mockReturnValue("SMS updated"),
    }));
    vi.doMock("./ics", () => ({
      generateIcs: vi.fn().mockReturnValue("BEGIN:VCALENDAR..."),
    }));

    const { notifyPatientProtocolUpdated } = await import("./patientNotify");
    const result = await notifyPatientProtocolUpdated({
      email: null,
      phone: "+18015551234",
      providerName: "Dr. Smith",
      protocolName: "Testosterone Maintenance",
      changeDescription: "Steps reordered.",
      portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
    });

    expect(result.emailSent).toBe(false);
    expect(result.smsSent).toBe(true);
  });

  it("notifyPatientAppointment sends email with ICS and SMS", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      appointmentEmailHtml: vi.fn().mockReturnValue("<html>appointment</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      appointmentReminderSmsBody: vi.fn().mockReturnValue("SMS appointment"),
    }));
    vi.doMock("./ics", () => ({
      generateIcs: vi.fn().mockReturnValue("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR"),
    }));

    const { notifyPatientAppointment } = await import("./patientNotify");
    const result = await notifyPatientAppointment({
      email: "patient@example.com",
      phone: "+18015551234",
      providerName: "Dr. Smith",
      providerEmail: "notifications@blacklabelmedicine.com",
      patientName: "John Doe",
      appointmentDate: "Monday, March 15, 2026",
      appointmentTime: "3:00 PM",
      appointmentType: "Follow-up",
      startTime: new Date("2026-03-15T22:00:00Z"),
      endTime: new Date("2026-03-15T23:00:00Z"),
      portalUrl: "https://www.blacklabelmedicine.com/patient/schedule",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(true);

    // Verify sendEmail was called with ICS attachment
    const { sendEmail } = await import("./email");
    const sendEmailMock = sendEmail as any;
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: "appointment.ics",
            contentType: "text/calendar",
          }),
        ]),
      })
    );
  });
});
