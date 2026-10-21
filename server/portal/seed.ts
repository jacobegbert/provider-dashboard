import { DEMO_CLINICIAN, DEMO_PATIENT, SAMPLE_PREFIX } from "../../shared/demo";
import { hashPassword } from "./password";
import type { NewPlanItem, PortalStore } from "./types";

function sample(text: string) {
  return `${SAMPLE_PREFIX} ${text}`;
}

/**
 * Fictional walkthrough data. Every protocol line is a sample template.
 */
export async function ensureSeed(store: PortalStore) {
  const existing = await store.getUserByEmail(DEMO_CLINICIAN.email);
  if (existing) return;

  await store.upsertUser({
    openId: DEMO_CLINICIAN.openId,
    name: DEMO_CLINICIAN.name,
    email: DEMO_CLINICIAN.email,
    role: "admin",
    loginMethod: "password",
    passwordHash: hashPassword(DEMO_CLINICIAN.password),
  });
  await store.upsertUser({
    openId: DEMO_PATIENT.openId,
    name: DEMO_PATIENT.name,
    email: DEMO_PATIENT.email,
    role: "user",
    loginMethod: "password",
    passwordHash: hashPassword(DEMO_PATIENT.password),
  });

  const clinician = await store.getUserByEmail(DEMO_CLINICIAN.email);
  const patientUser = await store.getUserByEmail(DEMO_PATIENT.email);
  if (!clinician || !patientUser) throw new Error("Demo users were not created");

  const morgan = await store.insertPatient({
    userId: patientUser.id,
    providerId: clinician.id,
    firstName: "Morgan",
    lastName: "Hale",
    email: "morgan.hale@example.com",
    phone: "555-0148",
    dateOfBirth: "1991-04-12",
    status: "active",
    healthGoals: ["Steadier sleep", "Daytime energy"],
    conditions: ["Seasonal allergies (demo)"],
    notes: "Fictional chart for the portal walkthrough.",
  });

  const quinn = await store.insertPatient({
    userId: null,
    providerId: clinician.id,
    firstName: "Quinn",
    lastName: "Adler",
    email: "quinn.adler@example.com",
    phone: "555-0192",
    dateOfBirth: "1984-11-02",
    status: "active",
    healthGoals: ["Training recovery"],
    conditions: ["Demo chart only"],
    notes: "Second fictional chart. Morgan's login cannot open it.",
  });

  const morganSummary = sample(
    "Fictional published plan for the walkthrough: a supplement line, a peptide line, and a clinic-managed regenerative entry.",
  );
  const morganPlan = await store.insertPlan({
    patientId: morgan.id,
    providerId: clinician.id,
    summary: morganSummary,
    publishedSummary: morganSummary,
    version: 1,
    publishedAt: new Date("2026-09-12T15:00:00Z"),
  });

  const quinnSummary = sample("Quinn's fictional plan is a separate chart and is not part of Morgan's portal.");
  const quinnPlan = await store.insertPlan({
    patientId: quinn.id,
    providerId: clinician.id,
    summary: quinnSummary,
    publishedSummary: quinnSummary,
    version: 1,
    publishedAt: new Date("2026-08-02T15:00:00Z"),
  });

  const morganDrafts: Array<Omit<NewPlanItem, "planId" | "patientId" | "phase" | "sourceItemId">> = [
    {
      kind: "medication",
      name: "Sample vitamin D3 template",
      dose: "5000",
      unit: "IU",
      route: "oral",
      frequency: "daily with breakfast",
      instructions: sample("Demonstration supplement line. Not a dose recommendation."),
      status: "active",
      isSampleTemplate: true,
      sortOrder: 1,
    },
    {
      kind: "peptide",
      name: "Sample peptide template BPC-157",
      dose: "250",
      unit: "mcg",
      route: "subcutaneous",
      frequency: "sample schedule, five days on",
      instructions: sample("Demonstration peptide line. Not a prescription and not a compounding instruction."),
      status: "active",
      isSampleTemplate: true,
      sortOrder: 2,
    },
    {
      kind: "regenerative",
      name: "Sample cell protocol — clinic managed",
      dose: null,
      unit: null,
      route: "in clinic",
      frequency: "per clinic visit",
      instructions: sample("Clinic-managed protocol entry. It is not dispensed and it does not create a pharmacy order."),
      status: "clinic_managed",
      isSampleTemplate: true,
      sortOrder: 3,
    },
    {
      kind: "note",
      name: "How to read this plan",
      dose: null,
      unit: null,
      route: null,
      frequency: null,
      instructions: sample("Published notes are the only plan text a patient can see. Draft edits stay in the clinic until publish."),
      status: "active",
      isSampleTemplate: true,
      sortOrder: 4,
    },
  ];

  for (const draft of morganDrafts) {
    const saved = await store.insertItem({
      ...draft,
      planId: morganPlan.id,
      patientId: morgan.id,
      phase: "draft",
      sourceItemId: null,
    });
    await store.insertItem({
      ...draft,
      planId: morganPlan.id,
      patientId: morgan.id,
      phase: "published",
      sourceItemId: saved.id,
    });
  }

  const quinnPeptide = await store.insertItem({
    planId: quinnPlan.id,
    patientId: quinn.id,
    phase: "draft",
    sourceItemId: null,
    kind: "peptide",
    name: "Sample peptide template TB-500",
    dose: "2",
    unit: "mg",
    route: "subcutaneous",
    frequency: "sample weekly",
    instructions: sample("This line belongs to Quinn Adler only."),
    status: "active",
    isSampleTemplate: true,
    sortOrder: 1,
  });
  await store.insertItem({
    planId: quinnPlan.id,
    patientId: quinn.id,
    phase: "published",
    sourceItemId: quinnPeptide.id,
    kind: "peptide",
    name: quinnPeptide.name,
    dose: quinnPeptide.dose,
    unit: quinnPeptide.unit,
    route: quinnPeptide.route,
    frequency: quinnPeptide.frequency,
    instructions: quinnPeptide.instructions,
    status: "active",
    isSampleTemplate: true,
    sortOrder: 1,
  });

  const morganLabs = [
    ["Vitamin D", "22", "34", "48", "ng/mL", "30", "80"],
    ["Fasting glucose", "102", "99", "94", "mg/dL", "70", "99"],
    ["hs-CRP", "2.4", "1.8", "1.1", "mg/L", null, "1.0"],
  ] as const;
  const dates = ["2026-01-16", "2026-05-20", "2026-09-18"];
  for (const row of morganLabs) {
    const [name, a, b, c, unit, low, high] = row;
    const values = [a, b, c];
    for (let index = 0; index < values.length; index += 1) {
      await store.insertLab({
        patientId: morgan.id,
        name,
        value: values[index]!,
        unit,
        referenceLow: low,
        referenceHigh: high,
        collectedOn: dates[index]!,
        note: sample("Fictional lab point for the timeline."),
      });
    }
  }
  await store.insertLab({
    patientId: quinn.id,
    name: "Ferritin",
    value: "40",
    unit: "ng/mL",
    referenceLow: "30",
    referenceHigh: "200",
    collectedOn: "2026-07-01",
    note: sample("Quinn-only lab. It must not appear on Morgan's timeline."),
  });

  await store.insertMessage({
    senderId: clinician.id,
    receiverId: patientUser.id,
    patientId: morgan.id,
    content: "Your sample plan is on the portal. The protocol lines are templates for this demo, not a prescription.",
    isRead: true,
    createdAt: new Date("2026-10-18T16:00:00Z"),
  });
  await store.insertMessage({
    senderId: patientUser.id,
    receiverId: clinician.id,
    patientId: morgan.id,
    content: "Thanks. I can see the sample plan on my side.",
    isRead: false,
    createdAt: new Date("2026-10-20T18:30:00Z"),
  });
  await store.insertMessage({
    senderId: clinician.id,
    receiverId: clinician.id,
    patientId: quinn.id,
    content: "Quinn demo thread — this note belongs only on Quinn Adler's chart.",
    isRead: true,
    createdAt: new Date("2026-10-11T15:00:00Z"),
  });

  await store.saveIntake({
    patientId: morgan.id,
    status: "completed",
    goals: "Sleep through the night and keep afternoon energy steadier. This answer is fictional.",
    currentMedications: "A daily multivitamin from the demo chart. Not a real medication list.",
    conditions: "Seasonal allergies. Demo only.",
    reviewedByProvider: true,
    providerNotes: "Reviewed for the demo chart. No clinical decision is represented here.",
    submittedAt: new Date("2026-09-01T17:00:00Z"),
    reviewedAt: new Date("2026-09-03T17:00:00Z"),
  });
  await store.saveIntake({
    patientId: quinn.id,
    status: "in_progress",
    goals: "Recovery between training blocks. Fictional and unfinished.",
    currentMedications: "",
    conditions: "",
    reviewedByProvider: false,
    providerNotes: null,
    submittedAt: null,
    reviewedAt: null,
  });

  const vitamin = (await store.listItems(morgan.id, "draft")).find((item) => item.kind === "medication");
  await store.insertOrder({
    patientId: morgan.id,
    planItemId: vitamin?.id ?? null,
    adapterId: "mock",
    externalId: "mock-seed-morgan-d3",
    changeType: "new",
    drugName: "Sample vitamin D3 template",
    details: "5000 · IU · oral · daily with breakfast · active",
    status: "accepted",
    createdAt: new Date("2026-09-12T15:05:00Z"),
  });
}
