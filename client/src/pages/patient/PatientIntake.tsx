/**
 * Patient Intake Form — Comprehensive multi-step form
 * Design: Warm Scandinavian — sage, terracotta, stone palette
 * 12 sections with save-as-you-go and progress tracking
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Heart, Pill, Users, Sun, Apple, Dumbbell, Moon, Brain, Target,
  HeartHandshake, Palette, ChevronLeft, ChevronRight, Check, Save,
  Loader2, ClipboardList, AlertCircle, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  INTAKE_SECTIONS,
  type IntakeFormData,
  type IntakeSectionKey,
} from "@shared/intakeFormSchema";

const sectionIcons: Record<string, React.ElementType> = {
  User, Heart, Pill, Users, Sun, Apple, Dumbbell, Moon, Brain, Target,
  HeartHandshake, Palette,
};

// ─── Field Helpers ───

function TextField({ label, value, onChange, placeholder, multiline, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-gold ml-0.5">*</span>}
      </Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] text-sm"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="text-sm">
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderField({ label, value, onChange, min = 1, max = 10, labels }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; labels?: [string, string];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        {labels && <span className="text-xs text-muted-foreground w-16 text-right">{labels[0]}</span>}
        <div className="flex gap-1 flex-1">
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${
                n <= value
                  ? "bg-gold text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {labels && <span className="text-xs text-muted-foreground w-16">{labels[1]}</span>}
      </div>
    </div>
  );
}

function MultiCheckField({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected.includes(opt)
                ? "bg-gold text-white border-gold"
                : "bg-background text-foreground border-border hover:border-gold/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function BoolField({ label, value, onChange }: {
  label: string; value: boolean | undefined; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === true ? "bg-gold text-white border-gold" : "bg-background text-foreground border-border hover:border-gold/50"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            value === false ? "bg-muted text-foreground border-muted" : "bg-background text-foreground border-border hover:border-muted"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function DynamicList({ label, items, onChange, fields, addLabel }: {
  label: string;
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  fields: { key: string; label: string; placeholder?: string }[];
  addLabel?: string;
}) {
  const addItem = () => {
    const empty: Record<string, string> = {};
    fields.forEach((f) => (empty[f.key] = ""));
    onChange([...items, empty]);
  };
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: string, val: string) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [key]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-start p-3 rounded-lg bg-muted/40 border border-border/50">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map((f) => (
              <Input
                key={f.key}
                value={item[f.key] || ""}
                onChange={(e) => updateItem(idx, f.key, e.target.value)}
                placeholder={f.placeholder || f.label}
                className="text-sm h-8"
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="text-xs gap-1.5 h-8">
        <Plus className="h-3.5 w-3.5" /> {addLabel || "Add"}
      </Button>
    </div>
  );
}

// ─── Section Components ───

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-heading font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function PersonalInfoSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Personal Information" description="Basic details and emergency contacts. This helps us personalize your care." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Preferred Name" value={data.preferredName || ""} onChange={(v) => u("preferredName", v)} placeholder="What should we call you?" />
        <SelectField label="Sex" value={data.gender || ""} onChange={(v) => u("gender", v)} options={[
          { value: "male", label: "Male" }, { value: "female", label: "Female" },
        ]} />
        <SelectField label="Marital Status" value={data.maritalStatus || ""} onChange={(v) => u("maritalStatus", v)} options={[
          { value: "single", label: "Single" }, { value: "married", label: "Married" },
          { value: "partnered", label: "Partnered" }, { value: "divorced", label: "Divorced" },
          { value: "widowed", label: "Widowed" }, { value: "separated", label: "Separated" },
        ]} />
        <TextField label="Occupation" value={data.occupation || ""} onChange={(v) => u("occupation", v)} placeholder="Your current job or role" />
        <TextField label="Employer" value={data.employer || ""} onChange={(v) => u("employer", v)} placeholder="Company or organization" />
      </div>
      <Separator className="my-2" />
      <p className="text-sm font-medium text-foreground">Emergency Contact</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField label="Name" value={data.emergencyContactName || ""} onChange={(v) => u("emergencyContactName", v)} placeholder="Full name" />
        <TextField label="Phone" value={data.emergencyContactPhone || ""} onChange={(v) => u("emergencyContactPhone", v)} placeholder="(555) 123-4567" />
        <TextField label="Relationship" value={data.emergencyContactRelation || ""} onChange={(v) => u("emergencyContactRelation", v)} placeholder="e.g., Spouse, Parent" />
      </div>
      <Separator className="my-2" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Primary Care Physician" value={data.primaryCarePhysician || ""} onChange={(v) => u("primaryCarePhysician", v)} placeholder="Doctor's name" />
        <TextField label="How did you hear about us?" value={data.referralSource || ""} onChange={(v) => u("referralSource", v)} placeholder="Referral, Google, etc." />

        <TextField label="Preferred Pharmacy" value={data.preferredPharmacy || ""} onChange={(v) => u("preferredPharmacy", v)} placeholder="Pharmacy name & location" />
      </div>
      <Separator className="my-2" />
      <p className="text-sm font-medium text-foreground">Address</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <TextField label="Street Address" value={data.address || ""} onChange={(v) => u("address", v)} placeholder="123 Main St" />
        </div>
        <TextField label="City" value={data.city || ""} onChange={(v) => u("city", v)} placeholder="City" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="State" value={data.state || ""} onChange={(v) => u("state", v)} placeholder="State" />
          <TextField label="ZIP Code" value={data.zipCode || ""} onChange={(v) => u("zipCode", v)} placeholder="12345" />
        </div>
      </div>
    </div>
  );
}

function MedicalHistorySection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Medical History" description="Your past and current health conditions help us build a complete picture." />
      <MultiCheckField label="Current Medical Conditions" options={[
        "High Blood Pressure", "High Cholesterol", "Diabetes", "Thyroid Disorder",
        "Heart Disease", "Asthma/COPD", "Arthritis", "Autoimmune Disorder",
        "Anxiety", "Depression", "ADHD", "Migraines", "Back Pain", "Chronic Fatigue",
        "IBS/Digestive Issues", "Sleep Apnea", "PCOS", "Endometriosis",
      ]} selected={data.currentConditions || []} onChange={(v) => u("currentConditions", v)} />
      <MultiCheckField label="Past Medical Conditions (Resolved)" options={[
        "Cancer", "Surgery Recovery", "Broken Bones", "Concussion",
        "Eating Disorder", "Substance Abuse", "Pneumonia", "COVID Long-Haul",
      ]} selected={data.pastConditions || []} onChange={(v) => u("pastConditions", v)} />
      <DynamicList label="Surgeries" items={data.surgeries || []} onChange={(v) => u("surgeries", v)} fields={[
        { key: "procedure", label: "Procedure", placeholder: "e.g., Knee replacement" },
        { key: "year", label: "Year", placeholder: "2020" },
        { key: "notes", label: "Notes", placeholder: "Any complications?" },
      ]} addLabel="Add Surgery" />
      <DynamicList label="Allergies" items={data.allergies || []} onChange={(v) => u("allergies", v)} fields={[
        { key: "allergen", label: "Allergen", placeholder: "e.g., Penicillin" },
        { key: "reaction", label: "Reaction", placeholder: "e.g., Hives, swelling" },
        { key: "severity", label: "Severity", placeholder: "Mild / Moderate / Severe" },
      ]} addLabel="Add Allergy" />
      <BoolField label="Do you have chronic pain?" value={data.hasChronicPain} onChange={(v) => u("hasChronicPain", v)} />
      {data.hasChronicPain && <TextField label="Describe your chronic pain" value={data.chronicPainDescription || ""} onChange={(v) => u("chronicPainDescription", v)} multiline placeholder="Location, severity, what helps..." />}
      <BoolField label="Any autoimmune conditions?" value={data.hasAutoimmune} onChange={(v) => u("hasAutoimmune", v)} />
      {data.hasAutoimmune && <TextField label="Autoimmune details" value={data.autoimmuneDescription || ""} onChange={(v) => u("autoimmuneDescription", v)} multiline />}
      <BoolField label="Hormone-related issues?" value={data.hasHormoneIssues} onChange={(v) => u("hasHormoneIssues", v)} />
      {data.hasHormoneIssues && <TextField label="Hormone details" value={data.hormoneDescription || ""} onChange={(v) => u("hormoneDescription", v)} multiline />}
      <BoolField label="GI / Digestive issues?" value={data.hasGIIssues} onChange={(v) => u("hasGIIssues", v)} />
      {data.hasGIIssues && <TextField label="GI details" value={data.giDescription || ""} onChange={(v) => u("giDescription", v)} multiline />}
      <TextField label="Recent lab work or test results" value={data.recentLabWork || ""} onChange={(v) => u("recentLabWork", v)} multiline placeholder="Any recent bloodwork, imaging, or tests you'd like us to know about?" />
      <TextField label="Anything else about your medical history?" value={data.additionalMedicalNotes || ""} onChange={(v) => u("additionalMedicalNotes", v)} multiline />
    </div>
  );
}

function MedicationsSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Medications & Supplements" description="Everything you're currently taking — prescriptions, OTC, supplements, and therapies." />
      <DynamicList label="Prescription Medications" items={data.prescriptionMedications || []} onChange={(v) => u("prescriptionMedications", v)} fields={[
        { key: "name", label: "Medication", placeholder: "e.g., Lisinopril" },
        { key: "dosage", label: "Dosage", placeholder: "e.g., 10mg" },
        { key: "frequency", label: "Frequency", placeholder: "e.g., Once daily" },
        { key: "reason", label: "Reason", placeholder: "e.g., Blood pressure" },
      ]} addLabel="Add Medication" />
      <DynamicList label="Supplements & Vitamins" items={data.supplements || []} onChange={(v) => u("supplements", v)} fields={[
        { key: "name", label: "Supplement", placeholder: "e.g., Vitamin D3" },
        { key: "dosage", label: "Dosage", placeholder: "e.g., 5000 IU" },
        { key: "frequency", label: "Frequency", placeholder: "e.g., Daily" },
      ]} addLabel="Add Supplement" />
      <DynamicList label="Hormone Therapy" items={data.hormoneTherapy || []} onChange={(v) => u("hormoneTherapy", v)} fields={[
        { key: "name", label: "Hormone", placeholder: "e.g., Testosterone cypionate" },
        { key: "dosage", label: "Dosage", placeholder: "e.g., 200mg/mL" },
        { key: "frequency", label: "Frequency", placeholder: "e.g., Weekly" },
        { key: "prescribedBy", label: "Prescribed By", placeholder: "Doctor name" },
      ]} addLabel="Add Hormone Therapy" />
      <DynamicList label="Peptide Therapy" items={data.peptideTherapy || []} onChange={(v) => u("peptideTherapy", v)} fields={[
        { key: "name", label: "Peptide", placeholder: "e.g., BPC-157" },
        { key: "dosage", label: "Dosage", placeholder: "e.g., 250mcg" },
        { key: "frequency", label: "Frequency", placeholder: "e.g., Twice daily" },
      ]} addLabel="Add Peptide" />
      <BoolField label="Have you had adverse reactions to any medication?" value={data.hasAdverseReactions} onChange={(v) => u("hasAdverseReactions", v)} />
      {data.hasAdverseReactions && <TextField label="Describe adverse reactions" value={data.adverseReactionDetails || ""} onChange={(v) => u("adverseReactionDetails", v)} multiline />}
    </div>
  );
}

function FamilyHistorySection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Family Medical History" description="Understanding your family's health history helps identify potential risks." />
      <DynamicList label="Family Members" items={data.familyMembers || []} onChange={(v) => u("familyMembers", v)} fields={[
        { key: "relation", label: "Relation", placeholder: "e.g., Mother, Father" },
        { key: "conditions", label: "Conditions", placeholder: "e.g., Heart disease, Diabetes" },
        { key: "ageOfOnset", label: "Age of Onset", placeholder: "e.g., 55" },
        { key: "causeOfDeath", label: "Cause of Death (if applicable)", placeholder: "Leave blank if alive" },
      ]} addLabel="Add Family Member" />
      <MultiCheckField label="Known Genetic Conditions in Family" options={[
        "Heart Disease", "Cancer", "Diabetes", "Alzheimer's", "Parkinson's",
        "Autoimmune", "Mental Health", "Thyroid", "High Blood Pressure", "Stroke",
      ]} selected={data.knownGeneticConditions || []} onChange={(v) => u("knownGeneticConditions", v)} />
      <BoolField label="Do you have hereditary health concerns?" value={data.hasHereditaryConcerns} onChange={(v) => u("hasHereditaryConcerns", v)} />
      {data.hasHereditaryConcerns && <TextField label="Hereditary concerns" value={data.hereditaryConcernsNotes || ""} onChange={(v) => u("hereditaryConcernsNotes", v)} multiline />}
      <TextField label="Additional family history notes" value={data.familyHistoryNotes || ""} onChange={(v) => u("familyHistoryNotes", v)} multiline />
    </div>
  );
}

function LifestyleSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Lifestyle & Daily Habits" description="Your daily routines and habits paint a picture of your overall wellness." />
      <SelectField label="Smoking Status" value={data.smokingStatus || ""} onChange={(v) => u("smokingStatus", v)} options={[
        { value: "never", label: "Never smoked" }, { value: "former", label: "Former smoker" },
        { value: "current", label: "Current smoker" }, { value: "vape", label: "Vape/E-cigarette" },
      ]} />
      {(data.smokingStatus === "current" || data.smokingStatus === "vape") && <TextField label="Details" value={data.smokingDetails || ""} onChange={(v) => u("smokingDetails", v)} placeholder="How much, how long?" />}
      <SelectField label="Alcohol Use" value={data.alcoholUse || ""} onChange={(v) => u("alcoholUse", v)} options={[
        { value: "none", label: "None" }, { value: "social", label: "Social / Occasional" },
        { value: "moderate", label: "Moderate (3-7 drinks/week)" }, { value: "heavy", label: "Heavy (7+ drinks/week)" },
      ]} />
      <SelectField label="Cannabis Use" value={data.cannabisUse || ""} onChange={(v) => u("cannabisUse", v)} options={[
        { value: "none", label: "None" }, { value: "occasional", label: "Occasional" },
        { value: "regular", label: "Regular" }, { value: "medical", label: "Medical use" },
      ]} />
      <SelectField label="Caffeine Intake" value={data.caffeineIntake || ""} onChange={(v) => u("caffeineIntake", v)} options={[
        { value: "none", label: "None" }, { value: "1-2", label: "1-2 cups/day" },
        { value: "3-4", label: "3-4 cups/day" }, { value: "5+", label: "5+ cups/day" },
      ]} />
      <SelectField label="Daily Water Intake" value={data.waterIntakeDaily || ""} onChange={(v) => u("waterIntakeDaily", v)} options={[
        { value: "less-than-4", label: "Less than 4 glasses" }, { value: "4-6", label: "4-6 glasses" },
        { value: "6-8", label: "6-8 glasses" }, { value: "8+", label: "8+ glasses" },
      ]} />
      <SelectField label="Daily Screen Time" value={data.screenTimeDaily || ""} onChange={(v) => u("screenTimeDaily", v)} options={[
        { value: "1-3", label: "1-3 hours" }, { value: "3-6", label: "3-6 hours" },
        { value: "6-10", label: "6-10 hours" }, { value: "10+", label: "10+ hours" },
      ]} />
      <Separator className="my-2" />
      <p className="text-sm font-medium text-foreground">Wellness Practices</p>
      <SelectField label="Sauna Use" value={data.saunaUse || ""} onChange={(v) => u("saunaUse", v)} options={[
        { value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally" },
        { value: "weekly", label: "Weekly" }, { value: "multiple-weekly", label: "Multiple times/week" },
      ]} />
      <SelectField label="Cold Exposure (cold plunge, cold shower)" value={data.coldExposure || ""} onChange={(v) => u("coldExposure", v)} options={[
        { value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally" },
        { value: "weekly", label: "Weekly" }, { value: "daily", label: "Daily" },
      ]} />
      <SelectField label="Meditation Practice" value={data.meditationPractice || ""} onChange={(v) => u("meditationPractice", v)} options={[
        { value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally" },
        { value: "weekly", label: "Weekly" }, { value: "daily", label: "Daily" },
      ]} />
      <SelectField label="Breathwork Practice" value={data.breathworkPractice || ""} onChange={(v) => u("breathworkPractice", v)} options={[
        { value: "never", label: "Never" }, { value: "occasionally", label: "Occasionally" },
        { value: "weekly", label: "Weekly" }, { value: "daily", label: "Daily" },
      ]} />
      <TextField label="Describe a typical day for you" value={data.typicalDayDescription || ""} onChange={(v) => u("typicalDayDescription", v)} multiline placeholder="Walk us through your average day from morning to night..." />
    </div>
  );
}

function NutritionSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Nutrition & Diet" description="What you eat fuels everything. Help us understand your current nutrition." />
      <SelectField label="Dietary Pattern" value={data.dietaryPattern || ""} onChange={(v) => u("dietaryPattern", v)} options={[
        { value: "standard", label: "Standard American Diet" }, { value: "mediterranean", label: "Mediterranean" },
        { value: "keto", label: "Keto / Low Carb" }, { value: "paleo", label: "Paleo" },
        { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" },
        { value: "carnivore", label: "Carnivore" }, { value: "whole30", label: "Whole30" },
        { value: "intermittent-fasting", label: "Intermittent Fasting" }, { value: "other", label: "Other" },
      ]} />
      {data.dietaryPattern === "other" && <TextField label="Describe your diet" value={data.dietaryPatternOther || ""} onChange={(v) => u("dietaryPatternOther", v)} />}
      <SelectField label="Meals Per Day" value={data.mealsPerDay || ""} onChange={(v) => u("mealsPerDay", v)} options={[
        { value: "1", label: "1 meal" }, { value: "2", label: "2 meals" },
        { value: "3", label: "3 meals" }, { value: "4+", label: "4+ meals" },
        { value: "grazing", label: "Grazing throughout the day" },
      ]} />
      <MultiCheckField label="Food Allergies" options={[
        "Gluten", "Dairy", "Eggs", "Nuts", "Shellfish", "Soy", "Corn", "Nightshades",
      ]} selected={data.foodAllergies || []} onChange={(v) => u("foodAllergies", v)} />
      <TextField label="Foods You Enjoy" value={data.foodsEnjoy || ""} onChange={(v) => u("foodsEnjoy", v)} multiline placeholder="What foods do you love eating?" />
      <TextField label="Foods You Avoid" value={data.foodsAvoid || ""} onChange={(v) => u("foodsAvoid", v)} multiline placeholder="What foods do you avoid or dislike?" />
      <Separator className="my-2" />
      <p className="text-sm font-medium text-foreground">Typical Meals</p>
      <TextField label="Breakfast" value={data.typicalBreakfast || ""} onChange={(v) => u("typicalBreakfast", v)} placeholder="What do you typically eat for breakfast?" />
      <TextField label="Lunch" value={data.typicalLunch || ""} onChange={(v) => u("typicalLunch", v)} placeholder="What do you typically eat for lunch?" />
      <TextField label="Dinner" value={data.typicalDinner || ""} onChange={(v) => u("typicalDinner", v)} placeholder="What do you typically eat for dinner?" />
      <TextField label="Snacks" value={data.typicalSnacks || ""} onChange={(v) => u("typicalSnacks", v)} placeholder="What do you snack on?" />
      <SelectField label="Eating Out Frequency" value={data.eatingOutFrequency || ""} onChange={(v) => u("eatingOutFrequency", v)} options={[
        { value: "rarely", label: "Rarely" }, { value: "1-2-week", label: "1-2 times/week" },
        { value: "3-5-week", label: "3-5 times/week" }, { value: "daily", label: "Almost daily" },
      ]} />
      <TextField label="Nutrition Goals" value={data.nutritionGoals || ""} onChange={(v) => u("nutritionGoals", v)} multiline placeholder="What would you like to change about your diet?" />
    </div>
  );
}

function ExerciseSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Exercise & Physical Activity" description="Movement is medicine. Tell us about your current fitness routine." />
      <SelectField label="Current Activity Level" value={data.currentActivityLevel || ""} onChange={(v) => u("currentActivityLevel", v)} options={[
        { value: "sedentary", label: "Sedentary (little to no exercise)" },
        { value: "light", label: "Lightly active (1-2 days/week)" },
        { value: "moderate", label: "Moderately active (3-4 days/week)" },
        { value: "active", label: "Active (5-6 days/week)" },
        { value: "very-active", label: "Very active (daily, intense)" },
      ]} />
      <MultiCheckField label="Types of Exercise" options={[
        "Weight Training", "Running", "Walking", "Cycling", "Swimming", "Yoga",
        "Pilates", "CrossFit", "HIIT", "Martial Arts", "Tennis/Racquet Sports",
        "Golf", "Hiking", "Rock Climbing", "Dance", "Group Fitness",
      ]} selected={data.exerciseTypes || []} onChange={(v) => u("exerciseTypes", v)} />
      <SelectField label="Strength Training Frequency" value={data.strengthTrainingFrequency || ""} onChange={(v) => u("strengthTrainingFrequency", v)} options={[
        { value: "never", label: "Never" }, { value: "1-2", label: "1-2 times/week" },
        { value: "3-4", label: "3-4 times/week" }, { value: "5+", label: "5+ times/week" },
      ]} />
      <SelectField label="Cardio Frequency" value={data.cardioFrequency || ""} onChange={(v) => u("cardioFrequency", v)} options={[
        { value: "never", label: "Never" }, { value: "1-2", label: "1-2 times/week" },
        { value: "3-4", label: "3-4 times/week" }, { value: "5+", label: "5+ times/week" },
      ]} />
      <TextField label="Average Daily Steps" value={data.dailySteps || ""} onChange={(v) => u("dailySteps", v)} placeholder="e.g., 8,000" />
      <TextField label="Hours Sedentary Per Day" value={data.sedentaryHours || ""} onChange={(v) => u("sedentaryHours", v)} placeholder="e.g., 8 hours at desk" />
      <TextField label="Physical Limitations or Injuries" value={data.physicalLimitations || ""} onChange={(v) => u("physicalLimitations", v)} multiline placeholder="Any injuries, limitations, or areas to be careful with?" />
      <BoolField label="Do you work with a personal trainer?" value={data.hasPersonalTrainer} onChange={(v) => u("hasPersonalTrainer", v)} />
      {data.hasPersonalTrainer && <TextField label="Trainer details" value={data.trainerDetails || ""} onChange={(v) => u("trainerDetails", v)} placeholder="Name, frequency, focus areas" />}
      <TextField label="Fitness Goals" value={data.fitnessGoals || ""} onChange={(v) => u("fitnessGoals", v)} multiline placeholder="What do you want to achieve with your fitness?" />
    </div>
  );
}

function SleepSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Sleep & Recovery" description="Quality sleep is the foundation of health. Let's understand your sleep patterns." />
      <SelectField label="Average Sleep Hours" value={data.averageSleepHours || ""} onChange={(v) => u("averageSleepHours", v)} options={[
        { value: "less-than-5", label: "Less than 5 hours" }, { value: "5-6", label: "5-6 hours" },
        { value: "6-7", label: "6-7 hours" }, { value: "7-8", label: "7-8 hours" },
        { value: "8-9", label: "8-9 hours" }, { value: "9+", label: "9+ hours" },
      ]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Typical Bedtime" value={data.bedtime || ""} onChange={(v) => u("bedtime", v)} placeholder="e.g., 10:30 PM" />
        <TextField label="Typical Wake Time" value={data.wakeTime || ""} onChange={(v) => u("wakeTime", v)} placeholder="e.g., 6:30 AM" />
      </div>
      <SelectField label="Sleep Quality" value={data.sleepQuality || ""} onChange={(v) => u("sleepQuality", v)} options={[
        { value: "excellent", label: "Excellent — I wake refreshed" },
        { value: "good", label: "Good — Mostly restful" },
        { value: "fair", label: "Fair — Could be better" },
        { value: "poor", label: "Poor — Frequently disrupted" },
        { value: "terrible", label: "Terrible — Barely sleeping" },
      ]} />
      <SelectField label="Time to Fall Asleep" value={data.fallAsleepTime || ""} onChange={(v) => u("fallAsleepTime", v)} options={[
        { value: "under-10", label: "Under 10 minutes" }, { value: "10-20", label: "10-20 minutes" },
        { value: "20-45", label: "20-45 minutes" }, { value: "45+", label: "45+ minutes" },
      ]} />
      <SelectField label="Night Wakings" value={data.nightWakings || ""} onChange={(v) => u("nightWakings", v)} options={[
        { value: "none", label: "None" }, { value: "1", label: "Once" },
        { value: "2-3", label: "2-3 times" }, { value: "4+", label: "4+ times" },
      ]} />
      <BoolField label="Do you snore?" value={data.hasSnoring} onChange={(v) => u("hasSnoring", v)} />
      <BoolField label="Diagnosed with sleep apnea?" value={data.hasSleepApnea} onChange={(v) => u("hasSleepApnea", v)} />
      {data.hasSleepApnea && <TextField label="Sleep apnea treatment" value={data.sleepApneaTreatment || ""} onChange={(v) => u("sleepApneaTreatment", v)} placeholder="CPAP, oral appliance, etc." />}
      <BoolField label="Do you use a sleep tracker?" value={data.useSleepTracker} onChange={(v) => u("useSleepTracker", v)} />
      {data.useSleepTracker && <TextField label="Which tracker?" value={data.sleepTrackerType || ""} onChange={(v) => u("sleepTrackerType", v)} placeholder="e.g., Oura Ring, Whoop, Apple Watch" />}
      <TextField label="Sleep aids (supplements, medications, etc.)" value={data.sleepAids || ""} onChange={(v) => u("sleepAids", v)} placeholder="e.g., Melatonin, Magnesium, Ambien" />
      <TextField label="Sleep environment" value={data.sleepEnvironment || ""} onChange={(v) => u("sleepEnvironment", v)} multiline placeholder="Describe your bedroom: dark/light, cool/warm, noisy/quiet, partner, pets..." />
      <TextField label="Sleep goals" value={data.sleepGoals || ""} onChange={(v) => u("sleepGoals", v)} multiline placeholder="What would you like to improve about your sleep?" />
    </div>
  );
}

function MentalHealthSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Mental Health & Stress" description="Your mental and emotional wellbeing is just as important as physical health." />
      <SliderField label="Overall Mood (past 2 weeks)" value={data.overallMoodRating || 5} onChange={(v) => u("overallMoodRating", v)} labels={["Low", "Great"]} />
      <SliderField label="Current Stress Level" value={data.stressLevel || 5} onChange={(v) => u("stressLevel", v)} labels={["Minimal", "Extreme"]} />
      <MultiCheckField label="Primary Stressors" options={[
        "Work", "Finances", "Relationships", "Health", "Family",
        "Loneliness", "Career Change", "Grief/Loss", "Parenting",
        "World Events", "Identity/Purpose", "Aging",
      ]} selected={data.primaryStressors || []} onChange={(v) => u("primaryStressors", v)} />
      <SelectField label="Anxiety Frequency" value={data.anxietyFrequency || ""} onChange={(v) => u("anxietyFrequency", v)} options={[
        { value: "never", label: "Never" }, { value: "rarely", label: "Rarely" },
        { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" },
        { value: "daily", label: "Daily" },
      ]} />
      <SelectField label="History of Depression" value={data.depressionHistory || ""} onChange={(v) => u("depressionHistory", v)} options={[
        { value: "none", label: "None" }, { value: "past", label: "Past episode(s)" },
        { value: "current", label: "Currently experiencing" }, { value: "managed", label: "Managed with treatment" },
      ]} />
      <BoolField label="Currently in therapy?" value={data.currentTherapy} onChange={(v) => u("currentTherapy", v)} />
      {data.currentTherapy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Therapist Name" value={data.therapistName || ""} onChange={(v) => u("therapistName", v)} />
          <TextField label="Type of Therapy" value={data.therapyType || ""} onChange={(v) => u("therapyType", v)} placeholder="e.g., CBT, EMDR, Talk therapy" />
        </div>
      )}
      <MultiCheckField label="Coping Strategies You Use" options={[
        "Exercise", "Meditation", "Journaling", "Therapy", "Social Support",
        "Nature/Outdoors", "Creative Outlets", "Prayer/Spirituality", "Breathwork",
        "Reading", "Music", "Cooking",
      ]} selected={data.copingStrategies || []} onChange={(v) => u("copingStrategies", v)} />
      <SliderField label="Self-Esteem Rating" value={data.selfEsteemRating || 5} onChange={(v) => u("selfEsteemRating", v)} labels={["Low", "High"]} />
      <SliderField label="Life Satisfaction" value={data.lifesSatisfactionRating || 5} onChange={(v) => u("lifesSatisfactionRating", v)} labels={["Low", "High"]} />
      <TextField label="Mental health goals" value={data.mentalHealthGoals || ""} onChange={(v) => u("mentalHealthGoals", v)} multiline placeholder="What would you like to improve about your mental/emotional wellbeing?" />
    </div>
  );
}

function GoalsSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Goals & Motivations" description="What brought you here? Let's understand what you want to achieve." />
      <MultiCheckField label="Primary Health Goals" options={[
        "Weight Loss", "Muscle Gain", "Hormone Optimization", "Better Sleep",
        "More Energy", "Stress Reduction", "Longevity", "Athletic Performance",
        "Mental Clarity", "Pain Management", "Gut Health", "Immune Support",
        "Anti-Aging", "Disease Prevention", "Fertility", "Recovery from Illness",
      ]} selected={data.primaryHealthGoals || []} onChange={(v) => u("primaryHealthGoals", v)} />
      <TextField label="Your Top 3 Goals (in your own words)" value={data.topThreeGoals || ""} onChange={(v) => u("topThreeGoals", v)} multiline placeholder="1. ...\n2. ...\n3. ..." />
      <TextField label="Biggest Health Concern Right Now" value={data.biggestHealthConcern || ""} onChange={(v) => u("biggestHealthConcern", v)} multiline placeholder="What worries you most about your health?" />
      <TextField label="What does optimal health look like for you?" value={data.whatDoesOptimalHealthLookLike || ""} onChange={(v) => u("whatDoesOptimalHealthLookLike", v)} multiline placeholder="Paint a picture of your ideal health state..." />
      <SliderField label="Motivation Level" value={data.motivationLevel || 5} onChange={(v) => u("motivationLevel", v)} labels={["Low", "Very High"]} />
      <SelectField label="Readiness to Change" value={data.readinessToChange || ""} onChange={(v) => u("readinessToChange", v)} options={[
        { value: "not-ready", label: "Not ready yet — just exploring" },
        { value: "thinking", label: "Thinking about it" },
        { value: "ready", label: "Ready to start" },
        { value: "already-started", label: "Already making changes" },
        { value: "all-in", label: "All in — let's go!" },
      ]} />
      <TextField label="Previous attempts at health improvement" value={data.previousAttempts || ""} onChange={(v) => u("previousAttempts", v)} multiline placeholder="What have you tried before? What worked and what didn't?" />
      <TextField label="Barriers to achieving your goals" value={data.barriers || ""} onChange={(v) => u("barriers", v)} multiline placeholder="What gets in the way? Time, motivation, knowledge, support?" />
      <TextField label="Ideal outcome in 6 months" value={data.idealOutcomeIn6Months || ""} onChange={(v) => u("idealOutcomeIn6Months", v)} multiline />
      <TextField label="Ideal outcome in 1 year" value={data.idealOutcomeIn1Year || ""} onChange={(v) => u("idealOutcomeIn1Year", v)} multiline />
      <TextField label="Ideal outcome in 5 years" value={data.idealOutcomeIn5Years || ""} onChange={(v) => u("idealOutcomeIn5Years", v)} multiline />
      <SelectField label="Accountability Preference" value={data.accountabilityPreference || ""} onChange={(v) => u("accountabilityPreference", v)} options={[
        { value: "self-directed", label: "Self-directed — I'll check in when needed" },
        { value: "light-touch", label: "Light touch — Monthly check-ins" },
        { value: "moderate", label: "Moderate — Weekly check-ins" },
        { value: "high", label: "High — Frequent contact and tracking" },
      ]} />
    </div>
  );
}

function LifeStatusSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Life & Relationships" description="Your relationships and life context shape your health journey." />
      <SelectField label="Relationship Status" value={data.relationshipStatus || ""} onChange={(v) => u("relationshipStatus", v)} options={[
        { value: "single", label: "Single" }, { value: "dating", label: "Dating" },
        { value: "committed", label: "In a committed relationship" }, { value: "married", label: "Married" },
        { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" },
      ]} />
      <TextField label="Partner's name (if applicable)" value={data.partnerName || ""} onChange={(v) => u("partnerName", v)} />
      <TextField label="Is your partner on a health journey too?" value={data.partnerHealthJourney || ""} onChange={(v) => u("partnerHealthJourney", v)} placeholder="Are they supportive? Doing it together?" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Number of Children" value={data.numberOfChildren || ""} onChange={(v) => u("numberOfChildren", v)} placeholder="0, 1, 2..." />
        <TextField label="Children's Ages" value={data.childrenAges || ""} onChange={(v) => u("childrenAges", v)} placeholder="e.g., 5, 8, 12" />
      </div>
      <SelectField label="Living Arrangement" value={data.livingArrangement || ""} onChange={(v) => u("livingArrangement", v)} options={[
        { value: "alone", label: "Live alone" }, { value: "partner", label: "With partner/spouse" },
        { value: "family", label: "With family" }, { value: "roommates", label: "With roommates" },
        { value: "other", label: "Other" },
      ]} />
      <TextField label="Family Dynamics" value={data.familyDynamics || ""} onChange={(v) => u("familyDynamics", v)} multiline placeholder="How would you describe your family relationships?" />
      <SelectField label="Social Circle Size" value={data.socialCircleSize || ""} onChange={(v) => u("socialCircleSize", v)} options={[
        { value: "small", label: "Small (1-3 close friends)" }, { value: "medium", label: "Medium (4-8 close friends)" },
        { value: "large", label: "Large (9+ close friends)" }, { value: "minimal", label: "Minimal social connections" },
      ]} />
      <SelectField label="Social Activity Frequency" value={data.socialActivityFrequency || ""} onChange={(v) => u("socialActivityFrequency", v)} options={[
        { value: "rarely", label: "Rarely" }, { value: "monthly", label: "Monthly" },
        { value: "weekly", label: "Weekly" }, { value: "multiple-weekly", label: "Multiple times/week" },
      ]} />
      <TextField label="Community Involvement" value={data.communityInvolvement || ""} onChange={(v) => u("communityInvolvement", v)} placeholder="Clubs, organizations, groups..." />
      <TextField label="Spiritual or Faith Practice" value={data.spiritualPractice || ""} onChange={(v) => u("spiritualPractice", v)} placeholder="Meditation, church, yoga community..." />
      <TextField label="Pets" value={data.petTypes || ""} onChange={(v) => u("petTypes", v)} placeholder="e.g., 2 dogs, 1 cat" />
      <SelectField label="Work-Life Balance" value={data.workLifeBalance || ""} onChange={(v) => u("workLifeBalance", v)} options={[
        { value: "excellent", label: "Excellent" }, { value: "good", label: "Good" },
        { value: "needs-work", label: "Needs improvement" }, { value: "poor", label: "Poor — work dominates" },
      ]} />
      <SelectField label="Financial Stress Level" value={data.financialStressLevel || ""} onChange={(v) => u("financialStressLevel", v)} options={[
        { value: "none", label: "None" }, { value: "mild", label: "Mild" },
        { value: "moderate", label: "Moderate" }, { value: "significant", label: "Significant" },
      ]} />
      <TextField label="Career Satisfaction" value={data.careerSatisfaction || ""} onChange={(v) => u("careerSatisfaction", v)} placeholder="How do you feel about your career?" />
      <TextField label="Current Life Transitions" value={data.lifeTransitions || ""} onChange={(v) => u("lifeTransitions", v)} multiline placeholder="Any major changes happening? New job, move, retirement, empty nest..." />
      <TextField label="Support System" value={data.supportSystem || ""} onChange={(v) => u("supportSystem", v)} multiline placeholder="Who supports you? Who can you lean on?" />
    </div>
  );
}

function HobbiesSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const u = (key: string, val: any) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-4">
      <SectionTitle title="Hobbies & Identity" description="Who you are beyond your health. This helps us understand what makes you tick." />
      <MultiCheckField label="Hobbies & Interests" options={[
        "Reading", "Cooking", "Gardening", "Travel", "Photography",
        "Music", "Art/Painting", "Writing", "Gaming", "Woodworking",
        "Fishing", "Hunting", "Camping", "Yoga", "Meditation",
        "Volunteering", "DIY Projects", "Wine/Beer", "Cars", "Tech/Gadgets",
      ]} selected={data.hobbies || []} onChange={(v) => u("hobbies", v)} />
      <TextField label="Other hobbies not listed" value={data.hobbiesOther || ""} onChange={(v) => u("hobbiesOther", v)} placeholder="Anything else you enjoy?" />
      <TextField label="Creative Outlets" value={data.creativeOutlets || ""} onChange={(v) => u("creativeOutlets", v)} placeholder="How do you express creativity?" />
      <TextField label="Outdoor Activities" value={data.outdoorActivities || ""} onChange={(v) => u("outdoorActivities", v)} placeholder="Hiking, kayaking, gardening..." />
      <TextField label="What are you currently learning or curious about?" value={data.learningInterests || ""} onChange={(v) => u("learningInterests", v)} multiline />
      <TextField label="Personal Projects" value={data.personalProjects || ""} onChange={(v) => u("personalProjects", v)} multiline placeholder="Any passion projects you're working on?" />
      <TextField label="Bucket List Items" value={data.bucketListItems || ""} onChange={(v) => u("bucketListItems", v)} multiline placeholder="What do you want to experience in life?" />
      <Separator className="my-2" />
      <p className="text-sm font-medium text-foreground">Values & Identity</p>
      <MultiCheckField label="Personal Values" options={[
        "Family", "Health", "Freedom", "Adventure", "Creativity",
        "Knowledge", "Community", "Spirituality", "Achievement", "Balance",
        "Authenticity", "Compassion", "Growth", "Legacy", "Joy",
      ]} selected={data.personalValues || []} onChange={(v) => u("personalValues", v)} />
      <TextField label="What brings you the most joy?" value={data.whatBringsJoy || ""} onChange={(v) => u("whatBringsJoy", v)} multiline />
      <TextField label="What drains your energy?" value={data.whatDrainsEnergy || ""} onChange={(v) => u("whatDrainsEnergy", v)} multiline />
      <TextField label="Describe your ideal weekend" value={data.idealWeekend || ""} onChange={(v) => u("idealWeekend", v)} multiline />
      <TextField label="Personal motto or philosophy" value={data.personalMotto || ""} onChange={(v) => u("personalMotto", v)} placeholder="A phrase that guides you..." />
      <TextField label="Who are your role models?" value={data.roleModels || ""} onChange={(v) => u("roleModels", v)} />
      <TextField label="What legacy do you want to leave?" value={data.legacyGoals || ""} onChange={(v) => u("legacyGoals", v)} multiline placeholder="How do you want to be remembered?" />
    </div>
  );
}

// ─── Section Renderer Map ───
const sectionComponents: Record<string, React.FC<{ data: any; onChange: (d: any) => void }>> = {
  personalInfo: PersonalInfoSection,
  medicalHistory: MedicalHistorySection,
  medicationsSupplements: MedicationsSection,
  familyHistory: FamilyHistorySection,
  lifestyleHabits: LifestyleSection,
  nutritionDiet: NutritionSection,
  exerciseFitness: ExerciseSection,
  sleepRecovery: SleepSection,
  mentalHealthStress: MentalHealthSection,
  goalsMotivations: GoalsSection,
  lifeStatusRelationships: LifeStatusSection,
  hobbiesInterests: HobbiesSection,
};

// ─── Main Component ───

export default function PatientIntake() {
  const [, navigate] = useLocation();
  const intakeQuery = trpc.intake.mine.useQuery();
  const saveSectionMut = trpc.intake.saveSection.useMutation();
  const submitMut = trpc.intake.submit.useMutation();
  const utils = trpc.useUtils();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>({});
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load existing data
  useEffect(() => {
    if (intakeQuery.data) {
      setFormData((intakeQuery.data.formData as IntakeFormData) || {});
      setCompletedSections((intakeQuery.data.completedSections as string[]) || []);
      setCurrentStep(intakeQuery.data.currentSection || 0);
      setIsSubmitted(intakeQuery.data.status === "completed");
    }
  }, [intakeQuery.data]);

  const currentSectionKey = INTAKE_SECTIONS[currentStep]?.key as IntakeSectionKey;
  const currentSectionData = formData[currentSectionKey] || {};
  const SectionComponent = sectionComponents[currentSectionKey];

  const progress = useMemo(() => {
    return Math.round((completedSections.length / INTAKE_SECTIONS.length) * 100);
  }, [completedSections]);

  const handleSectionChange = useCallback((data: any) => {
    setFormData((prev) => ({ ...prev, [currentSectionKey]: data }));
    setHasUnsaved(true);
  }, [currentSectionKey]);

  const saveCurrentSection = useCallback(async () => {
    try {
      await saveSectionMut.mutateAsync({
        sectionKey: currentSectionKey,
        sectionData: formData[currentSectionKey] || {},
        currentSection: currentStep,
      });
      if (!completedSections.includes(currentSectionKey)) {
        setCompletedSections((prev) => [...prev, currentSectionKey]);
      }
      setHasUnsaved(false);
      toast.success("Section saved");
    } catch {
      toast.error("Failed to save section");
    }
  }, [currentSectionKey, formData, currentStep, completedSections, saveSectionMut]);

  const goNext = useCallback(async () => {
    await saveCurrentSection();
    if (currentStep < INTAKE_SECTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [saveCurrentSection, currentStep]);

  const goPrev = useCallback(async () => {
    if (hasUnsaved) await saveCurrentSection();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [saveCurrentSection, currentStep, hasUnsaved]);

  const handleSubmit = useCallback(async () => {
    await saveCurrentSection();
    try {
      await submitMut.mutateAsync();
      setIsSubmitted(true);
      utils.intake.mine.invalidate();
      toast.success("Intake form submitted successfully!");
    } catch {
      toast.error("Failed to submit intake form");
    }
  }, [saveCurrentSection, submitMut, utils]);

  if (intakeQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 border border-gold/15">
            <Check className="h-10 w-10 text-gold" />
          </div>
          <h1 className="text-2xl font-heading font-semibold text-foreground mb-3">Intake Form Completed</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for completing your comprehensive intake form. Your provider will review your responses
            and use them to create a personalized care plan.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setIsSubmitted(false); setCurrentStep(0); }} variant="outline" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Review Answers
            </Button>
            <Button onClick={() => navigate("/patient")} className="bg-gold hover:bg-gold-light text-black gap-2">
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-semibold text-foreground">Health Intake Form</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Take your time — your progress is saved automatically. You can return to finish later.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs font-medium text-muted-foreground shrink-0">{progress}% complete</span>
        </div>
      </div>

      {/* Section Navigation (horizontal scroll on mobile) */}
      <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-1.5 min-w-max">
          {INTAKE_SECTIONS.map((section, idx) => {
            const Icon = sectionIcons[section.icon] || ClipboardList;
            const isCompleted = completedSections.includes(section.key);
            const isCurrent = idx === currentStep;
            return (
              <button
                key={section.key}
                onClick={async () => {
                  if (hasUnsaved) await saveCurrentSection();
                  setCurrentStep(idx);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isCurrent
                    ? "bg-gold text-black shadow-sm"
                    : isCompleted
                    ? "bg-gold/10 text-gold hover:bg-gold/15"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Section */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSectionKey}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {SectionComponent && (
                <SectionComponent data={currentSectionData} onChange={handleSectionChange} />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Inline Navigation — visible on mobile below the form card (above bottom tab bar) */}
      <div className="md:hidden mt-6 mb-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={saveCurrentSection}
            disabled={saveSectionMut.isPending}
            className="text-xs gap-1.5"
          >
            {saveSectionMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>

          {currentStep === INTAKE_SECTIONS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMut.isPending}
              className="bg-gold hover:bg-gold-light text-black gap-1.5"
            >
              {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Submit Form
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={saveSectionMut.isPending}
              className="bg-gold hover:bg-gold-light text-black gap-1.5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Fixed Navigation Footer — desktop only (hidden on mobile where inline buttons are used) */}
      <div className="hidden md:block fixed bottom-0 left-64 right-0 bg-sidebar/95 backdrop-blur-md border-t border-border/50 px-4 py-3 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveCurrentSection}
              disabled={saveSectionMut.isPending}
              className="text-xs gap-1.5"
            >
              {saveSectionMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>

            {currentStep === INTAKE_SECTIONS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitMut.isPending}
                className="bg-gold hover:bg-gold-light text-black gap-1.5"
              >
                {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit Form
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={saveSectionMut.isPending}
                className="bg-gold hover:bg-gold-light text-black gap-1.5"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
