import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Email module tests ──────────────────────────

describe("Email module", () => {
  it("inviteEmailHtml generates valid HTML with invite URL", async () => {
    const { inviteEmailHtml } = await import("./email");
    const html = inviteEmailHtml({
      providerName: "Dr. Smith",
      inviteUrl: "https://example.com/invite?token=abc123",
    });
    expect(html).toContain("Dr. Smith");
    expect(html).toContain("https://example.com/invite?token=abc123");
    expect(html).toContain("Accept Invitation");
    expect(html).toContain("Black Label Medicine");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("newMessageEmailHtml truncates long messages", async () => {
    const { newMessageEmailHtml } = await import("./email");
    const longMessage = "A".repeat(300);
    const html = newMessageEmailHtml({
      providerName: "Dr. Smith",
      messagePreview: longMessage,
      portalUrl: "https://example.com/patient/messages",
    });
    expect(html).toContain("…");
    expect(html).not.toContain("A".repeat(300));
    expect(html).toContain("View Message");
  });

  it("appointmentEmailHtml includes all details", async () => {
    const { appointmentEmailHtml } = await import("./email");
    const html = appointmentEmailHtml({
      providerName: "Dr. Smith",
      appointmentDate: "Monday, February 20, 2026",
      appointmentTime: "9:00 AM",
      appointmentType: "Follow-up",
      portalUrl: "https://example.com/patient/schedule",
    });
    expect(html).toContain("Monday, February 20, 2026");
    expect(html).toContain("9:00 AM");
    expect(html).toContain("Follow-up");
    expect(html).toContain("Dr. Smith");
    expect(html).toContain("View in Portal");
  });

  it("notificationEmailHtml generates generic notification", async () => {
    const { notificationEmailHtml } = await import("./email");
    const html = notificationEmailHtml({
      title: "Protocol Updated",
      body: "Your Low-Carb Diet protocol has been updated.",
      portalUrl: "https://example.com/patient",
    });
    expect(html).toContain("Protocol Updated");
    expect(html).toContain("Low-Carb Diet");
    expect(html).toContain("Open Portal");
  });

  it("sendEmail returns false when RESEND_API_KEY is not set", async () => {
    // Reset module to pick up empty env
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("./email");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });
    expect(result).toBe(false);
    vi.unstubAllEnvs();
  });
});

// ─── SMS module tests ──────────────────────────

describe("SMS module", () => {
  it("inviteSmsBody generates concise invite text", async () => {
    const { inviteSmsBody } = await import("./sms");
    const body = inviteSmsBody({
      providerName: "Dr. Smith",
      inviteUrl: "https://example.com/invite?token=abc123",
    });
    expect(body).toContain("Dr. Smith");
    expect(body).toContain("https://example.com/invite?token=abc123");
    expect(body).toContain("Black Label Medicine");
    expect(body.length).toBeLessThan(320); // SMS limit
  });

  it("newMessageSmsBody truncates long messages", async () => {
    const { newMessageSmsBody } = await import("./sms");
    const body = newMessageSmsBody({
      providerName: "Dr. Smith",
      messagePreview: "B".repeat(200),
    });
    expect(body).toContain("…");
    expect(body.length).toBeLessThan(320);
  });

  it("appointmentReminderSmsBody includes all details", async () => {
    const { appointmentReminderSmsBody } = await import("./sms");
    const body = appointmentReminderSmsBody({
      providerName: "Dr. Smith",
      appointmentDate: "Feb 20",
      appointmentTime: "9:00 AM",
      appointmentType: "Follow-up",
    });
    expect(body).toContain("Dr. Smith");
    expect(body).toContain("Feb 20");
    expect(body).toContain("9:00 AM");
    expect(body).toContain("Follow-up");
  });

  it("genericNotificationSmsBody truncates long body", async () => {
    const { genericNotificationSmsBody } = await import("./sms");
    const body = genericNotificationSmsBody({
      title: "Update",
      body: "C".repeat(200),
    });
    expect(body).toContain("…");
    expect(body.length).toBeLessThan(320);
  });

  it("sendSms returns false when Twilio credentials are not set", async () => {
    vi.resetModules();
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_PHONE_NUMBER", "");
    const { sendSms } = await import("./sms");
    const result = await sendSms({
      to: "+18015551234",
      body: "Test",
    });
    expect(result).toBe(false);
    vi.unstubAllEnvs();
  });

  it("sendSms rejects invalid phone number format", async () => {
    vi.resetModules();
    vi.stubEnv("TWILIO_ACCOUNT_SID", "AC_test");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "test_token");
    vi.stubEnv("TWILIO_PHONE_NUMBER", "+15005550006");
    const { sendSms } = await import("./sms");
    const result = await sendSms({
      to: "not-a-phone-number",
      body: "Test",
    });
    expect(result).toBe(false);
    vi.unstubAllEnvs();
  });
});

// ─── Patient notify module tests ──────────────────────────

describe("Patient notify module", () => {
  it("notifyPatientInvite sends both email and SMS when both available", async () => {
    vi.resetModules();
    // Mock the email and sms modules
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      inviteEmailHtml: vi.fn().mockReturnValue("<html>invite</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      inviteSmsBody: vi.fn().mockReturnValue("SMS invite"),
    }));

    const { notifyPatientInvite } = await import("./patientNotify");
    const result = await notifyPatientInvite({
      email: "patient@example.com",
      phone: "+18015551234",
      providerName: "Dr. Smith",
      inviteUrl: "https://example.com/invite?token=abc",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(true);
  });

  it("notifyPatientInvite handles missing phone gracefully", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      inviteEmailHtml: vi.fn().mockReturnValue("<html>invite</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      inviteSmsBody: vi.fn().mockReturnValue("SMS invite"),
    }));

    const { notifyPatientInvite } = await import("./patientNotify");
    const result = await notifyPatientInvite({
      email: "patient@example.com",
      phone: null,
      providerName: "Dr. Smith",
      inviteUrl: "https://example.com/invite?token=abc",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(false);
  });

  it("notifyPatientNewMessage sends to both channels", async () => {
    vi.resetModules();
    vi.doMock("./email", () => ({
      sendEmail: vi.fn().mockResolvedValue(true),
      newMessageEmailHtml: vi.fn().mockReturnValue("<html>message</html>"),
    }));
    vi.doMock("./sms", () => ({
      sendSms: vi.fn().mockResolvedValue(true),
      newMessageSmsBody: vi.fn().mockReturnValue("SMS message"),
    }));

    const { notifyPatientNewMessage } = await import("./patientNotify");
    const result = await notifyPatientNewMessage({
      email: "patient@example.com",
      phone: "+18015551234",
      providerName: "Dr. Smith",
      messagePreview: "Hello, how are you feeling?",
      portalUrl: "https://example.com/patient/messages",
    });

    expect(result.emailSent).toBe(true);
    expect(result.smsSent).toBe(true);
  });
});
