/**
 * Full data import script — restores all patients, users, protocols, and related data
 * from the CSV export. Uses INSERT IGNORE to skip records that already exist.
 *
 * Usage: railway run node import-data.mjs
 */

import { createConnection } from "mysql2/promise";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.join(__dirname, "patient_data_export");

const conn = await createConnection(process.env.DATABASE_URL);
console.log("✅ Connected to database\n");

async function importCSV(file, tableName, transform = (r) => r) {
  const filePath = path.join(DATA_DIR, file);
  const records = [];

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true, trim: true }))
      .on("data", (row) => records.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (records.length === 0) {
    console.log(`  ⏭  ${tableName}: no records`);
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const raw of records) {
    const row = transform(raw);
    if (!row) { skipped++; continue; }

    // Convert empty strings to null
    for (const key of Object.keys(row)) {
      if (row[key] === "" || row[key] === "NULL") row[key] = null;
    }

    const cols = Object.keys(row).map(c => `\`${c}\``).join(", ");
    const placeholders = Object.keys(row).map(() => "?").join(", ");
    const vals = Object.values(row);

    try {
      await conn.execute(
        `INSERT IGNORE INTO \`${tableName}\` (${cols}) VALUES (${placeholders})`,
        vals
      );
      inserted++;
    } catch (err) {
      console.warn(`  ⚠️  ${tableName} row ${row.id}: ${err.message.slice(0, 80)}`);
      skipped++;
    }
  }

  console.log(`  ✅ ${tableName}: ${inserted} inserted, ${skipped} skipped`);
}

// ─── IMPORT ORDER (respects foreign keys) ─────────────────────────────────

console.log("📥 Importing users...");
await importCSV("users.csv", "users", (r) => ({
  id: r.id,
  openId: r.openId,
  name: r.name,
  email: r.email,
  loginMethod: r.loginMethod,
  role: r.role,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  lastSignedIn: r.lastSignedIn,
}));

console.log("\n📥 Importing patients...");
await importCSV("patients.csv", "patients", (r) => ({
  id: r.id,
  userId: r.userId || null,
  providerId: r.providerId,
  firstName: r.firstName?.trim(),
  lastName: r.lastName?.trim(),
  email: r.email || null,
  phone: r.phone?.trim() || null,
  dateOfBirth: r.dateOfBirth || null,
  sex: r.sex || null,
  status: r.status || "new",
  subscriptionTier: r.subscriptionTier || "standard",
  subscriptionExpiresAt: r.subscriptionExpiresAt || null,
  healthGoals: r.healthGoals || "[]",
  conditions: r.conditions || "[]",
  notes: r.notes || null,
  avatarUrl: r.avatarUrl || null,
  lastProviderInteraction: r.lastProviderInteraction || null,
  nextRequiredAction: r.nextRequiredAction || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  deletedAt: r.deletedAt || null,
}));

console.log("\n📥 Importing protocols...");
await importCSV("protocols.csv", "protocols", (r) => ({
  id: r.id,
  createdBy: r.createdBy,
  name: r.name,
  description: r.description || null,
  category: r.category || null,
  durationDays: r.durationDays || null,
  isTemplate: r.isTemplate === "1" || r.isTemplate === "true" ? 1 : 0,
  milestones: r.milestones || "[]",
  labCheckpoints: r.labCheckpoints || "[]",
  isArchived: r.isArchived === "1" ? 1 : 0,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  createdByPatientId: r.createdByPatientId || null,
}));

console.log("\n📥 Importing protocol steps...");
await importCSV("protocol_steps.csv", "protocol_steps", (r) => ({
  id: r.id,
  protocolId: r.protocolId,
  title: r.title,
  description: r.description || null,
  stepType: r.stepType || null,
  frequency: r.frequency || null,
  frequencyConfig: r.frequencyConfig || null,
  durationDays: r.durationDays || null,
  orderIndex: r.orderIndex || 0,
  dosageAmount: r.dosageAmount || null,
  dosageUnit: r.dosageUnit || null,
  dosageTiming: r.dosageTiming || null,
  dosageNotes: r.dosageNotes || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing protocol assignments...");
await importCSV("protocol_assignments.csv", "protocol_assignments", (r) => ({
  id: r.id,
  patientId: r.patientId,
  protocolId: r.protocolId,
  assignedBy: r.assignedBy,
  status: r.status || "active",
  startDate: r.startDate || null,
  endDate: r.endDate || null,
  compliancePercent: r.compliancePercent || 0,
  providerNotes: r.providerNotes || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing assignment steps...");
await importCSV("assignment_steps.csv", "assignment_steps", (r) => ({
  id: r.id,
  assignmentId: r.assignmentId,
  protocolStepId: r.protocolStepId,
  patientId: r.patientId,
  stepTitle: r.stepTitle || null,
  stepType: r.stepType || null,
  frequency: r.frequency || null,
  frequencyConfig: r.frequencyConfig || null,
  durationDays: r.durationDays || null,
  orderIndex: r.orderIndex || 0,
  dosageAmount: r.dosageAmount || null,
  dosageUnit: r.dosageUnit || null,
  dosageTiming: r.dosageTiming || null,
  dosageNotes: r.dosageNotes || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing appointments...");
await importCSV("appointments.csv", "appointments", (r) => ({
  id: r.id,
  patientId: r.patientId,
  providerId: r.providerId,
  createdBy: r.createdBy,
  title: r.title,
  type: r.type || "follow_up",
  scheduledAt: r.scheduledAt,
  durationMinutes: r.durationMinutes || 30,
  location: r.location || null,
  assistantNotes: r.assistantNotes || null,
  patientNotes: r.patientNotes || null,
  status: r.status || "scheduled",
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  googleEventId: r.googleEventId || null,
}));

console.log("\n📥 Importing task completions...");
await importCSV("task_completions.csv", "task_completions", (r) => ({
  id: r.id,
  assignmentId: r.assignmentId,
  patientId: r.patientId,
  assignmentStepId: r.assignmentStepId || null,
  taskDate: r.taskDate,
  completedAt: r.completedAt || null,
  notes: r.notes || null,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing biomarker entries...");
await importCSV("biomarker_entries.csv", "biomarker_entries", (r) => ({
  id: r.id,
  patientId: r.patientId,
  metricName: r.metricName,
  value: r.value,
  unit: r.unit || null,
  recordedAt: r.recordedAt,
  source: r.source || null,
  notes: r.notes || null,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing biomarker custom metrics...");
await importCSV("biomarker_custom_metrics.csv", "biomarker_custom_metrics", (r) => ({
  id: r.id,
  providerId: r.providerId,
  name: r.name,
  unit: r.unit || null,
  description: r.description || null,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing intake forms...");
await importCSV("intake_forms.csv", "intake_forms", (r) => ({
  id: r.id,
  patientId: r.patientId,
  currentSection: r.currentSection || 0,
  status: r.status || "not_started",
  formData: r.formData || null,
  completedSections: r.completedSections || null,
  submittedAt: r.submittedAt || null,
  providerNotes: r.providerNotes || null,
  reviewedByProvider: r.reviewedByProvider === "1" ? 1 : 0,
  reviewedAt: r.reviewedAt || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing client notes...");
await importCSV("client_notes.csv", "client_notes", (r) => ({
  id: r.id,
  patientId: r.patientId,
  authorId: r.authorId,
  content: r.content,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing client tasks...");
await importCSV("client_tasks.csv", "client_tasks", (r) => ({
  id: r.id,
  patientId: r.patientId,
  createdBy: r.createdBy,
  title: r.title,
  description: r.description || null,
  dueDate: r.dueDate || null,
  completedAt: r.completedAt || null,
  status: r.status || "pending",
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing resources...");
await importCSV("resources.csv", "resources", (r) => ({
  id: r.id,
  providerId: r.providerId,
  title: r.title,
  description: r.description || null,
  type: r.type || null,
  url: r.url || null,
  content: r.content || null,
  category: r.category || null,
  tags: r.tags || null,
  isPublic: r.isPublic === "1" ? 1 : 0,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

console.log("\n📥 Importing messages...");
await importCSV("messages.csv", "messages", (r) => ({
  id: r.id,
  patientId: r.patientId,
  senderId: r.senderId,
  content: r.content,
  role: r.role || "provider",
  isRead: r.isRead === "1" ? 1 : 0,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing documents...");
await importCSV("documents.csv", "documents", (r) => ({
  id: r.id,
  patientId: r.patientId,
  uploadedBy: r.uploadedBy,
  fileName: r.fileName,
  fileKey: r.fileKey || null,
  fileUrl: r.fileUrl || null,
  fileType: r.fileType || null,
  fileSize: r.fileSize || null,
  category: r.category || null,
  description: r.description || null,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing patient invites...");
await importCSV("patient_invites.csv", "patient_invites", (r) => ({
  id: r.id,
  token: r.token,
  createdByUserId: r.createdByUserId,
  patientId: r.patientId || null,
  email: r.email,
  expiresAt: r.expiresAt,
  usedAt: r.usedAt || null,
  usedByUserId: r.usedByUserId || null,
  revokedAt: r.revokedAt || null,
  createdAt: r.createdAt,
}));

console.log("\n📥 Importing provider profiles...");
await importCSV("provider_profiles.csv", "provider_profiles", (r) => ({
  id: r.id,
  userId: r.userId,
  practiceName: r.practiceName || null,
  tagline: r.tagline || null,
  bio: r.bio || null,
  avatarUrl: r.avatarUrl || null,
  phone: r.phone || null,
  address: r.address || null,
  website: r.website || null,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

await conn.end();
console.log("\n🎉 Import complete!");
