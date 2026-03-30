/**
 * Tests for patient portal pages: Notifications, Privacy & Security, Health Data
 * Validates that routes exist and the notification system functions correctly.
 */
import { describe, it, expect, vi } from "vitest";

describe("Patient Portal Pages", () => {
  describe("PatientNotifications page", () => {
    it("should export a default component", async () => {
      // Verify the module exists and exports a default function
      const mod = await import("../client/src/pages/patient/PatientNotifications");
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe("function");
    });
  });

  describe("PatientPrivacy page", () => {
    it("should export a default component", async () => {
      const mod = await import("../client/src/pages/patient/PatientPrivacy");
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe("function");
    });
  });

  describe("Patient routes in App.tsx", () => {
    it("should include /patient/notifications route", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain('/patient/notifications');
      expect(appContent).toContain('PatientNotifications');
    });

    it("should include /patient/privacy route", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain('/patient/privacy');
      expect(appContent).toContain('PatientPrivacy');
    });

    it("should import PatientNotifications and PatientPrivacy", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain('import PatientNotifications from');
      expect(appContent).toContain('import PatientPrivacy from');
    });
  });

  describe("PatientProfile settings links", () => {
    it("should link to /patient/notifications", async () => {
      const fs = await import("fs");
      const profileContent = fs.readFileSync("client/src/pages/patient/PatientProfile.tsx", "utf-8");
      expect(profileContent).toContain('href: "/patient/notifications"');
    });

    it("should link to /patient/privacy", async () => {
      const fs = await import("fs");
      const profileContent = fs.readFileSync("client/src/pages/patient/PatientProfile.tsx", "utf-8");
      expect(profileContent).toContain('href: "/patient/privacy"');
    });

    it("should link to /patient/vitals for Health Data", async () => {
      const fs = await import("fs");
      const profileContent = fs.readFileSync("client/src/pages/patient/PatientProfile.tsx", "utf-8");
      expect(profileContent).toContain('href: "/patient/vitals"');
    });

    it("should use Link component instead of plain button", async () => {
      const fs = await import("fs");
      const profileContent = fs.readFileSync("client/src/pages/patient/PatientProfile.tsx", "utf-8");
      expect(profileContent).toContain('import { Link } from "wouter"');
      // Should not have dead buttons anymore
      expect(profileContent).not.toMatch(/<button[^>]*>\s*<div[^>]*>\s*<item\.icon/);
    });

    it("should show unread notification count badge", async () => {
      const fs = await import("fs");
      const profileContent = fs.readFileSync("client/src/pages/patient/PatientProfile.tsx", "utf-8");
      expect(profileContent).toContain('unreadCount');
      expect(profileContent).toContain('notification.unreadCount.useQuery');
    });
  });

  describe("Notification permission banner", () => {
    it("should include notification permission UI in PatientNotifications", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync("client/src/pages/patient/PatientNotifications.tsx", "utf-8");
      expect(content).toContain("Enable Push Notifications");
      expect(content).toContain("Notifications Blocked");
      expect(content).toContain("Browser notifications are enabled");
      expect(content).toContain("requestPermission");
    });
  });
});
