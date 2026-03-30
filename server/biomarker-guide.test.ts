/**
 * Tests for the Biomarker Tracking Guide page
 * Validates component exists, route is registered, navigation links are present,
 * and all content sections are accurate.
 */
import { describe, it, expect } from "vitest";

describe("Patient Biomarker Guide Page", () => {
  describe("PatientBiomarkerGuide component", () => {
    it("should export a default component", async () => {
      const mod = await import(
        "../client/src/pages/patient/PatientBiomarkerGuide"
      );
      expect(mod.default).toBeDefined();
      expect(typeof mod.default).toBe("function");
    });
  });

  describe("Route registration in App.tsx", () => {
    it("should include /patient/biomarker-guide route", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain("/patient/biomarker-guide");
      expect(appContent).toContain("PatientBiomarkerGuide");
    });

    it("should import PatientBiomarkerGuide component", async () => {
      const fs = await import("fs");
      const appContent = fs.readFileSync("client/src/App.tsx", "utf-8");
      expect(appContent).toContain(
        'import PatientBiomarkerGuide from "./pages/patient/PatientBiomarkerGuide"'
      );
    });
  });

  describe("Navigation links", () => {
    it("should have a Guide link on the Biomarkers page (PatientVitals)", async () => {
      const fs = await import("fs");
      const vitalsContent = fs.readFileSync(
        "client/src/pages/patient/PatientVitals.tsx",
        "utf-8"
      );
      expect(vitalsContent).toContain("/patient/biomarker-guide");
      expect(vitalsContent).toContain("Guide");
      expect(vitalsContent).toContain("BookOpen");
    });

    it("should have a Biomarker Guide card on the Resources page", async () => {
      const fs = await import("fs");
      const resourcesContent = fs.readFileSync(
        "client/src/pages/patient/PatientResources.tsx",
        "utf-8"
      );
      expect(resourcesContent).toContain("/patient/biomarker-guide");
      expect(resourcesContent).toContain("Biomarker Tracking Guide");
    });
  });

  describe("Page content — sections", () => {
    it("should contain the What Are Biomarkers section", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("What Are Biomarkers?");
      expect(content).toContain("measurable indicators");
    });

    it("should list all three built-in metrics", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain('"Weight"');
      expect(content).toContain('"Height"');
      expect(content).toContain('"Body Fat"');
      expect(content).toContain('"lbs"');
      expect(content).toContain('"in"');
    });

    it("should contain all 6 step-by-step instructions", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Navigate to Biomarkers");
      expect(content).toContain("Add a Custom Metric");
      expect(content).toContain("Log Your First Entry");
      expect(content).toContain("Review Your History");
      expect(content).toContain("Edit or Delete Entries");
      expect(content).toContain("Remove a Custom Metric");
    });

    it("should contain helpful tips in the steps", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Choose clear, specific names");
      expect(content).toContain("Adding notes helps your provider");
      expect(content).toContain("edit rather than delete");
      expect(content).toContain("Built-in metrics (Weight, Height, Body Fat) cannot be removed");
    });

    it("should contain all 6 custom metric examples", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Resting Heart Rate");
      expect(content).toContain("Blood Pressure (Systolic)");
      expect(content).toContain("Fasting Blood Glucose");
      expect(content).toContain("Body Temperature");
      expect(content).toContain("Waist Circumference");
      expect(content).toContain("Sleep Duration");
    });

    it("should contain all 6 best practices", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Measure at the Same Time");
      expect(content).toContain("Be Consistent with Conditions");
      expect(content).toContain("Log Regularly");
      expect(content).toContain("Use Notes Strategically");
      expect(content).toContain("Discuss Trends with Your Provider");
      expect(content).toContain("Track What Matters to You");
    });

    it("should contain the provider visibility note", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Your Provider Can See Your Data");
      expect(content).toContain("visible to Dr. Egbert");
      expect(content).toContain("Biomarkers tab");
    });

    it("should have a CTA linking back to the Biomarkers page", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "client/src/pages/patient/PatientBiomarkerGuide.tsx",
        "utf-8"
      );
      expect(content).toContain("Go to Biomarkers");
      expect(content).toContain('href="/patient/vitals"');
    });
  });
});
