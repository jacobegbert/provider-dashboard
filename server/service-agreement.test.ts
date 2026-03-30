/**
 * Tests for the CellRx Concierge Service Agreement page
 * Validates that the page component exists, route is registered,
 * navigation entry is present, and content is correct.
 */
import { describe, it, expect } from "vitest";

describe("Patient Service Agreement Page", () => {
  describe("PatientServiceAgreement component", () => {
    it("should export a default component", async () => {
      const mod = await import(
        "../client/src/pages/patient/PatientServiceAgreement"
      );
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe("function");
    });
  });

  describe("Route registration in App.tsx", () => {
    it("should include /patient/service-agreement route", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain("/patient/service-agreement");
      expect(appContent).toContain("PatientServiceAgreement");
    });

    it("should import PatientServiceAgreement component", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain(
        'import PatientServiceAgreement from "./pages/patient/PatientServiceAgreement"'
      );
    });
  });

  describe("Navigation entry in PatientLayout", () => {
    it("should include Service Agreement in sidebar tabs", async () => {
      const fs = await import("fs");
      const layoutContent = fs.readFileSync(
        "client/src/components/PatientLayout.tsx",
        "utf-8"
      );
      expect(layoutContent).toContain("/patient/service-agreement");
      expect(layoutContent).toContain("Service Agreement");
    });

    it("should use ScrollText icon for Service Agreement", async () => {
      const fs = await import("fs");
      const layoutContent = fs.readFileSync(
        "client/src/components/PatientLayout.tsx",
        "utf-8"
      );
      expect(layoutContent).toContain("ScrollText");
      expect(layoutContent).toMatch(
        /icon:\s*ScrollText/
      );
    });
  });

  describe("Page content accuracy", () => {
    it("should contain all 9 service descriptions", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("Direct Physician Access");
      expect(content).toContain("Comprehensive Lab Panels");
      expect(content).toContain("Medical Oversight");
      expect(content).toContain("Hormone Therapy Management");
      expect(content).toContain("Peptide Therapy Protocols");
      expect(content).toContain("Nutritional Guidance");
      expect(content).toContain("Training & Performance Guidance");
      expect(content).toContain("Advanced Biologics (Elevated Package)");
      expect(content).toContain("Prescription Management");
    });

    it("should contain correct pricing information", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("$28,000");
      expect(content).toContain("$48,000");
      expect(content).toContain("$40,000");
      expect(content).toContain("$72,000");
    });

    it("should contain Dr. Egbert's contact information", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("Dr. Jacob Egbert, DO");
      expect(content).toContain("Medical Director | CellRx");
      expect(content).toContain("jacob@cellrx.bio");
      expect(content).toContain("435-938-8657");
    });

    it("should contain the partnership philosophy section", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("Partnership & Philosophy");
      expect(content).toContain("true medical partnership");
    });

    it("should include a PDF download link", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("Download Full Agreement (PDF)");
      expect(content).toContain("CellRxConciergeServiceAgreement");
    });

    it("should mark Elevated Package items distinctly", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientServiceAgreement.tsx",
        "utf-8"
      );
      expect(content).toContain("elevated: true");
      expect(content).toContain("Elevated Package");
      expect(content).toContain("Includes Advanced Biologics");
    });
  });
});
