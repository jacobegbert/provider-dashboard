/**
 * Intake Form PDF Generator
 * Generates a professionally formatted PDF of all patient intake form data
 * Uses jsPDF for server-side PDF generation
 */
import { jsPDF } from "jspdf";
import type { IntakeFormData } from "../shared/intakeFormSchema";
import { INTAKE_SECTIONS } from "../shared/intakeFormSchema";

// ─── Helpers ───

function renderValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "\u2014";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "\u2014";
    if (typeof val[0] === "string") return val.join(", ");
    return val
      .map((item) =>
        typeof item === "object"
          ? Object.entries(item)
              .filter(([, v]) => v)
              .map(([k, v]) => `${humanizeKey(k)}: ${v}`)
              .join(" | ")
          : String(item)
      )
      .join("; ");
  }
  return String(val);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ─── Section Field Definitions ───

const sectionFields: Record<string, { label: string; key: string; isGroup?: boolean; groupFields?: string[] }[]> = {
  personalInfo: [
    { label: "Preferred Name", key: "preferredName" },
    { label: "Gender", key: "gender" },
    { label: "Pronouns", key: "pronouns" },
    { label: "Marital Status", key: "maritalStatus" },
    { label: "Occupation", key: "occupation" },
    { label: "Employer", key: "employer" },
    { label: "Emergency Contact Name", key: "emergencyContactName" },
    { label: "Emergency Contact Phone", key: "emergencyContactPhone" },
    { label: "Emergency Contact Relation", key: "emergencyContactRelation" },
    { label: "Primary Care Physician", key: "primaryCarePhysician" },
    { label: "Referral Source", key: "referralSource" },
    { label: "Insurance Provider", key: "insuranceProvider" },
    { label: "Insurance Policy Number", key: "insurancePolicyNumber" },
    { label: "Preferred Pharmacy", key: "preferredPharmacy" },
    { label: "Address", key: "address" },
    { label: "City", key: "city" },
    { label: "State", key: "state" },
    { label: "Zip Code", key: "zipCode" },
  ],
  medicalHistory: [
    { label: "Current Conditions", key: "currentConditions" },
    { label: "Past Conditions", key: "pastConditions" },
    { label: "Surgeries", key: "surgeries", isGroup: true, groupFields: ["procedure", "year", "notes"] },
    { label: "Hospitalizations", key: "hospitalizations", isGroup: true, groupFields: ["reason", "year", "notes"] },
    { label: "Allergies", key: "allergies", isGroup: true, groupFields: ["allergen", "reaction", "severity"] },
    { label: "Immunizations Up To Date", key: "immunizationsUpToDate" },
    { label: "Immunization Notes", key: "immunizationNotes" },
    { label: "Chronic Pain", key: "hasChronicPain" },
    { label: "Chronic Pain Details", key: "chronicPainDescription" },
    { label: "Autoimmune", key: "hasAutoimmune" },
    { label: "Autoimmune Details", key: "autoimmuneDescription" },
    { label: "Hormone Issues", key: "hasHormoneIssues" },
    { label: "Hormone Details", key: "hormoneDescription" },
    { label: "Cancer History", key: "hasCancer" },
    { label: "Cancer Details", key: "cancerDescription" },
    { label: "Heart Condition", key: "hasHeartCondition" },
    { label: "Heart Details", key: "heartConditionDescription" },
    { label: "Diabetes", key: "hasDiabetes" },
    { label: "Diabetes Type", key: "diabetesType" },
    { label: "Thyroid Issues", key: "hasThyroidIssue" },
    { label: "Thyroid Details", key: "thyroidDescription" },
    { label: "GI Issues", key: "hasGIIssues" },
    { label: "GI Details", key: "giDescription" },
    { label: "Recent Lab Work", key: "recentLabWork" },
    { label: "Additional Notes", key: "additionalMedicalNotes" },
  ],
  medicationsSupplements: [
    { label: "Prescription Medications", key: "prescriptionMedications", isGroup: true, groupFields: ["name", "dosage", "frequency", "prescribedBy", "reason"] },
    { label: "Over-the-Counter Medications", key: "overTheCounterMeds", isGroup: true, groupFields: ["name", "dosage", "frequency"] },
    { label: "Supplements", key: "supplements", isGroup: true, groupFields: ["name", "dosage", "frequency"] },
    { label: "Hormone Therapy", key: "hormoneTherapy", isGroup: true, groupFields: ["name", "dosage", "frequency", "prescribedBy"] },
    { label: "Peptide Therapy", key: "peptideTherapy", isGroup: true, groupFields: ["name", "dosage", "frequency"] },
    { label: "Recently Discontinued", key: "recentlyDiscontinued", isGroup: true, groupFields: ["name", "reason", "stopDate"] },
    { label: "Adverse Reactions", key: "hasAdverseReactions" },
    { label: "Adverse Reaction Details", key: "adverseReactionDetails" },
  ],
  familyHistory: [
    { label: "Family Members", key: "familyMembers", isGroup: true, groupFields: ["relation", "conditions", "ageOfOnset", "deceased", "causeOfDeath", "ageAtDeath"] },
    { label: "Family History Notes", key: "familyHistoryNotes" },
    { label: "Known Genetic Conditions", key: "knownGeneticConditions" },
    { label: "Hereditary Concerns", key: "hasHereditaryConcerns" },
    { label: "Hereditary Concerns Notes", key: "hereditaryConcernsNotes" },
  ],
  lifestyleHabits: [
    { label: "Smoking Status", key: "smokingStatus" },
    { label: "Smoking Details", key: "smokingDetails" },
    { label: "Alcohol Use", key: "alcoholUse" },
    { label: "Alcohol Frequency", key: "alcoholFrequency" },
    { label: "Cannabis Use", key: "cannabisUse" },
    { label: "Cannabis Details", key: "cannabisDetails" },
    { label: "Recreational Drug Use", key: "recreationalDrugUse" },
    { label: "Recreational Drug Details", key: "recreationalDrugDetails" },
    { label: "Caffeine Intake", key: "caffeineIntake" },
    { label: "Daily Water Intake", key: "waterIntakeDaily" },
    { label: "Screen Time", key: "screenTimeDaily" },
    { label: "Sun Exposure", key: "sunExposure" },
    { label: "Sunscreen Use", key: "sunscreenUse" },
    { label: "Sauna Use", key: "saunaUse" },
    { label: "Cold Exposure", key: "coldExposure" },
    { label: "Meditation Practice", key: "meditationPractice" },
    { label: "Breathwork Practice", key: "breathworkPractice" },
    { label: "Journaling", key: "journaling" },
    { label: "Typical Day", key: "typicalDayDescription" },
  ],
  nutritionDiet: [
    { label: "Dietary Pattern", key: "dietaryPattern" },
    { label: "Dietary Pattern (Other)", key: "dietaryPatternOther" },
    { label: "Meals Per Day", key: "mealsPerDay" },
    { label: "Meal Prep Method", key: "mealPrepMethod" },
    { label: "Food Allergies", key: "foodAllergies" },
    { label: "Food Intolerances", key: "foodIntolerances" },
    { label: "Foods Enjoyed", key: "foodsEnjoy" },
    { label: "Foods Avoided", key: "foodsAvoid" },
    { label: "Typical Breakfast", key: "typicalBreakfast" },
    { label: "Typical Lunch", key: "typicalLunch" },
    { label: "Typical Dinner", key: "typicalDinner" },
    { label: "Typical Snacks", key: "typicalSnacks" },
    { label: "Eating Out Frequency", key: "eatingOutFrequency" },
    { label: "Protein Intake", key: "proteinIntakeEstimate" },
    { label: "Vegetable Intake", key: "vegetableIntakeEstimate" },
    { label: "Processed Food Intake", key: "processedFoodIntake" },
    { label: "Sugar Intake", key: "sugarIntake" },
    { label: "Nutrition Goals", key: "nutritionGoals" },
    { label: "Eating Disorder History", key: "hasEatingDisorderHistory" },
    { label: "Eating Disorder Notes", key: "eatingDisorderNotes" },
  ],
  exerciseFitness: [
    { label: "Activity Level", key: "currentActivityLevel" },
    { label: "Exercise Frequency", key: "exerciseFrequency" },
    { label: "Exercise Types", key: "exerciseTypes" },
    { label: "Exercise Types (Other)", key: "exerciseTypesOther" },
    { label: "Strength Training Frequency", key: "strengthTrainingFrequency" },
    { label: "Cardio Frequency", key: "cardioFrequency" },
    { label: "Flexibility/Mobility", key: "flexibilityMobility" },
    { label: "VO2 Max Estimate", key: "vo2MaxEstimate" },
    { label: "Recent Fitness Test", key: "recentFitnessTest" },
    { label: "Physical Limitations", key: "physicalLimitations" },
    { label: "Injury History", key: "injuryHistory" },
    { label: "Fitness Goals", key: "fitnessGoals" },
    { label: "Personal Trainer", key: "hasPersonalTrainer" },
    { label: "Trainer Details", key: "trainerDetails" },
    { label: "Sports Participation", key: "sportsParticipation" },
    { label: "Daily Steps", key: "dailySteps" },
    { label: "Sedentary Hours", key: "sedentaryHours" },
  ],
  sleepRecovery: [
    { label: "Average Sleep Hours", key: "averageSleepHours" },
    { label: "Bedtime", key: "bedtime" },
    { label: "Wake Time", key: "wakeTime" },
    { label: "Sleep Quality", key: "sleepQuality" },
    { label: "Time to Fall Asleep", key: "fallAsleepTime" },
    { label: "Night Wakings", key: "nightWakings" },
    { label: "Sleep Aids", key: "sleepAids" },
    { label: "Snoring", key: "hasSnoring" },
    { label: "Sleep Apnea", key: "hasSleepApnea" },
    { label: "Sleep Apnea Treatment", key: "sleepApneaTreatment" },
    { label: "Uses Sleep Tracker", key: "useSleepTracker" },
    { label: "Sleep Tracker Type", key: "sleepTrackerType" },
    { label: "Nap Frequency", key: "napFrequency" },
    { label: "Dream Recall", key: "dreamRecall" },
    { label: "Sleep Environment", key: "sleepEnvironment" },
    { label: "Blue Light Exposure", key: "blueLight" },
    { label: "Sleep Goals", key: "sleepGoals" },
  ],
  mentalHealthStress: [
    { label: "Overall Mood Rating", key: "overallMoodRating" },
    { label: "Stress Level", key: "stressLevel" },
    { label: "Primary Stressors", key: "primaryStressors" },
    { label: "Primary Stressors (Other)", key: "primaryStressorsOther" },
    { label: "Anxiety Frequency", key: "anxietyFrequency" },
    { label: "Depression History", key: "depressionHistory" },
    { label: "Currently in Therapy", key: "currentTherapy" },
    { label: "Therapist Name", key: "therapistName" },
    { label: "Therapy Type", key: "therapyType" },
    { label: "Psychiatric Medications", key: "psychiatricMedications" },
    { label: "Trauma History", key: "hasTraumaHistory" },
    { label: "Trauma Notes", key: "traumaNotes" },
    { label: "Coping Strategies", key: "copingStrategies" },
    { label: "Coping Strategies (Other)", key: "copingStrategiesOther" },
    { label: "Mindfulness Practice", key: "mindfulnessPractice" },
    { label: "Gratitude Practice", key: "gratitudePractice" },
    { label: "Social Connection Quality", key: "socialConnectionQuality" },
    { label: "Loneliness Feelings", key: "lonelinessFeelings" },
    { label: "Self-Esteem Rating", key: "selfEsteemRating" },
    { label: "Life Satisfaction Rating", key: "lifesSatisfactionRating" },
    { label: "Mental Health Goals", key: "mentalHealthGoals" },
  ],
  goalsMotivations: [
    { label: "Primary Health Goals", key: "primaryHealthGoals" },
    { label: "Primary Health Goals (Other)", key: "primaryHealthGoalsOther" },
    { label: "Top Three Goals", key: "topThreeGoals" },
    { label: "Biggest Health Concern", key: "biggestHealthConcern" },
    { label: "Optimal Health Vision", key: "whatDoesOptimalHealthLookLike" },
    { label: "Motivation Level", key: "motivationLevel" },
    { label: "Readiness to Change", key: "readinessToChange" },
    { label: "Previous Attempts", key: "previousAttempts" },
    { label: "Barriers", key: "barriers" },
    { label: "6-Month Goal", key: "idealOutcomeIn6Months" },
    { label: "1-Year Goal", key: "idealOutcomeIn1Year" },
    { label: "5-Year Goal", key: "idealOutcomeIn5Years" },
    { label: "Willing to Invest", key: "willingToInvest" },
    { label: "Commitment Level", key: "commitmentLevel" },
    { label: "Accountability Preference", key: "accountabilityPreference" },
  ],
  lifeStatusRelationships: [
    { label: "Relationship Status", key: "relationshipStatus" },
    { label: "Partner Name", key: "partnerName" },
    { label: "Partner Health Journey", key: "partnerHealthJourney" },
    { label: "Number of Children", key: "numberOfChildren" },
    { label: "Children's Ages", key: "childrenAges" },
    { label: "Living Arrangement", key: "livingArrangement" },
    { label: "Family Dynamics", key: "familyDynamics" },
    { label: "Social Circle Size", key: "socialCircleSize" },
    { label: "Social Activity Frequency", key: "socialActivityFrequency" },
    { label: "Community Involvement", key: "communityInvolvement" },
    { label: "Spiritual Practice", key: "spiritualPractice" },
    { label: "Faith Community", key: "faithCommunity" },
    { label: "Volunteer Work", key: "volunteerWork" },
    { label: "Pet Ownership", key: "petOwnership" },
    { label: "Pet Types", key: "petTypes" },
    { label: "Travel Frequency", key: "travelFrequency" },
    { label: "Work-Life Balance", key: "workLifeBalance" },
    { label: "Financial Stress Level", key: "financialStressLevel" },
    { label: "Career Satisfaction", key: "careerSatisfaction" },
    { label: "Retirement Plans", key: "retirementPlans" },
    { label: "Life Transitions", key: "lifeTransitions" },
    { label: "Support System", key: "supportSystem" },
  ],
  hobbiesInterests: [
    { label: "Hobbies", key: "hobbies" },
    { label: "Hobbies (Other)", key: "hobbiesOther" },
    { label: "Creative Outlets", key: "creativeOutlets" },
    { label: "Outdoor Activities", key: "outdoorActivities" },
    { label: "Reading Habits", key: "readingHabits" },
    { label: "Music Preferences", key: "musicPreferences" },
    { label: "Learning Interests", key: "learningInterests" },
    { label: "Personal Projects", key: "personalProjects" },
    { label: "Bucket List Items", key: "bucketListItems" },
    { label: "Personal Values", key: "personalValues" },
    { label: "Personal Values (Other)", key: "personalValuesOther" },
    { label: "What Brings Joy", key: "whatBringsJoy" },
    { label: "What Drains Energy", key: "whatDrainsEnergy" },
    { label: "Ideal Weekend", key: "idealWeekend" },
    { label: "Personal Motto", key: "personalMotto" },
    { label: "Role Models", key: "roleModels" },
    { label: "Legacy Goals", key: "legacyGoals" },
  ],
};

// ─── PDF Colors ───
const COLORS = {
  black: [28, 28, 28] as [number, number, number],
  charcoal: [46, 46, 46] as [number, number, number],
  warmStone: [159, 152, 139] as [number, number, number],
  taupe: [184, 177, 164] as [number, number, number],
  bone: [237, 234, 227] as [number, number, number],
  ivory: [246, 244, 239] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gold: [198, 184, 158] as [number, number, number],
};

// ─── PDF Generator ───

export function generateIntakePdf(
  patientName: string,
  patientDob: string | null,
  patientEmail: string | null,
  formData: IntakeFormData,
  completedSections: string[],
  submittedAt: Date | null,
  providerNotes: string | null
): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  // ─── Page Management ───
  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = 20;
      addFooter();
    }
  }

  function addFooter() {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.text(
      `BLACK LABEL MEDICINE  \u2022  Confidential Patient Record  \u2022  Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // ─── Cover / Header ───
  // Top accent line
  doc.setFillColor(...COLORS.charcoal);
  doc.rect(0, 0, pageWidth, 2, "F");

  y = 18;

  // Practice name
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.warmStone);
  doc.setFont("helvetica", "normal");
  doc.text("B L A C K   L A B E L   M E D I C I N E", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.charcoal);
  doc.setFont("helvetica", "bold");
  doc.text("Comprehensive Health Intake", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Patient name
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.charcoal);
  doc.setFont("helvetica", "normal");
  doc.text(patientName, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Metadata line
  const metaParts: string[] = [];
  if (patientDob) metaParts.push(`DOB: ${patientDob}`);
  if (patientEmail) metaParts.push(patientEmail);
  if (submittedAt) metaParts.push(`Submitted: ${new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
  if (metaParts.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.warmStone);
    doc.text(metaParts.join("  \u2022  "), pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  // Completion summary
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.warmStone);
  doc.text(`${completedSections.length} of ${INTAKE_SECTIONS.length} sections completed`, pageWidth / 2, y, { align: "center" });
  y += 4;

  // Divider
  doc.setDrawColor(...COLORS.bone);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // Provider notes (if any)
  if (providerNotes) {
    checkPageBreak(20);
    doc.setFillColor(...COLORS.ivory);
    doc.roundedRect(marginLeft, y, contentWidth, 16, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.setFont("helvetica", "bold");
    doc.text("PROVIDER NOTES", marginLeft + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.charcoal);
    const noteLines = doc.splitTextToSize(providerNotes, contentWidth - 8);
    doc.text(noteLines, marginLeft + 4, y + 10);
    y += 16 + Math.max(0, (noteLines.length - 1) * 4);
    y += 6;
  }

  addFooter();

  // ─── Sections ───
  for (const section of INTAKE_SECTIONS) {
    const sectionData = formData[section.key as keyof IntakeFormData] as Record<string, unknown> | undefined;
    const isCompleted = completedSections.includes(section.key);
    const fields = sectionFields[section.key] || [];

    // Section header
    checkPageBreak(16);

    // Section header background
    doc.setFillColor(...COLORS.charcoal);
    doc.roundedRect(marginLeft, y, contentWidth, 8, 1, 1, "F");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(section.label.toUpperCase(), marginLeft + 4, y + 5.5);

    // Completion badge
    const badgeText = isCompleted ? "COMPLETED" : "NOT COMPLETED";
    doc.setFontSize(7);
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    const badgeX = pageWidth - marginRight - badgeWidth - 3;
    if (isCompleted) {
      doc.setFillColor(...COLORS.gold);
    } else {
      doc.setFillColor(...COLORS.warmStone);
    }
    doc.roundedRect(badgeX, y + 1.5, badgeWidth, 5, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, badgeX + 3, y + 5);

    y += 12;

    if (!sectionData || !isCompleted) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.warmStone);
      doc.setFont("helvetica", "italic");
      doc.text("Patient has not completed this section.", marginLeft + 4, y);
      y += 8;
      continue;
    }

    // Render fields
    let rowIndex = 0;
    for (const field of fields) {
      const val = sectionData[field.key];
      if (val === null || val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) continue;

      if (field.isGroup && Array.isArray(val)) {
        // Group items (medications, surgeries, etc.)
        checkPageBreak(12);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.warmStone);
        doc.setFont("helvetica", "bold");
        doc.text(field.label.toUpperCase(), marginLeft + 4, y);
        y += 5;

        for (const item of val as Record<string, unknown>[]) {
          checkPageBreak(8);
          const parts = (field.groupFields || [])
            .filter((f) => item[f])
            .map((f) => `${humanizeKey(f)}: ${renderValue(item[f])}`)
            .join("  \u2022  ");
          if (parts) {
            // Alternate row background
            if (rowIndex % 2 === 0) {
              doc.setFillColor(...COLORS.ivory);
              doc.rect(marginLeft, y - 3, contentWidth, 6, "F");
            }
            doc.setFontSize(8.5);
            doc.setTextColor(...COLORS.charcoal);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(parts, contentWidth - 8);
            doc.text(lines, marginLeft + 6, y);
            y += lines.length * 4 + 2;
            rowIndex++;
          }
        }
        y += 3;
      } else {
        // Simple key-value field
        checkPageBreak(8);

        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.setFillColor(...COLORS.ivory);
          doc.rect(marginLeft, y - 3.5, contentWidth, 6, "F");
        }

        // Label
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.warmStone);
        doc.setFont("helvetica", "bold");
        doc.text(field.label, marginLeft + 4, y);

        // Value
        const displayVal = renderValue(val);
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.charcoal);
        doc.setFont("helvetica", "normal");
        const valueX = marginLeft + 60;
        const maxValueWidth = contentWidth - 64;
        const lines = doc.splitTextToSize(displayVal, maxValueWidth);
        doc.text(lines, valueX, y);
        y += Math.max(lines.length * 4, 5) + 1;
        rowIndex++;
      }
    }

    y += 6;
  }

  // ─── Final footer on all pages ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.text(
      `BLACK LABEL MEDICINE  \u2022  Confidential Patient Record  \u2022  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
