import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  newMessageSmsBody,
  appointmentReminderSmsBody,
  genericNotificationSmsBody,
  protocolAssignedSmsBody,
  protocolUpdatedSmsBody,
  inviteSmsBody,
} from "./sms";

describe("normalizePhone", () => {
  it("normalizes a 10-digit US number", () => {
    expect(normalizePhone("8016886538")).toBe("+18016886538");
  });

  it("normalizes a formatted US number with dashes", () => {
    expect(normalizePhone("801-688-6538")).toBe("+18016886538");
  });

  it("normalizes a formatted US number with parens", () => {
    expect(normalizePhone("(801) 688-6538")).toBe("+18016886538");
  });

  it("normalizes an 11-digit US number", () => {
    expect(normalizePhone("18016886538")).toBe("+18016886538");
  });

  it("keeps already valid E.164 format", () => {
    expect(normalizePhone("+18016886538")).toBe("+18016886538");
  });

  it("returns null for empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for too-short numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
  });
});

describe("SMS templates", () => {
  it("newMessageSmsBody includes the portal URL", () => {
    const body = newMessageSmsBody({
      providerName: "Dr. Egbert",
      messagePreview: "Hi, how are you feeling today?",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Dr. Egbert");
    expect(body).toContain("Hi, how are you feeling today?");
    expect(body).toContain("https://www.blacklabelmedicine.com");
  });

  it("newMessageSmsBody truncates long previews", () => {
    const longMessage = "A".repeat(150);
    const body = newMessageSmsBody({
      providerName: "Dr. Egbert",
      messagePreview: longMessage,
    });
    expect(body).toContain("…");
    expect(body).not.toContain("A".repeat(150));
  });

  it("appointmentReminderSmsBody includes appointment details", () => {
    const body = appointmentReminderSmsBody({
      providerName: "Dr. Egbert",
      appointmentDate: "March 15, 2026",
      appointmentTime: "2:00 PM",
      appointmentType: "Follow-Up",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Dr. Egbert");
    expect(body).toContain("March 15, 2026");
    expect(body).toContain("2:00 PM");
    expect(body).toContain("Follow-Up");
  });

  it("genericNotificationSmsBody includes title and body", () => {
    const body = genericNotificationSmsBody({
      title: "Lab Results Ready",
      body: "Your latest lab results are now available for review.",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Lab Results Ready");
    expect(body).toContain("lab results");
  });

  it("protocolAssignedSmsBody includes portal URL", () => {
    const body = protocolAssignedSmsBody({
      providerName: "Dr. Egbert",
      protocolName: "Hormone Optimization",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Dr. Egbert");
    expect(body).toContain("Hormone Optimization");
    expect(body).toContain("https://www.blacklabelmedicine.com");
  });

  it("protocolUpdatedSmsBody includes portal URL", () => {
    const body = protocolUpdatedSmsBody({
      providerName: "Dr. Egbert",
      protocolName: "Peptide Therapy",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Peptide Therapy");
    expect(body).toContain("https://www.blacklabelmedicine.com");
  });

  it("inviteSmsBody includes invite URL", () => {
    const body = inviteSmsBody({
      providerName: "Dr. Egbert",
      inviteUrl: "https://www.blacklabelmedicine.com/invite/abc123",
    });
    expect(body).toContain("Black Label Medicine");
    expect(body).toContain("Dr. Egbert");
    expect(body).toContain("https://www.blacklabelmedicine.com/invite/abc123");
  });
});
