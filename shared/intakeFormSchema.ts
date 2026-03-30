/**
 * Comprehensive Patient Intake Form — Type Definitions
 *
 * Sections:
 *  1. Personal Information
 *  2. Medical History
 *  3. Current Medications & Supplements
 *  4. Family Medical History
 *  5. Lifestyle & Daily Habits
 *  6. Nutrition & Diet
 *  7. Exercise & Physical Activity
 *  8. Sleep & Recovery
 *  9. Mental Health & Stress
 * 10. Goals & Motivations
 * 11. Life Status, Relationships & Social
 * 12. Hobbies, Interests & Identity
 */

// ─── Section 1: Personal Information ───
export interface PersonalInfo {
  preferredName?: string;
  gender?: string;
  pronouns?: string;
  maritalStatus?: string;
  occupation?: string;
  employer?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  primaryCarePhysician?: string;
  referralSource?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  preferredPharmacy?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// ─── Section 2: Medical History ───
export interface MedicalHistory {
  currentConditions?: string[];
  pastConditions?: string[];
  surgeries?: { procedure: string; year: string; notes?: string }[];
  hospitalizations?: { reason: string; year: string; notes?: string }[];
  allergies?: { allergen: string; reaction: string; severity?: string }[];
  immunizationsUpToDate?: boolean;
  immunizationNotes?: string;
  hasChronicPain?: boolean;
  chronicPainDescription?: string;
  hasAutoimmune?: boolean;
  autoimmuneDescription?: string;
  hasHormoneIssues?: boolean;
  hormoneDescription?: string;
  hasCancer?: boolean;
  cancerDescription?: string;
  hasHeartCondition?: boolean;
  heartConditionDescription?: string;
  hasDiabetes?: boolean;
  diabetesType?: string;
  hasThyroidIssue?: boolean;
  thyroidDescription?: string;
  hasGIIssues?: boolean;
  giDescription?: string;
  recentLabWork?: string;
  additionalMedicalNotes?: string;
}

// ─── Section 3: Current Medications & Supplements ───
export interface MedicationEntry {
  name: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  reason?: string;
  startDate?: string;
}

export interface MedicationsSupplements {
  prescriptionMedications?: MedicationEntry[];
  overTheCounterMeds?: MedicationEntry[];
  supplements?: MedicationEntry[];
  hormoneTherapy?: MedicationEntry[];
  peptideTherapy?: MedicationEntry[];
  recentlyDiscontinued?: { name: string; reason: string; stopDate?: string }[];
  hasAdverseReactions?: boolean;
  adverseReactionDetails?: string;
}

// ─── Section 4: Family Medical History ───
export interface FamilyMember {
  relation: string;
  conditions?: string[];
  ageOfOnset?: string;
  deceased?: boolean;
  causeOfDeath?: string;
  ageAtDeath?: string;
}

export interface FamilyHistory {
  familyMembers?: FamilyMember[];
  familyHistoryNotes?: string;
  knownGeneticConditions?: string[];
  hasHereditaryConcerns?: boolean;
  hereditaryConcernsNotes?: string;
}

// ─── Section 5: Lifestyle & Daily Habits ───
export interface LifestyleHabits {
  smokingStatus?: string;
  smokingDetails?: string;
  alcoholUse?: string;
  alcoholFrequency?: string;
  cannabisUse?: string;
  cannabisDetails?: string;
  recreationalDrugUse?: string;
  recreationalDrugDetails?: string;
  caffeineIntake?: string;
  waterIntakeDaily?: string;
  screenTimeDaily?: string;
  sunExposure?: string;
  sunscreenUse?: string;
  saunaUse?: string;
  coldExposure?: string;
  meditationPractice?: string;
  breathworkPractice?: string;
  journaling?: string;
  typicalDayDescription?: string;
}

// ─── Section 6: Nutrition & Diet ───
export interface NutritionDiet {
  dietaryPattern?: string;
  dietaryPatternOther?: string;
  mealsPerDay?: string;
  mealPrepMethod?: string;
  foodAllergies?: string[];
  foodIntolerances?: string[];
  foodsEnjoy?: string;
  foodsAvoid?: string;
  typicalBreakfast?: string;
  typicalLunch?: string;
  typicalDinner?: string;
  typicalSnacks?: string;
  eatingOutFrequency?: string;
  proteinIntakeEstimate?: string;
  vegetableIntakeEstimate?: string;
  processedFoodIntake?: string;
  sugarIntake?: string;
  nutritionGoals?: string;
  hasEatingDisorderHistory?: boolean;
  eatingDisorderNotes?: string;
}

// ─── Section 7: Exercise & Physical Activity ───
export interface ExerciseFitness {
  currentActivityLevel?: string;
  exerciseFrequency?: string;
  exerciseTypes?: string[];
  exerciseTypesOther?: string;
  strengthTrainingFrequency?: string;
  cardioFrequency?: string;
  flexibilityMobility?: string;
  vo2MaxEstimate?: string;
  recentFitnessTest?: string;
  physicalLimitations?: string;
  injuryHistory?: string;
  fitnessGoals?: string;
  hasPersonalTrainer?: boolean;
  trainerDetails?: string;
  sportsParticipation?: string;
  dailySteps?: string;
  sedentaryHours?: string;
}

// ─── Section 8: Sleep & Recovery ───
export interface SleepRecovery {
  averageSleepHours?: string;
  bedtime?: string;
  wakeTime?: string;
  sleepQuality?: string;
  fallAsleepTime?: string;
  nightWakings?: string;
  sleepAids?: string;
  hasSnoring?: boolean;
  hasSleepApnea?: boolean;
  sleepApneaTreatment?: string;
  useSleepTracker?: boolean;
  sleepTrackerType?: string;
  napFrequency?: string;
  dreamRecall?: string;
  sleepEnvironment?: string;
  blueLight?: string;
  sleepGoals?: string;
}

// ─── Section 9: Mental Health & Stress ───
export interface MentalHealthStress {
  overallMoodRating?: number;
  stressLevel?: number;
  primaryStressors?: string[];
  primaryStressorsOther?: string;
  anxietyFrequency?: string;
  depressionHistory?: string;
  currentTherapy?: boolean;
  therapistName?: string;
  therapyType?: string;
  psychiatricMedications?: string;
  hasTraumaHistory?: boolean;
  traumaNotes?: string;
  copingStrategies?: string[];
  copingStrategiesOther?: string;
  mindfulnessPractice?: string;
  gratitudePractice?: string;
  socialConnectionQuality?: string;
  lonelinessFeelings?: string;
  selfEsteemRating?: number;
  lifesSatisfactionRating?: number;
  mentalHealthGoals?: string;
}

// ─── Section 10: Goals & Motivations ───
export interface GoalsMotivations {
  primaryHealthGoals?: string[];
  primaryHealthGoalsOther?: string;
  topThreeGoals?: string;
  biggestHealthConcern?: string;
  whatDoesOptimalHealthLookLike?: string;
  motivationLevel?: number;
  readinessToChange?: string;
  previousAttempts?: string;
  barriers?: string;
  idealOutcomeIn6Months?: string;
  idealOutcomeIn1Year?: string;
  idealOutcomeIn5Years?: string;
  willingToInvest?: string;
  commitmentLevel?: string;
  accountabilityPreference?: string;
}

// ─── Section 11: Life Status, Relationships & Social ───
export interface LifeStatusRelationships {
  relationshipStatus?: string;
  partnerName?: string;
  partnerHealthJourney?: string;
  numberOfChildren?: string;
  childrenAges?: string;
  livingArrangement?: string;
  familyDynamics?: string;
  socialCircleSize?: string;
  socialActivityFrequency?: string;
  communityInvolvement?: string;
  spiritualPractice?: string;
  faithCommunity?: string;
  volunteerWork?: string;
  petOwnership?: string;
  petTypes?: string;
  travelFrequency?: string;
  workLifeBalance?: string;
  financialStressLevel?: string;
  careerSatisfaction?: string;
  retirementPlans?: string;
  lifeTransitions?: string;
  supportSystem?: string;
}

// ─── Section 12: Hobbies, Interests & Identity ───
export interface HobbiesInterests {
  hobbies?: string[];
  hobbiesOther?: string;
  creativeOutlets?: string;
  outdoorActivities?: string;
  readingHabits?: string;
  musicPreferences?: string;
  learningInterests?: string;
  personalProjects?: string;
  bucketListItems?: string;
  personalValues?: string[];
  personalValuesOther?: string;
  whatBringsJoy?: string;
  whatDrainsEnergy?: string;
  idealWeekend?: string;
  personalMotto?: string;
  roleModels?: string;
  legacyGoals?: string;
}

// ─── Complete Intake Form ───
export interface IntakeFormData {
  personalInfo?: PersonalInfo;
  medicalHistory?: MedicalHistory;
  medicationsSupplements?: MedicationsSupplements;
  familyHistory?: FamilyHistory;
  lifestyleHabits?: LifestyleHabits;
  nutritionDiet?: NutritionDiet;
  exerciseFitness?: ExerciseFitness;
  sleepRecovery?: SleepRecovery;
  mentalHealthStress?: MentalHealthStress;
  goalsMotivations?: GoalsMotivations;
  lifeStatusRelationships?: LifeStatusRelationships;
  hobbiesInterests?: HobbiesInterests;
}

export const INTAKE_SECTIONS = [
  { key: "personalInfo", label: "Personal Information", icon: "User" },
  { key: "medicalHistory", label: "Medical History", icon: "Heart" },
  { key: "medicationsSupplements", label: "Medications & Supplements", icon: "Pill" },
  { key: "familyHistory", label: "Family History", icon: "Users" },
  { key: "lifestyleHabits", label: "Lifestyle & Habits", icon: "Sun" },
  { key: "nutritionDiet", label: "Nutrition & Diet", icon: "Apple" },
  { key: "exerciseFitness", label: "Exercise & Fitness", icon: "Dumbbell" },
  { key: "sleepRecovery", label: "Sleep & Recovery", icon: "Moon" },
  { key: "mentalHealthStress", label: "Mental Health & Stress", icon: "Brain" },
  { key: "goalsMotivations", label: "Goals & Motivations", icon: "Target" },
  { key: "lifeStatusRelationships", label: "Life & Relationships", icon: "HeartHandshake" },
  { key: "hobbiesInterests", label: "Hobbies & Identity", icon: "Palette" },
] as const;

export type IntakeSectionKey = keyof IntakeFormData;
