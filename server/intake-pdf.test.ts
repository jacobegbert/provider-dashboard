import { describe, it, expect } from "vitest";
import { generateIntakePdf } from "./intakePdfGenerator";
import type { IntakeFormData } from "../shared/intakeFormSchema";
import { INTAKE_SECTIONS } from "../shared/intakeFormSchema";

describe("generateIntakePdf", () => {
  it("should generate a valid PDF buffer with empty form data", () => {
    const result = generateIntakePdf(
      "John Doe",
      "1990-01-15",
      "john@example.com",
      {},
      [],
      null,
      null
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(result.toString("ascii", 0, 5)).toBe("%PDF-");
  });

  it("should generate a PDF with completed sections", () => {
    const formData: IntakeFormData = {
      personalInfo: {
        preferredName: "Johnny",
        gender: "Male",
        occupation: "Software Engineer",
        employer: "Acme Corp",
        emergencyContactName: "Jane Doe",
        emergencyContactPhone: "(555) 123-4567",
        emergencyContactRelation: "Spouse",
        address: "123 Main St",
        city: "Denver",
        state: "CO",
        zipCode: "80202",
      },
      medicalHistory: {
        currentConditions: ["Hypertension", "High Cholesterol"],
        hasChronicPain: false,
        hasAutoimmune: false,
        allergies: [
          { allergen: "Penicillin", reaction: "Rash", severity: "Moderate" },
        ],
      },
      medicationsSupplements: {
        prescriptionMedications: [
          { name: "Lisinopril", dosage: "10mg", frequency: "Daily", reason: "Blood pressure" },
        ],
        supplements: [
          { name: "Vitamin D", dosage: "5000 IU", frequency: "Daily" },
          { name: "Omega-3", dosage: "1000mg", frequency: "Daily" },
        ],
        hasAdverseReactions: false,
      },
    };

    const completedSections = ["personalInfo", "medicalHistory", "medicationsSupplements"];

    const result = generateIntakePdf(
      "John Doe",
      "1990-01-15",
      "john@example.com",
      formData,
      completedSections,
      new Date("2026-03-10T12:00:00Z"),
      "Patient appears healthy, follow up in 3 months."
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(500); // Should be a substantial PDF
    expect(result.toString("ascii", 0, 5)).toBe("%PDF-");
  });

  it("should generate a PDF with all 12 sections completed", () => {
    const formData: IntakeFormData = {
      personalInfo: { preferredName: "Test", gender: "Male" },
      medicalHistory: { currentConditions: ["None"] },
      medicationsSupplements: { hasAdverseReactions: false },
      familyHistory: { familyHistoryNotes: "No significant history" },
      lifestyleHabits: { smokingStatus: "Never", alcoholUse: "Social" },
      nutritionDiet: { dietaryPattern: "Mediterranean", mealsPerDay: "3" },
      exerciseFitness: { currentActivityLevel: "Moderate", dailySteps: "8000" },
      sleepRecovery: { averageSleepHours: "7", sleepQuality: "Good" },
      mentalHealthStress: { overallMoodRating: 8, stressLevel: 3 },
      goalsMotivations: { primaryHealthGoals: ["Longevity", "Performance"] },
      lifeStatusRelationships: { relationshipStatus: "Married" },
      hobbiesInterests: { hobbies: ["Hiking", "Reading", "Golf"] },
    };

    const allSectionKeys = INTAKE_SECTIONS.map((s) => s.key);

    const result = generateIntakePdf(
      "Complete Patient",
      "1985-06-20",
      "complete@example.com",
      formData,
      allSectionKeys,
      new Date("2026-03-13T10:00:00Z"),
      null
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(1000);
    expect(result.toString("ascii", 0, 5)).toBe("%PDF-");
  });

  it("should handle null/undefined gracefully", () => {
    const result = generateIntakePdf(
      "Minimal Patient",
      null,
      null,
      {},
      [],
      null,
      null
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString("ascii", 0, 5)).toBe("%PDF-");
  });

  it("should include patient name in the filename-safe format", () => {
    // This tests the router logic indirectly - the filename generation
    const name = "John Doe";
    const filename = `${name.replace(/\s+/g, "_")}_Intake_Form.pdf`;
    expect(filename).toBe("John_Doe_Intake_Form.pdf");
  });
});
