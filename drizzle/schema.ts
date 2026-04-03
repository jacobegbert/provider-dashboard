import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─────────────────────────────────────────────
// 1. USERS (auth — provided by template)
// ─────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "staff"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────
// 1a. PASSWORD RESET TOKENS
// ─────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// 1b. PROVIDER PROFILE (extended profile info)
// ─────────────────────────────────────────────
export const providerProfiles = mysqlTable("provider_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 128 }),
  lastName: varchar("lastName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  practiceName: varchar("practiceName", { length: 256 }),
  title: varchar("title", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;

// ─────────────────────────────────────────────
// 2. PATIENTS (client roster)
// ─────────────────────────────────────────────
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  /** Link to auth user if patient has an account */
  userId: int("userId"),
  /** Provider who manages this patient */
  providerId: int("providerId").notNull(),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  dateOfBirth: varchar("dateOfBirth", { length: 16 }),
  /** Biological sex — used for portal theming */
  sex: mysqlEnum("sex", ["male", "female"]),
  status: mysqlEnum("status", ["active", "paused", "completed", "new", "inactive", "prospective"]).default("new").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["standard", "premium", "elite"]).default("standard").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  /** Health goals — stored as JSON array of strings */
  healthGoals: json("healthGoals").$type<string[]>(),
  /** Medical conditions — stored as JSON array of strings */
  conditions: json("conditions").$type<string[]>(),
  /** SMS opt-in consent — null means never asked, true/false means explicit choice */
  smsOptIn: boolean("smsOptIn"),
  smsOptInAt: timestamp("smsOptInAt"),
  notes: text("notes"),
  avatarUrl: text("avatarUrl"),
  lastProviderInteraction: timestamp("lastProviderInteraction"),
  nextRequiredAction: text("nextRequiredAction"),
  /** Timestamp when the patient completed all Getting Started tasks */
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** Soft delete — null means active, timestamp means deleted */
  deletedAt: timestamp("deletedAt"),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// ─────────────────────────────────────────────
// 3. PROTOCOLS (template library)
// ─────────────────────────────────────────────
export const protocols = mysqlTable("protocols", {
  id: int("id").autoincrement().primaryKey(),
  /** Provider who created this protocol (user ID) */
  createdBy: int("createdBy").notNull(),
  /** If created by a patient, their patient ID (null for provider-created) */
  createdByPatientId: int("createdByPatientId"),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "nutrition",
    "supplement",
    "lifestyle",
    "lab_work",
    "exercise",
    "sleep",
    "stress",
    "peptides",
    "hormone",
    "other",
  ]).default("other").notNull(),
  /** Duration in days */
  durationDays: int("durationDays"),
  /** Whether this protocol is a reusable template */
  isTemplate: boolean("isTemplate").default(true).notNull(),
  /** JSON array of milestone definitions: { day: number, label: string } */
  milestones: json("milestones").$type<{ day: number; label: string }[]>(),
  /** JSON array of lab checkpoint definitions: { day: number, labName: string } */
  labCheckpoints: json("labCheckpoints").$type<{ day: number; labName: string }[]>(),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = typeof protocols.$inferInsert;

// ─────────────────────────────────────────────
// 4. PROTOCOL STEPS (checklist items within a protocol)
// ─────────────────────────────────────────────
export const protocolSteps = mysqlTable("protocol_steps", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull(),
  /** Order within the protocol */
  sortOrder: int("sortOrder").notNull().default(0),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  /** How often: daily, weekly, once, as_needed, custom (specific days of week) */
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]).default("daily").notNull(),
  /** Selected days of week for custom frequency — stored as JSON array e.g. ["mon","wed","fri"] */
  customDays: json("customDays").$type<string[]>(),
  /** Which day in the protocol this step starts (1-based, optional) */
  startDay: int("startDay"),
  /** Which day this step ends (optional) */
  endDay: int("endDay"),
  /** Time of day suggestion */
  timeOfDay: mysqlEnum("timeOfDay", ["morning", "afternoon", "evening", "any"]).default("any").notNull(),
  /** Dosage amount (e.g., "250", "0.5", "2") */
  dosageAmount: varchar("dosageAmount", { length: 64 }),
  /** Dosage unit (e.g., "mg", "mcg", "mL", "IU", "capsules") */
  dosageUnit: varchar("dosageUnit", { length: 32 }),
  /** Administration route (e.g., "oral", "subcutaneous", "intramuscular", "topical") */
  route: varchar("route", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolStep = typeof protocolSteps.$inferSelect;
export type InsertProtocolStep = typeof protocolSteps.$inferInsert;

// ─────────────────────────────────────────────
// 5. PROTOCOL ASSIGNMENTS (patient ↔ protocol)
// ─────────────────────────────────────────────
export const protocolAssignments = mysqlTable("protocol_assignments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  protocolId: int("protocolId").notNull(),
  /** Provider who assigned it */
  assignedBy: int("assignedBy").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  /** UTC timestamp when the assignment starts */
  startDate: timestamp("startDate").notNull(),
  /** Calculated end date based on protocol duration */
  endDate: timestamp("endDate"),
  /** Compliance percentage (0-100), auto-calculated */
  compliancePercent: int("compliancePercent").default(0).notNull(),
  providerNotes: text("providerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProtocolAssignment = typeof protocolAssignments.$inferSelect;
export type InsertProtocolAssignment = typeof protocolAssignments.$inferInsert;

// ─────────────────────────────────────────────
// 6. TASK COMPLETIONS (daily checklist tracking)
// ─────────────────────────────────────────────
export const taskCompletions = mysqlTable("task_completions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  stepId: int("stepId").notNull(),
  patientId: int("patientId").notNull(),
  /** UTC timestamp of when the task was completed */
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  /** The date this completion applies to (YYYY-MM-DD) */
  taskDate: varchar("taskDate", { length: 10 }).notNull(),
  notes: text("notes"),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type InsertTaskCompletion = typeof taskCompletions.$inferInsert;

// ─────────────────────────────────────────────
// 7. MESSAGES (secure conversation threads)
// ─────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Sender user ID (provider or patient) */
  senderId: int("senderId").notNull(),
  /** Receiver user ID */
  receiverId: int("receiverId").notNull(),
  /** Patient ID for easy filtering */
  patientId: int("patientId").notNull(),
  content: text("content").notNull(),
  /** Message type for audit purposes */
  messageType: mysqlEnum("messageType", ["text", "system", "alert"]).default("text").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─────────────────────────────────────────────
// 8. APPOINTMENTS (assistant-managed)
// ─────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  /** Created by (provider or assistant user ID) */
  createdBy: int("createdBy").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["initial", "follow_up", "check_in", "lab_work", "urgent"]).default("follow_up").notNull(),
  /** UTC timestamp of appointment start */
  scheduledAt: timestamp("scheduledAt").notNull(),
  /** Duration in minutes */
  durationMinutes: int("durationMinutes").default(30).notNull(),
  location: varchar("location", { length: 512 }),
  /** Notes for assistant coordination */
  assistantNotes: text("assistantNotes"),
  /** Notes visible to patient */
  patientNotes: text("patientNotes"),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  /** Google Calendar event ID for sync */
  googleEventId: varchar("googleEventId", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─────────────────────────────────────────────
// 9. NOTIFICATIONS
// ─────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Target user ID */
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body"),
  type: mysqlEnum("type", [
    "message",
    "task_overdue",
    "task_reminder",
    "appointment_reminder",
    "compliance_alert",
    "subscription_expiring",
    "milestone_reached",
    "system",
  ]).default("system").notNull(),
  /** Related entity for deep linking */
  relatedEntityType: varchar("relatedEntityType", { length: 64 }),
  relatedEntityId: int("relatedEntityId"),
  isRead: boolean("isRead").default(false).notNull(),
  /** Whether push notification was sent */
  pushSent: boolean("pushSent").default(false).notNull(),
  /** Whether email notification was sent */
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─────────────────────────────────────────────
// 10. PUSH SUBSCRIPTIONS (for web push notifications)
// ─────────────────────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Web Push subscription JSON */
  subscription: json("subscription").$type<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>().notNull(),
  /** User agent for device identification */
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ─────────────────────────────────────────────
// 11. DOCUMENTS (file uploads for client portals)
// ─────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Patient this document belongs to */
  patientId: int("patientId").notNull(),
  /** User who uploaded the document */
  uploadedBy: int("uploadedBy").notNull(),
  /** Original file name */
  fileName: varchar("fileName", { length: 512 }).notNull(),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull(),
  /** S3 storage key */
  fileKey: text("fileKey").notNull(),
  /** Public URL from S3 */
  url: text("url").notNull(),
  /** Document category */
  category: mysqlEnum("category", [
    "lab_results",
    "treatment_plan",
    "intake_form",
    "consent",
    "imaging",
    "prescription",
    "notes",
    "other",
  ]).default("other").notNull(),
  /** Optional description */
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─────────────────────────────────────────────
// 13. CLIENT NOTES (timestamped provider notes)
// ─────────────────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  /** Provider who wrote the note */
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  /** Optional category for organizing notes */
  category: mysqlEnum("category", ["general", "clinical", "follow_up", "phone_call", "lab_review", "other"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─────────────────────────────────────────────
// 14. CLIENT TASKS (provider-assigned tasks)
// ─────────────────────────────────────────────
export const clientTasks = mysqlTable("client_tasks", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  /** Provider who created the task */
  assignedBy: int("assignedBy").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientTask = typeof clientTasks.$inferSelect;
export type InsertClientTask = typeof clientTasks.$inferInsert;

// ─────────────────────────────────────────────
// 12. AUDIT LOG (for PHI compliance)
// ─────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId"),
  /** JSON details of the action */
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

// ─────────────────────────────────────────────
// 11. GOOGLE CALENDAR TOKENS
// ─────────────────────────────────────────────
export const googleTokens = mysqlTable("google_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  googleEmail: varchar("googleEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleToken = typeof googleTokens.$inferSelect;
export type InsertGoogleToken = typeof googleTokens.$inferInsert;

// ─────────────────────────────────────────────
// 12. PATIENT INVITES
// ─────────────────────────────────────────────
export const patientInvites = mysqlTable("patient_invites", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique invite token (UUID) */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** The patient record this invite is for */
  patientId: int("patientId").notNull(),
  /** Provider who created the invite */
  createdByUserId: int("createdByUserId").notNull(),
  /** When the invite expires */
  expiresAt: timestamp("expiresAt").notNull(),
  /** When the invite was used (null if unused) */
  usedAt: timestamp("usedAt"),
  /** The user who accepted the invite (null if unused) */
  usedByUserId: int("usedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PatientInvite = typeof patientInvites.$inferSelect;
export type InsertPatientInvite = typeof patientInvites.$inferInsert;


// ─────────────────────────────────────────────
// 17. ATTENTION DISMISSALS (persist dismiss/resolve state)
// ─────────────────────────────────────────────
export const attentionDismissals = mysqlTable("attention_dismissals", {
  id: int("id").autoincrement().primaryKey(),
  /** Provider who dismissed/resolved the item */
  userId: int("userId").notNull(),
  /** Unique item key (e.g., "overdue-123", "compliance-456") */
  itemKey: varchar("itemKey", { length: 128 }).notNull(),
  /** Whether the item was dismissed or resolved */
  action: mysqlEnum("action", ["dismissed", "resolved"]).notNull(),
  /** Auto-expire after 7 days */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AttentionDismissal = typeof attentionDismissals.$inferSelect;
export type InsertAttentionDismissal = typeof attentionDismissals.$inferInsert;

// ─────────────────────────────────────────────
// 18. ASSIGNMENT STEPS (per-patient copies of protocol steps)
// ─────────────────────────────────────────────
export const assignmentSteps = mysqlTable("assignment_steps", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  /** Original protocol step ID (null if added ad-hoc for this patient) */
  sourceStepId: int("sourceStepId"),
  /** Order within the assignment */
  sortOrder: int("sortOrder").notNull().default(0),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  /** How often: daily, weekly, once, as_needed, custom (specific days of week) */
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]).default("daily").notNull(),
  /** Selected days of week for custom frequency — stored as JSON array e.g. ["mon","wed","fri"] */
  customDays: json("customDays").$type<string[]>(),
  /** Which day in the protocol this step starts (1-based, optional) */
  startDay: int("startDay"),
  /** Which day this step ends (optional) */
  endDay: int("endDay"),
  /** Time of day suggestion */
  timeOfDay: mysqlEnum("timeOfDay", ["morning", "afternoon", "evening", "any"]).default("any").notNull(),
  /** Dosage amount (e.g., "250", "0.5", "2") */
  dosageAmount: varchar("dosageAmount", { length: 64 }),
  /** Dosage unit (e.g., "mg", "mcg", "mL", "IU", "capsules") */
  dosageUnit: varchar("dosageUnit", { length: 32 }),
  /** Administration route (e.g., "oral", "subcutaneous", "intramuscular", "topical") */
  route: varchar("route", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssignmentStep = typeof assignmentSteps.$inferSelect;
export type InsertAssignmentStep = typeof assignmentSteps.$inferInsert;

// ─────────────────────────────────────────────
// 19. BIOMARKER ENTRIES (patient-tracked metrics)
// ─────────────────────────────────────────────
export const biomarkerEntries = mysqlTable("biomarker_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** Patient who logged this entry */
  patientId: int("patientId").notNull(),
  /** Metric name (e.g., "weight", "height", "body_fat", or custom) */
  metricName: varchar("metricName", { length: 128 }).notNull(),
  /** Numeric value */
  value: varchar("value", { length: 64 }).notNull(),
  /** Unit (e.g., "lbs", "in", "%", or custom) */
  unit: varchar("unit", { length: 32 }).notNull(),
  /** Date of the measurement (YYYY-MM-DD) */
  measuredAt: varchar("measuredAt", { length: 10 }).notNull(),
  /** Optional note */
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BiomarkerEntry = typeof biomarkerEntries.$inferSelect;
export type InsertBiomarkerEntry = typeof biomarkerEntries.$inferInsert;

// ─────────────────────────────────────────────
// 20. BIOMARKER CUSTOM METRICS (patient-defined trackable metrics)
// ─────────────────────────────────────────────
export const biomarkerCustomMetrics = mysqlTable("biomarker_custom_metrics", {
  id: int("id").autoincrement().primaryKey(),
  /** Patient who created this custom metric */
  patientId: int("patientId").notNull(),
  /** Display name (e.g., "Waist Circumference") */
  name: varchar("name", { length: 128 }).notNull(),
  /** Unit of measurement (e.g., "in", "mmol/L") */
  unit: varchar("unit", { length: 32 }).notNull(),
  /** Sort order for display */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BiomarkerCustomMetric = typeof biomarkerCustomMetrics.$inferSelect;
export type InsertBiomarkerCustomMetric = typeof biomarkerCustomMetrics.$inferInsert;

// ─────────────────────────────────────────────
// 21. EDUCATIONAL RESOURCES (provider content library)
// ─────────────────────────────────────────────
export const resources = mysqlTable("resources", {
  id: int("id").autoincrement().primaryKey(),
  /** Provider who created this resource */
  createdBy: int("createdBy").notNull(),
  /** Resource title */
  title: varchar("title", { length: 512 }).notNull(),
  /** Description / summary */
  description: text("description"),
  /** Resource type */
  type: mysqlEnum("type", ["file", "link", "article"]).default("file").notNull(),
  /** Category for organizing */
  category: mysqlEnum("category", [
    "nutrition",
    "exercise",
    "supplement",
    "lifestyle",
    "hormone",
    "peptides",
    "lab_education",
    "recovery",
    "mental_health",
    "general",
  ]).default("general").notNull(),
  /** For file type: S3 file key */
  fileKey: text("fileKey"),
  /** For file type: public URL from S3 */
  fileUrl: text("fileUrl"),
  /** For file type: original file name */
  fileName: varchar("fileName", { length: 512 }),
  /** For file type: MIME type */
  mimeType: varchar("mimeType", { length: 128 }),
  /** For file type: file size in bytes */
  fileSize: int("fileSize"),
  /** For link type: external URL */
  externalUrl: text("externalUrl"),
  /** For article type: rich text content (markdown) */
  content: text("content"),
  /** Tags for search/filter — stored as JSON array of strings */
  tags: json("tags").$type<string[]>(),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// ─────────────────────────────────────────────
// 22. RESOURCE SHARES (resource ↔ patient)
// ─────────────────────────────────────────────
export const resourceShares = mysqlTable("resource_shares", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId").notNull(),
  patientId: int("patientId").notNull(),
  /** Provider who shared it */
  sharedBy: int("sharedBy").notNull(),
  /** Optional message from provider */
  message: text("message"),
  /** Whether the patient has viewed it */
  isViewed: boolean("isViewed").default(false).notNull(),
  viewedAt: timestamp("viewedAt"),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
});

export type ResourceShare = typeof resourceShares.$inferSelect;
export type InsertResourceShare = typeof resourceShares.$inferInsert;

// ─────────────────────────────────────────────
// 23. STAFF INVITES (provider invites assistants)
// ─────────────────────────────────────────────
export const staffInvites = mysqlTable("staff_invites", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique invite token (UUID) */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** Provider who created the invite */
  createdByUserId: int("createdByUserId").notNull(),
  /** Display name for the invited staff member */
  name: varchar("name", { length: 256 }).notNull(),
  /** Email of the invited staff member */
  email: varchar("email", { length: 320 }).notNull(),
  /** When the invite expires */
  expiresAt: timestamp("expiresAt").notNull(),
  /** When the invite was used (null if unused) */
  usedAt: timestamp("usedAt"),
  /** The user who accepted the invite (null if unused) */
  usedByUserId: int("usedByUserId"),
  /** Whether the invite has been revoked */
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StaffInvite = typeof staffInvites.$inferSelect;
export type InsertStaffInvite = typeof staffInvites.$inferInsert;

// ─────────────────────────────────────────────
// 24. INTAKE FORMS (comprehensive patient intake)
// ─────────────────────────────────────────────
export const intakeForms = mysqlTable("intake_forms", {
  id: int("id").autoincrement().primaryKey(),
  /** Patient this intake belongs to */
  patientId: int("patientId").notNull(),
  /** Current section the patient is on (for save-as-you-go progress) */
  currentSection: int("currentSection").default(0).notNull(),
  /** Overall completion status */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  /** All form data stored as structured JSON */
  formData: json("formData").$type<import("../shared/intakeFormSchema").IntakeFormData>(),
  /** Sections that have been completed — JSON array of section keys */
  completedSections: json("completedSections").$type<string[]>(),
  /** When the form was submitted as complete */
  submittedAt: timestamp("submittedAt"),
  /** Provider notes on the intake (after review) */
  providerNotes: text("providerNotes"),
  /** Whether provider has reviewed the intake */
  reviewedByProvider: boolean("reviewedByProvider").default(false).notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IntakeForm = typeof intakeForms.$inferSelect;
export type InsertIntakeForm = typeof intakeForms.$inferInsert;

// ─────────────────────────────────────────────
// 25. STRIPE CUSTOMERS (patient → Stripe mapping)
// ─────────────────────────────────────────────
export const stripeCustomers = mysqlTable("stripe_customers", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StripeCustomer = typeof stripeCustomers.$inferSelect;

// ─────────────────────────────────────────────
// 26. INVOICES (one-time & membership charges)
// ─────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  /** Stripe Payment Intent or Invoice ID */
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 128 }),
  /** Stripe Subscription ID (for recurring memberships) */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  /** Amount in cents (e.g. 50000 = $500.00) */
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).default("draft").notNull(),
  type: mysqlEnum("type", ["one_time", "membership"]).default("one_time").notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  /** Stripe-hosted invoice URL for patient payment */
  hostedInvoiceUrl: text("hostedInvoiceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─────────────────────────────────────────────
// 27. PATIENT PLANS (membership / care plans)
// ─────────────────────────────────────────────
export const patientPlans = mysqlTable("patient_plans", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  /** Plan duration type */
  planType: mysqlEnum("planType", ["annual", "biannual", "quarterly", "monthly", "custom", "ongoing"]).notNull().default("annual"),
  /** Provider-entered start date */
  startDate: timestamp("startDate").notNull(),
  /** Auto-calculated end date (null for ongoing) */
  endDate: timestamp("endDate"),
  /** For custom plans: number of months */
  durationMonths: int("durationMonths"),
  /** Current lifecycle status */
  status: mysqlEnum("status", ["active", "expired", "cancelled", "paused", "pending_renewal"]).notNull().default("active"),
  /** Provider notes about this plan */
  notes: text("notes"),
  /** Price in cents (for reference — actual billing is in invoices table) */
  priceCents: int("priceCents"),
  /** Whether a renewal reminder has been sent */
  renewalReminderSent: boolean("renewalReminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientPlan = typeof patientPlans.$inferSelect;
export type InsertPatientPlan = typeof patientPlans.$inferInsert;
