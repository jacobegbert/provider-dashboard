/**
 * IntakeViewer — Provider-side read-only view of a patient's intake form
 * Shows all 12 sections in an expandable accordion layout
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User, Heart, Pill, Users, Sun, Apple, Dumbbell, Moon, Brain, Target,
  HeartHandshake, Palette, ChevronDown, ChevronRight, Check, Clock,
  Loader2, ClipboardList, AlertCircle, FileText, Eye, Save, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { INTAKE_SECTIONS, type IntakeFormData, type IntakeSectionKey } from "@shared/intakeFormSchema";

const sectionIcons: Record<string, React.ElementType> = {
  User, Heart, Pill, Users, Sun, Apple, Dumbbell, Moon, Brain, Target,
  HeartHandshake, Palette,
};

// ─── Value Renderers ───

function renderValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    if (typeof val[0] === "string") return val.join(", ");
    return JSON.stringify(val);
  }
  return String(val);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\b(Id|Url|Api)\b/g, (s) => s.toUpperCase())
    .trim();
}

function DataRow({ label, value }: { label: string; value: unknown }) {
  const display = renderValue(value);
  if (display === "—") return null; // Skip empty fields
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-48 shrink-0">{label}</span>
      <span className="text-sm text-foreground flex-1">{display}</span>
    </div>
  );
}

function DynamicListView({ label, items, fields }: {
  label: string;
  items: Record<string, string>[];
  fields: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-muted/30 rounded-lg p-3 text-sm">
            {fields.map((f) => {
              const val = item[f];
              if (!val) return null;
              return (
                <span key={f} className="inline-block mr-4">
                  <span className="text-muted-foreground text-xs">{humanizeKey(f)}: </span>
                  <span className="text-foreground">{val}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Renderers ───

function renderPersonalInfo(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Preferred Name" value={data.preferredName} />
      <DataRow label="Sex" value={data.gender} />
      <DataRow label="Marital Status" value={data.maritalStatus} />
      <DataRow label="Occupation" value={data.occupation} />
      <DataRow label="Employer" value={data.employer} />
      <Separator className="my-2" />
      <p className="text-xs font-semibold text-foreground py-1">Emergency Contact</p>
      <DataRow label="Name" value={data.emergencyContactName} />
      <DataRow label="Phone" value={data.emergencyContactPhone} />
      <DataRow label="Relationship" value={data.emergencyContactRelation} />
      <Separator className="my-2" />
      <DataRow label="Primary Care Physician" value={data.primaryCarePhysician} />
      <DataRow label="Referral Source" value={data.referralSource} />

      <DataRow label="Preferred Pharmacy" value={data.preferredPharmacy} />
      <DataRow label="Address" value={[data.address, data.city, data.state, data.zipCode].filter(Boolean).join(", ")} />
    </div>
  );
}

function renderMedicalHistory(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Current Conditions" value={data.currentConditions} />
      <DataRow label="Past Conditions" value={data.pastConditions} />
      <DynamicListView label="Surgeries" items={data.surgeries} fields={["procedure", "year", "notes"]} />
      <DynamicListView label="Allergies" items={data.allergies} fields={["allergen", "reaction", "severity"]} />
      <DataRow label="Chronic Pain" value={data.hasChronicPain} />
      <DataRow label="Chronic Pain Details" value={data.chronicPainDescription} />
      <DataRow label="Autoimmune" value={data.hasAutoimmune} />
      <DataRow label="Autoimmune Details" value={data.autoimmuneDescription} />
      <DataRow label="Hormone Issues" value={data.hasHormoneIssues} />
      <DataRow label="Hormone Details" value={data.hormoneDescription} />
      <DataRow label="GI Issues" value={data.hasGIIssues} />
      <DataRow label="GI Details" value={data.giDescription} />
      <DataRow label="Recent Lab Work" value={data.recentLabWork} />
      <DataRow label="Additional Notes" value={data.additionalMedicalNotes} />
    </div>
  );
}

function renderMedications(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DynamicListView label="Prescription Medications" items={data.prescriptionMedications} fields={["name", "dosage", "frequency", "reason"]} />
      <DynamicListView label="Supplements" items={data.supplements} fields={["name", "dosage", "frequency"]} />
      <DynamicListView label="Hormone Therapy" items={data.hormoneTherapy} fields={["name", "dosage", "frequency", "prescribedBy"]} />
      <DynamicListView label="Peptide Therapy" items={data.peptideTherapy} fields={["name", "dosage", "frequency"]} />
      <DataRow label="Adverse Reactions" value={data.hasAdverseReactions} />
      <DataRow label="Adverse Reaction Details" value={data.adverseReactionDetails} />
    </div>
  );
}

function renderFamilyHistory(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DynamicListView label="Family Members" items={data.familyMembers} fields={["relation", "conditions", "ageOfOnset", "causeOfDeath"]} />
      <DataRow label="Known Genetic Conditions" value={data.knownGeneticConditions} />
      <DataRow label="Hereditary Concerns" value={data.hasHereditaryConcerns} />
      <DataRow label="Hereditary Notes" value={data.hereditaryConcernsNotes} />
      <DataRow label="Additional Notes" value={data.familyHistoryNotes} />
    </div>
  );
}

function renderLifestyle(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Smoking Status" value={data.smokingStatus} />
      <DataRow label="Smoking Details" value={data.smokingDetails} />
      <DataRow label="Alcohol Use" value={data.alcoholUse} />
      <DataRow label="Cannabis Use" value={data.cannabisUse} />
      <DataRow label="Caffeine Intake" value={data.caffeineIntake} />
      <DataRow label="Daily Water Intake" value={data.waterIntakeDaily} />
      <DataRow label="Screen Time" value={data.screenTimeDaily} />
      <Separator className="my-2" />
      <DataRow label="Sauna Use" value={data.saunaUse} />
      <DataRow label="Cold Exposure" value={data.coldExposure} />
      <DataRow label="Meditation" value={data.meditationPractice} />
      <DataRow label="Breathwork" value={data.breathworkPractice} />
      <DataRow label="Typical Day" value={data.typicalDayDescription} />
    </div>
  );
}

function renderNutrition(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Dietary Pattern" value={data.dietaryPattern} />
      <DataRow label="Meals Per Day" value={data.mealsPerDay} />
      <DataRow label="Food Allergies" value={data.foodAllergies} />
      <DataRow label="Foods Enjoyed" value={data.foodsEnjoy} />
      <DataRow label="Foods Avoided" value={data.foodsAvoid} />
      <Separator className="my-2" />
      <DataRow label="Typical Breakfast" value={data.typicalBreakfast} />
      <DataRow label="Typical Lunch" value={data.typicalLunch} />
      <DataRow label="Typical Dinner" value={data.typicalDinner} />
      <DataRow label="Typical Snacks" value={data.typicalSnacks} />
      <DataRow label="Eating Out" value={data.eatingOutFrequency} />
      <DataRow label="Nutrition Goals" value={data.nutritionGoals} />
    </div>
  );
}

function renderExercise(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Activity Level" value={data.currentActivityLevel} />
      <DataRow label="Exercise Types" value={data.exerciseTypes} />
      <DataRow label="Strength Training" value={data.strengthTrainingFrequency} />
      <DataRow label="Cardio" value={data.cardioFrequency} />
      <DataRow label="Daily Steps" value={data.dailySteps} />
      <DataRow label="Sedentary Hours" value={data.sedentaryHours} />
      <DataRow label="Physical Limitations" value={data.physicalLimitations} />
      <DataRow label="Personal Trainer" value={data.hasPersonalTrainer} />
      <DataRow label="Trainer Details" value={data.trainerDetails} />
      <DataRow label="Fitness Goals" value={data.fitnessGoals} />
    </div>
  );
}

function renderSleep(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Average Sleep" value={data.averageSleepHours} />
      <DataRow label="Bedtime" value={data.bedtime} />
      <DataRow label="Wake Time" value={data.wakeTime} />
      <DataRow label="Sleep Quality" value={data.sleepQuality} />
      <DataRow label="Time to Fall Asleep" value={data.fallAsleepTime} />
      <DataRow label="Night Wakings" value={data.nightWakings} />
      <DataRow label="Snoring" value={data.hasSnoring} />
      <DataRow label="Sleep Apnea" value={data.hasSleepApnea} />
      <DataRow label="Apnea Treatment" value={data.sleepApneaTreatment} />
      <DataRow label="Sleep Tracker" value={data.useSleepTracker} />
      <DataRow label="Tracker Type" value={data.sleepTrackerType} />
      <DataRow label="Sleep Aids" value={data.sleepAids} />
      <DataRow label="Sleep Environment" value={data.sleepEnvironment} />
      <DataRow label="Sleep Goals" value={data.sleepGoals} />
    </div>
  );
}

function renderMentalHealth(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Overall Mood" value={data.overallMoodRating ? `${data.overallMoodRating}/10` : undefined} />
      <DataRow label="Stress Level" value={data.stressLevel ? `${data.stressLevel}/10` : undefined} />
      <DataRow label="Primary Stressors" value={data.primaryStressors} />
      <DataRow label="Anxiety Frequency" value={data.anxietyFrequency} />
      <DataRow label="Depression History" value={data.depressionHistory} />
      <DataRow label="Currently in Therapy" value={data.currentTherapy} />
      <DataRow label="Therapist" value={data.therapistName} />
      <DataRow label="Therapy Type" value={data.therapyType} />
      <DataRow label="Coping Strategies" value={data.copingStrategies} />
      <DataRow label="Self-Esteem" value={data.selfEsteemRating ? `${data.selfEsteemRating}/10` : undefined} />
      <DataRow label="Life Satisfaction" value={data.lifesSatisfactionRating ? `${data.lifesSatisfactionRating}/10` : undefined} />
      <DataRow label="Mental Health Goals" value={data.mentalHealthGoals} />
    </div>
  );
}

function renderGoals(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Primary Health Goals" value={data.primaryHealthGoals} />
      <DataRow label="Top 3 Goals" value={data.topThreeGoals} />
      <DataRow label="Biggest Concern" value={data.biggestHealthConcern} />
      <DataRow label="Optimal Health Vision" value={data.whatDoesOptimalHealthLookLike} />
      <DataRow label="Motivation Level" value={data.motivationLevel ? `${data.motivationLevel}/10` : undefined} />
      <DataRow label="Readiness to Change" value={data.readinessToChange} />
      <DataRow label="Previous Attempts" value={data.previousAttempts} />
      <DataRow label="Barriers" value={data.barriers} />
      <DataRow label="6-Month Goal" value={data.idealOutcomeIn6Months} />
      <DataRow label="1-Year Goal" value={data.idealOutcomeIn1Year} />
      <DataRow label="5-Year Goal" value={data.idealOutcomeIn5Years} />
      <DataRow label="Accountability Preference" value={data.accountabilityPreference} />
    </div>
  );
}

function renderLifeStatus(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Relationship Status" value={data.relationshipStatus} />
      <DataRow label="Partner" value={data.partnerName} />
      <DataRow label="Partner Health Journey" value={data.partnerHealthJourney} />
      <DataRow label="Children" value={data.numberOfChildren} />
      <DataRow label="Children's Ages" value={data.childrenAges} />
      <DataRow label="Living Arrangement" value={data.livingArrangement} />
      <DataRow label="Family Dynamics" value={data.familyDynamics} />
      <DataRow label="Social Circle" value={data.socialCircleSize} />
      <DataRow label="Social Activity" value={data.socialActivityFrequency} />
      <DataRow label="Community" value={data.communityInvolvement} />
      <DataRow label="Spiritual Practice" value={data.spiritualPractice} />
      <DataRow label="Pets" value={data.petTypes} />
      <DataRow label="Work-Life Balance" value={data.workLifeBalance} />
      <DataRow label="Financial Stress" value={data.financialStressLevel} />
      <DataRow label="Career Satisfaction" value={data.careerSatisfaction} />
      <DataRow label="Life Transitions" value={data.lifeTransitions} />
      <DataRow label="Support System" value={data.supportSystem} />
    </div>
  );
}

function renderHobbies(data: any) {
  if (!data) return <EmptySection />;
  return (
    <div className="space-y-0">
      <DataRow label="Hobbies" value={data.hobbies} />
      <DataRow label="Other Hobbies" value={data.hobbiesOther} />
      <DataRow label="Creative Outlets" value={data.creativeOutlets} />
      <DataRow label="Outdoor Activities" value={data.outdoorActivities} />
      <DataRow label="Learning Interests" value={data.learningInterests} />
      <DataRow label="Personal Projects" value={data.personalProjects} />
      <DataRow label="Bucket List" value={data.bucketListItems} />
      <Separator className="my-2" />
      <DataRow label="Personal Values" value={data.personalValues} />
      <DataRow label="What Brings Joy" value={data.whatBringsJoy} />
      <DataRow label="What Drains Energy" value={data.whatDrainsEnergy} />
      <DataRow label="Ideal Weekend" value={data.idealWeekend} />
      <DataRow label="Personal Motto" value={data.personalMotto} />
      <DataRow label="Role Models" value={data.roleModels} />
      <DataRow label="Legacy Goals" value={data.legacyGoals} />
    </div>
  );
}

const sectionRenderers: Record<string, (data: any) => React.ReactNode> = {
  personalInfo: renderPersonalInfo,
  medicalHistory: renderMedicalHistory,
  medicationsSupplements: renderMedications,
  familyHistory: renderFamilyHistory,
  lifestyleHabits: renderLifestyle,
  nutritionDiet: renderNutrition,
  exerciseFitness: renderExercise,
  sleepRecovery: renderSleep,
  mentalHealthStress: renderMentalHealth,
  goalsMotivations: renderGoals,
  lifeStatusRelationships: renderLifeStatus,
  hobbiesInterests: renderHobbies,
};

function EmptySection() {
  return (
    <div className="py-4 text-center">
      <p className="text-sm text-muted-foreground italic">Patient has not completed this section yet.</p>
    </div>
  );
}

// ─── Main Component ───

export default function IntakeViewer({ patientId, patientName }: { patientId: number; patientName: string }) {
  const intakeQuery = trpc.intake.get.useQuery({ patientId });
  const markReviewedMut = trpc.intake.markReviewed.useMutation();
  const generatePdfMut = trpc.intake.generatePdf.useMutation();
  const utils = trpc.useUtils();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [providerNotes, setProviderNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const intake = intakeQuery.data;
  const formData = (intake?.formData as IntakeFormData) || {};
  const completedSections = (intake?.completedSections as string[]) || [];

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(INTAKE_SECTIONS.map((s) => s.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const handleMarkReviewed = async () => {
    try {
      await markReviewedMut.mutateAsync({ patientId, providerNotes: providerNotes || undefined });
      utils.intake.get.invalidate({ patientId });
      toast.success("Intake marked as reviewed");
      setShowNotes(false);
    } catch {
      toast.error("Failed to mark as reviewed");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const result = await generatePdfMut.mutateAsync({ patientId });
      // Convert base64 to blob and trigger download
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  if (intakeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No Intake Form</p>
        <p className="text-xs text-muted-foreground mt-1">
          {patientName} has not started their intake form yet. The form will appear here once they begin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-heading font-semibold text-foreground">Intake Form</h3>
          <Badge
            variant="outline"
            className={
              intake.status === "completed"
                ? "bg-gold/10 text-gold border-gold/15"
                : intake.status === "in_progress"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-zinc-800/50 text-zinc-400 border-gray-200"
            }
          >
            {intake.status === "completed" ? "Completed" : intake.status === "in_progress" ? "In Progress" : "Not Started"}
          </Badge>
          {intake.reviewedByProvider && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
              <Check className="h-3 w-3" /> Reviewed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={generatePdfMut.isPending}
            className="text-xs h-7 gap-1"
          >
            {generatePdfMut.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {generatePdfMut.isPending ? "Generating..." : "Download PDF"}
          </Button>
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs h-7">
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs h-7">
            Collapse All
          </Button>
          {!intake.reviewedByProvider && intake.status === "completed" && (
            <Button
              size="sm"
              onClick={() => setShowNotes(true)}
              className="bg-gold hover:bg-gold-light text-black text-xs h-7 gap-1"
            >
              <Check className="h-3 w-3" /> Mark Reviewed
            </Button>
          )}
        </div>
      </div>

      {/* Submission info */}
      {intake.submittedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Submitted {new Date(intake.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          {intake.reviewedAt && (
            <>
              <span className="mx-1">&middot;</span>
              Reviewed {new Date(intake.reviewedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </>
          )}
        </div>
      )}

      {/* Provider notes */}
      {intake.providerNotes && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
          <p className="text-xs font-medium text-accent-foreground mb-1">Provider Notes</p>
          <p className="text-sm text-foreground">{intake.providerNotes}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${(completedSections.length / INTAKE_SECTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{completedSections.length}/{INTAKE_SECTIONS.length} sections</span>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {INTAKE_SECTIONS.map((section) => {
          const Icon = sectionIcons[section.icon] || ClipboardList;
          const isCompleted = completedSections.includes(section.key);
          const isExpanded = expandedSections.has(section.key);
          const sectionData = formData[section.key as IntakeSectionKey];
          const renderer = sectionRenderers[section.key];

          return (
            <div key={section.key} className="border border-border/60 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-gold/10" : "bg-muted/50"
                }`}>
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 text-gold" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-sm flex-1 ${isCompleted ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {section.label}
                </span>
                {!isCompleted && (
                  <span className="text-[10px] text-muted-foreground/60 mr-2">Not completed</span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/30">
                  <div className="pt-3">
                    {renderer ? renderer(sectionData) : <EmptySection />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mark Reviewed Dialog (inline) */}
      {showNotes && (
        <div className="border border-gold/20 rounded-lg p-4 bg-gold/5 space-y-3">
          <p className="text-sm font-medium text-foreground">Mark Intake as Reviewed</p>
          <Textarea
            value={providerNotes}
            onChange={(e) => setProviderNotes(e.target.value)}
            placeholder="Optional notes about this intake review..."
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowNotes(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleMarkReviewed}
              disabled={markReviewedMut.isPending}
              className="bg-gold hover:bg-gold-light text-black gap-1"
            >
              {markReviewedMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Confirm Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
