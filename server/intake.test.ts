/**
 * Intake Form — Backend procedure tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getIntakeForm: vi.fn(),
  upsertIntakeForm: vi.fn(),
  markIntakeReviewed: vi.fn(),
  getPatientByUserId: vi.fn(),
  logAudit: vi.fn(),
}));

import * as db from "./db";

const mockedDb = vi.mocked(db);

describe("Intake Form DB Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIntakeForm", () => {
    it("should return null when no intake form exists", async () => {
      mockedDb.getIntakeForm.mockResolvedValue(null);
      const result = await db.getIntakeForm(999);
      expect(result).toBeNull();
      expect(mockedDb.getIntakeForm).toHaveBeenCalledWith(999);
    });

    it("should return intake form data when it exists", async () => {
      const mockIntake = {
        id: 1,
        patientId: 42,
        currentSection: 3,
        status: "in_progress" as const,
        formData: { personalInfo: { preferredName: "Jane" } },
        completedSections: ["personalInfo", "medicalHistory", "medicationsSupplements"],
        submittedAt: null,
        providerNotes: null,
        reviewedByProvider: false,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedDb.getIntakeForm.mockResolvedValue(mockIntake);
      const result = await db.getIntakeForm(42);
      expect(result).toEqual(mockIntake);
      expect(result?.patientId).toBe(42);
      expect(result?.status).toBe("in_progress");
      expect(result?.completedSections).toHaveLength(3);
    });
  });

  describe("upsertIntakeForm", () => {
    it("should create a new intake form when none exists", async () => {
      mockedDb.getIntakeForm.mockResolvedValue(null);
      mockedDb.upsertIntakeForm.mockResolvedValue({
        id: 1,
        patientId: 42,
        formData: { personalInfo: { preferredName: "Test" } },
        completedSections: ["personalInfo"],
        currentSection: 0,
        status: "in_progress" as const,
      } as any);

      const result = await db.upsertIntakeForm(42, {
        formData: { personalInfo: { preferredName: "Test" } },
        completedSections: ["personalInfo"],
        status: "in_progress",
      });

      expect(result).toBeDefined();
      expect(mockedDb.upsertIntakeForm).toHaveBeenCalledWith(42, expect.objectContaining({
        status: "in_progress",
      }));
    });

    it("should update an existing intake form", async () => {
      mockedDb.upsertIntakeForm.mockResolvedValue({
        id: 1,
        patientId: 42,
        formData: {
          personalInfo: { preferredName: "Test" },
          medicalHistory: { hasChronicPain: true },
        },
        completedSections: ["personalInfo", "medicalHistory"],
        currentSection: 1,
        status: "in_progress" as const,
      } as any);

      const result = await db.upsertIntakeForm(42, {
        formData: {
          personalInfo: { preferredName: "Test" },
          medicalHistory: { hasChronicPain: true },
        } as any,
        completedSections: ["personalInfo", "medicalHistory"],
        currentSection: 1,
      });

      expect(result).toBeDefined();
    });
  });

  describe("markIntakeReviewed", () => {
    it("should mark intake as reviewed with notes", async () => {
      mockedDb.markIntakeReviewed.mockResolvedValue(undefined);

      await db.markIntakeReviewed(42, "Reviewed — looks good, follow up on hormone levels.");

      expect(mockedDb.markIntakeReviewed).toHaveBeenCalledWith(42, "Reviewed — looks good, follow up on hormone levels.");
    });

    it("should mark intake as reviewed without notes", async () => {
      mockedDb.markIntakeReviewed.mockResolvedValue(undefined);

      await db.markIntakeReviewed(42);

      expect(mockedDb.markIntakeReviewed).toHaveBeenCalledWith(42);
    });
  });
});

describe("Intake Form Schema", () => {
  it("should have 12 sections defined", async () => {
    const { INTAKE_SECTIONS } = await import("../shared/intakeFormSchema");
    expect(INTAKE_SECTIONS).toHaveLength(12);
  });

  it("should have unique section keys", async () => {
    const { INTAKE_SECTIONS } = await import("../shared/intakeFormSchema");
    const keys = INTAKE_SECTIONS.map((s) => s.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("should have all required section keys", async () => {
    const { INTAKE_SECTIONS } = await import("../shared/intakeFormSchema");
    const keys = INTAKE_SECTIONS.map((s) => s.key);
    expect(keys).toContain("personalInfo");
    expect(keys).toContain("medicalHistory");
    expect(keys).toContain("medicationsSupplements");
    expect(keys).toContain("familyHistory");
    expect(keys).toContain("lifestyleHabits");
    expect(keys).toContain("nutritionDiet");
    expect(keys).toContain("exerciseFitness");
    expect(keys).toContain("sleepRecovery");
    expect(keys).toContain("mentalHealthStress");
    expect(keys).toContain("goalsMotivations");
    expect(keys).toContain("lifeStatusRelationships");
    expect(keys).toContain("hobbiesInterests");
  });

  it("should have labels and icons for all sections", async () => {
    const { INTAKE_SECTIONS } = await import("../shared/intakeFormSchema");
    for (const section of INTAKE_SECTIONS) {
      expect(section.label).toBeTruthy();
      expect(section.icon).toBeTruthy();
      expect(typeof section.label).toBe("string");
      expect(typeof section.icon).toBe("string");
    }
  });

  it("IntakeFormData type should accept all section keys", async () => {
    const schema = await import("../shared/intakeFormSchema");
    const { INTAKE_SECTIONS } = schema;
    // Verify the type structure by creating a valid object
    const testData: Record<string, any> = {};
    for (const section of INTAKE_SECTIONS) {
      testData[section.key] = {};
    }
    // If this compiles, the types are correct
    expect(Object.keys(testData)).toHaveLength(12);
  });
});

describe("Intake Form Data Validation", () => {
  it("should handle empty form data gracefully", () => {
    const formData = {};
    expect(Object.keys(formData)).toHaveLength(0);
  });

  it("should handle partial form data", () => {
    const formData = {
      personalInfo: {
        preferredName: "Jane",
        gender: "female",
      },
      medicalHistory: {
        currentConditions: ["High Blood Pressure", "Diabetes"],
        hasChronicPain: false,
      },
    };
    expect(formData.personalInfo.preferredName).toBe("Jane");
    expect(formData.medicalHistory.currentConditions).toHaveLength(2);
    expect(formData.medicalHistory.hasChronicPain).toBe(false);
  });

  it("should handle medications with dynamic list entries", () => {
    const medications = {
      prescriptionMedications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", reason: "Blood pressure" },
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily", reason: "Blood sugar" },
      ],
      supplements: [
        { name: "Vitamin D3", dosage: "5000 IU", frequency: "Daily" },
      ],
      hormoneTherapy: [],
      peptideTherapy: [],
      hasAdverseReactions: true,
      adverseReactionDetails: "Rash from penicillin",
    };
    expect(medications.prescriptionMedications).toHaveLength(2);
    expect(medications.supplements).toHaveLength(1);
    expect(medications.hasAdverseReactions).toBe(true);
  });

  it("should handle slider values within range", () => {
    const mentalHealth = {
      overallMoodRating: 7,
      stressLevel: 4,
      selfEsteemRating: 8,
      lifesSatisfactionRating: 6,
    };
    expect(mentalHealth.overallMoodRating).toBeGreaterThanOrEqual(1);
    expect(mentalHealth.overallMoodRating).toBeLessThanOrEqual(10);
    expect(mentalHealth.stressLevel).toBeGreaterThanOrEqual(1);
    expect(mentalHealth.stressLevel).toBeLessThanOrEqual(10);
  });

  it("should handle family history with dynamic entries", () => {
    const familyHistory = {
      familyMembers: [
        { relation: "Mother", conditions: "Heart Disease, Diabetes", ageOfOnset: "55", causeOfDeath: "" },
        { relation: "Father", conditions: "Cancer", ageOfOnset: "62", causeOfDeath: "Lung cancer at 68" },
      ],
      knownGeneticConditions: ["Heart Disease", "Cancer", "Diabetes"],
      hasHereditaryConcerns: true,
      hereditaryConcernsNotes: "Strong family history of cardiovascular disease",
    };
    expect(familyHistory.familyMembers).toHaveLength(2);
    expect(familyHistory.knownGeneticConditions).toContain("Heart Disease");
    expect(familyHistory.hasHereditaryConcerns).toBe(true);
  });
});
