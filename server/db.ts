import crypto from "crypto";
import { eq, and, desc, asc, sql, or, inArray, isNull, ne, lte, gte, gt, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  patients,
  protocols,
  protocolSteps,
  protocolAssignments,
  taskCompletions,
  messages,
  appointments,
  notifications,
  pushSubscriptions,
  auditLog,
  type InsertPatient,
  type InsertProtocol,
  type InsertProtocolStep,
  type InsertProtocolAssignment,
  type InsertTaskCompletion,
  type InsertMessage,
  type InsertAppointment,
  type InsertNotification,
  type InsertPushSubscription,
  type InsertAuditLogEntry,
  documents,
  type InsertDocument,
  clientNotes,
  type InsertClientNote,
  clientTasks,
  type InsertClientTask,
  patientInvites,
  type InsertPatientInvite,
  attentionDismissals,
  type InsertAttentionDismissal,
  providerProfiles,
  type InsertProviderProfile,
  assignmentSteps,
  type InsertAssignmentStep,
  biomarkerEntries,
  type InsertBiomarkerEntry,
  biomarkerCustomMetrics,
  type InsertBiomarkerCustomMetric,
  resources,
  type InsertResource,
  resourceShares,
  type InsertResourceShare,
  staffInvites,
  type InsertStaffInvite,
  intakeForms,
  type InsertIntakeForm,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USER QUERIES ─────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.email && user.email === ENV.ownerEmail) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Hash a password with a random 16-byte salt. Returns 96-char hex string (32 salt + 64 digest). */
export function hashPassword(password: string): string {
  const { createHash, randomBytes } = crypto;
  const salt = randomBytes(16).toString("hex"); // 32 hex chars
  const digest = createHash("sha256").update(salt + password).digest("hex");
  return salt + digest;
}

export async function setUserPassword(openId: string, password: string) {
  const db = await getDb();
  if (!db) return;
  const passwordHash = hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.openId, openId));
}

export async function getUserByRole(role: "admin" | "staff" | "user") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.role, role)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── PATIENT QUERIES ──────────────────────

export async function getPatientByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(and(eq(patients.userId, userId), isNull(patients.deletedAt))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(and(eq(patients.email, email), isNull(patients.deletedAt))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientByName(firstName: string, lastName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(
    and(
      eq(patients.firstName, firstName),
      eq(patients.lastName, lastName),
      isNull(patients.deletedAt)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function linkPatientToUser(patientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patients).set({ userId }).where(eq(patients.id, patientId));
}

export async function listPatients(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: patients.id,
      userId: patients.userId,
      providerId: patients.providerId,
      firstName: patients.firstName,
      lastName: patients.lastName,
      email: patients.email,
      phone: patients.phone,
      dateOfBirth: patients.dateOfBirth,
      status: patients.status,
      subscriptionTier: patients.subscriptionTier,
      subscriptionExpiresAt: patients.subscriptionExpiresAt,
      healthGoals: patients.healthGoals,
      conditions: patients.conditions,
      sex: patients.sex,
      notes: patients.notes,
      avatarUrl: patients.avatarUrl,
      lastProviderInteraction: patients.lastProviderInteraction,
      nextRequiredAction: patients.nextRequiredAction,
      createdAt: patients.createdAt,
      updatedAt: patients.updatedAt,
      lastActive: users.lastSignedIn,
    })
    .from(patients)
    .leftJoin(users, eq(patients.userId, users.id))
    .where(and(eq(patients.providerId, providerId), isNull(patients.deletedAt)))
    .orderBy(desc(patients.updatedAt));
  return rows;
}

export async function getPatient(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(and(eq(patients.id, id), isNull(patients.deletedAt))).limit(1);
  return result[0];
}

export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patients).values(data);
  return { id: result[0].insertId };
}

export async function updatePatient(id: number, data: Partial<InsertPatient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patients).set(data).where(eq(patients.id, id));
}

/** Soft-delete a patient (sets deletedAt timestamp) */
export async function deletePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patients).set({ deletedAt: new Date() }).where(eq(patients.id, id));
}

/** Restore a soft-deleted patient */
export async function restorePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patients).set({ deletedAt: null }).where(eq(patients.id, id));
}

/** Permanently delete a patient and all related records (transactional) */
export async function permanentlyDeletePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async (tx) => {
    // Delete child records first
    await tx.delete(resourceShares).where(eq(resourceShares.patientId, id));
    await tx.delete(biomarkerEntries).where(eq(biomarkerEntries.patientId, id));
    await tx.delete(biomarkerCustomMetrics).where(eq(biomarkerCustomMetrics.patientId, id));
    await tx.delete(documents).where(eq(documents.patientId, id));
    await tx.delete(clientNotes).where(eq(clientNotes.patientId, id));
    await tx.delete(clientTasks).where(eq(clientTasks.patientId, id));
    await tx.delete(messages).where(eq(messages.patientId, id));
    await tx.delete(appointments).where(eq(appointments.patientId, id));
    await tx.delete(patientInvites).where(eq(patientInvites.patientId, id));
    // Delete assignment steps and task completions via assignments
    const patientAssignments = await tx.select().from(protocolAssignments).where(eq(protocolAssignments.patientId, id));
    for (const a of patientAssignments) {
      await tx.delete(taskCompletions).where(eq(taskCompletions.assignmentId, a.id));
      await tx.delete(assignmentSteps).where(eq(assignmentSteps.assignmentId, a.id));
    }
    await tx.delete(protocolAssignments).where(eq(protocolAssignments.patientId, id));
    // Finally delete the patient
    await tx.delete(patients).where(eq(patients.id, id));
  });
}

/** List soft-deleted patients for the Trash view */
export async function listDeletedPatients(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(patients)
    .where(and(eq(patients.providerId, providerId), sql`${patients.deletedAt} IS NOT NULL`))
    .orderBy(desc(patients.deletedAt));
}

// ─── PROTOCOL QUERIES ─────────────────────────

export async function listProtocols(createdBy: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).where(and(eq(protocols.createdBy, createdBy), eq(protocols.isArchived, false))).orderBy(desc(protocols.updatedAt));
}

export async function listAllProtocols(createdBy: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).where(eq(protocols.createdBy, createdBy)).orderBy(desc(protocols.updatedAt));
}

export async function getProtocol(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(protocols).where(eq(protocols.id, id)).limit(1);
  return result[0];
}

export async function createProtocol(data: InsertProtocol) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(protocols).values(data);
  return { id: result[0].insertId };
}

export async function updateProtocol(id: number, data: Partial<InsertProtocol>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(protocols).set(data).where(eq(protocols.id, id));
}

// ─── PROTOCOL STEPS ───────────────────────────

export async function listProtocolSteps(protocolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocolSteps).where(eq(protocolSteps.protocolId, protocolId)).orderBy(asc(protocolSteps.sortOrder));
}

export async function createProtocolStep(data: InsertProtocolStep) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(protocolSteps).values(data);
  return { id: result[0].insertId };
}

export async function updateProtocolStep(id: number, data: Partial<InsertProtocolStep>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(protocolSteps).set(data).where(eq(protocolSteps.id, id));
}

export async function deleteProtocolStep(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(protocolSteps).where(eq(protocolSteps.id, id));
}

// ─── PROTOCOL ASSIGNMENTS ─────────────────────

export async function listAssignmentsForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      assignment: protocolAssignments,
      protocol: protocols,
    })
    .from(protocolAssignments)
    .innerJoin(protocols, eq(protocolAssignments.protocolId, protocols.id))
    .where(eq(protocolAssignments.patientId, patientId))
    .orderBy(desc(protocolAssignments.createdAt));
}

export async function listActiveAssignmentsForProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join assignments with patients to filter by provider
  return db
    .select({
      assignment: protocolAssignments,
      patient: patients,
      protocol: protocols,
    })
    .from(protocolAssignments)
    .innerJoin(patients, eq(protocolAssignments.patientId, patients.id))
    .innerJoin(protocols, eq(protocolAssignments.protocolId, protocols.id))
    .where(and(eq(patients.providerId, providerId), eq(protocolAssignments.status, "active"), isNull(patients.deletedAt)))
    .orderBy(asc(protocolAssignments.compliancePercent));
}

export async function listAssignmentsForProtocol(protocolId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocolAssignments).where(eq(protocolAssignments.protocolId, protocolId));
}

export async function getAssignment(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(protocolAssignments).where(eq(protocolAssignments.id, id)).limit(1);
  return result[0];
}

export async function createAssignment(data: InsertProtocolAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(protocolAssignments).values(data);
  return { id: result[0].insertId };
}

export async function updateAssignment(id: number, data: Partial<InsertProtocolAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(protocolAssignments).set(data).where(eq(protocolAssignments.id, id));
}

export async function deleteAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related task completions first
  await db.delete(taskCompletions).where(eq(taskCompletions.assignmentId, id));
  // Delete per-patient assignment steps
  await db.delete(assignmentSteps).where(eq(assignmentSteps.assignmentId, id));
  // Delete the assignment
  await db.delete(protocolAssignments).where(eq(protocolAssignments.id, id));
}

// ─── ASSIGNMENT STEPS (per-patient copies) ──────

export async function listAssignmentSteps(assignmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assignmentSteps).where(eq(assignmentSteps.assignmentId, assignmentId)).orderBy(asc(assignmentSteps.sortOrder));
}

export async function createAssignmentStep(data: InsertAssignmentStep) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assignmentSteps).values(data);
  return { id: result[0].insertId };
}

export async function updateAssignmentStep(id: number, data: Partial<InsertAssignmentStep>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assignmentSteps).set(data).where(eq(assignmentSteps.id, id));
}

export async function deleteAssignmentStep(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assignmentSteps).where(eq(assignmentSteps.id, id));
}

export async function deleteAssignmentStepsByAssignment(assignmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assignmentSteps).where(eq(assignmentSteps.assignmentId, assignmentId));
}

/**
 * Duplicate protocol library steps into per-patient assignment steps.
 * Called when a protocol is assigned to a patient.
 */
export async function duplicateStepsToAssignment(protocolId: number, assignmentId: number) {
  const librarySteps = await listProtocolSteps(protocolId);
  const createdIds: number[] = [];
  for (const step of librarySteps) {
    const result = await createAssignmentStep({
      assignmentId,
      sourceStepId: step.id,
      sortOrder: step.sortOrder,
      title: step.title,
      description: step.description,
      frequency: step.frequency,
      customDays: step.customDays,
      startDay: step.startDay,
      endDay: step.endDay,
      timeOfDay: step.timeOfDay,
      dosageAmount: step.dosageAmount,
      dosageUnit: step.dosageUnit,
      route: step.route,
    });
    createdIds.push(result.id);
  }
  return createdIds;
}

// ─── TASK COMPLETIONS ─────────────────────────

export async function listCompletionsForAssignment(assignmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskCompletions).where(eq(taskCompletions.assignmentId, assignmentId)).orderBy(desc(taskCompletions.completedAt));
}

export async function createTaskCompletion(data: InsertTaskCompletion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(taskCompletions).values(data);
  return { id: result[0].insertId };
}

export async function deleteTaskCompletion(assignmentId: number, stepId: number, taskDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(taskCompletions).where(
    and(
      eq(taskCompletions.assignmentId, assignmentId),
      eq(taskCompletions.stepId, stepId),
      eq(taskCompletions.taskDate, taskDate)
    )
  );
}

export async function bulkCreateTaskCompletions(data: InsertTaskCompletion[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(taskCompletions).values(data);
}

export async function listCompletionsByDateRange(
  patientId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.patientId, patientId),
        gte(taskCompletions.taskDate, startDate),
        lte(taskCompletions.taskDate, endDate)
      )
    )
    .orderBy(desc(taskCompletions.taskDate));
}

// ─── MESSAGE QUERIES ──────────────────────────

export async function listConversationsForProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get the latest message per patient for this provider
  const allMessages = await db
    .select({
      message: messages,
      patient: patients,
    })
    .from(messages)
    .innerJoin(patients, eq(messages.patientId, patients.id))
    .where(and(eq(patients.providerId, providerId), isNull(patients.deletedAt)))
    .orderBy(desc(messages.createdAt));
  
  // Group by patient and get latest + unread count
  const conversationMap = new Map<number, { patient: typeof allMessages[0]["patient"]; lastMessage: typeof allMessages[0]["message"]; unreadCount: number }>();
  for (const row of allMessages) {
    const existing = conversationMap.get(row.patient.id);
    if (!existing) {
      conversationMap.set(row.patient.id, {
        patient: row.patient,
        lastMessage: row.message,
        unreadCount: (!row.message.isRead && row.message.senderId !== providerId) ? 1 : 0,
      });
    } else {
      if (!row.message.isRead && row.message.senderId !== providerId) {
        existing.unreadCount++;
      }
    }
  }
  return Array.from(conversationMap.values());
}

export async function listMessagesForPatient(patientId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.patientId, patientId)).orderBy(asc(messages.createdAt)).limit(limit);
}

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return { id: result[0].insertId };
}

/** Get a single message by ID */
export async function getMessage(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return rows[0] || null;
}

/** Delete a message's attachment by replacing content with a placeholder */
export async function deleteMessageContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ content: "[Attachment deleted]" }).where(eq(messages.id, id));
}

export async function markMessagesRead(patientId: number, readerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Mark messages as read where:
  // 1. The message belongs to this patient conversation
  // 2. The message was NOT sent by the reader (i.e., sent by the patient)
  // 3. The message is currently unread
  // This is more robust than filtering by receiverId, which can be 0 or incorrect
  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.patientId, patientId),
        ne(messages.senderId, readerId),
        eq(messages.isRead, false)
      )
    );
}

// ─── APPOINTMENT QUERIES ──────────────────────

/**
 * Auto-mark past "scheduled" appointments as "completed" for a given provider.
 * Called before listing appointments so the UI always reflects accurate status.
 */
export async function autoCompletePastAppointments(providerId: number) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(
      and(
        eq(appointments.providerId, providerId),
        eq(appointments.status, "scheduled"),
        lt(appointments.scheduledAt, now)
      )
    );
}

export async function listAppointmentsForProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Auto-complete past appointments before listing
  await autoCompletePastAppointments(providerId);
  return db
    .select({ appointment: appointments, patient: patients })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(appointments.providerId, providerId))
    .orderBy(asc(appointments.scheduledAt));
}

export async function listAppointmentsForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  // Auto-complete past appointments for this patient before listing
  const now = new Date();
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(
      and(
        eq(appointments.patientId, patientId),
        eq(appointments.status, "scheduled"),
        lt(appointments.scheduledAt, now)
      )
    );
  return db.select().from(appointments).where(eq(appointments.patientId, patientId)).orderBy(asc(appointments.scheduledAt));
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return { id: result[0].insertId };
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

// ─── NOTIFICATION QUERIES ─────────────────────

export async function listNotificationsForUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  const notifId = result[0].insertId;

  // Push real-time SSE event to connected clients
  try {
    const { emitNotification } = await import("./sse");
    emitNotification(data.userId, {
      id: notifId,
      type: data.type ?? "system",
      title: data.title,
      body: data.body ?? null,
      relatedEntityType: data.relatedEntityType ?? null,
      relatedEntityId: data.relatedEntityId ?? null,
      createdAt: new Date(),
    });
  } catch (e) {
    // SSE emission is best-effort; don't fail the notification creation
    console.warn("[SSE] Failed to emit notification:", e);
  }

  return { id: notifId };
}

export async function getNotificationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result[0];
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notifications).where(eq(notifications.id, id));
}

export async function listNotificationsForUserPaginated(
  userId: number,
  options: { limit?: number; offset?: number; type?: string; unreadOnly?: boolean } = {}
) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { limit = 20, offset = 0, type, unreadOnly } = options;

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  if (type) conditions.push(eq(notifications.type, type as any));

  const whereClause = and(...conditions);
  const items = await db.select().from(notifications).where(whereClause).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(whereClause);
  const total = countResult[0]?.count ?? 0;

  return { items, total };
}

/**
 * Create an in-app notification and optionally send an email notification
 * to the project owner via the Manus notification service.
 */
export async function createNotificationWithEmail(
  data: InsertNotification,
  options: { sendEmail?: boolean } = {}
) {
  const result = await createNotification(data);

  if (options.sendEmail) {
    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: `[BLM] ${data.title}`,
        content: data.body || data.title,
      });
      // Mark email as sent
      const db = await getDb();
      if (db) {
        await db.update(notifications).set({ emailSent: true }).where(eq(notifications.id, result.id));
      }
    } catch (e) {
      console.warn("[Notification] Email notification failed:", e);
    }
  }

  return result;
}

// ─── DOCUMENT QUERIES ─────────────────────────

export async function listDocumentsForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.patientId, patientId)).orderBy(desc(documents.createdAt));
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return { id: result[0].insertId };
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  await db.delete(documents).where(eq(documents.id, id));
  return doc[0];
}

export async function getDocument(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

// ─── CLIENT NOTES QUERIES ────────────────────

export async function listNotesForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientNotes).where(eq(clientNotes.patientId, patientId)).orderBy(desc(clientNotes.createdAt));
}

export async function createClientNote(data: InsertClientNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientNotes).values(data);
  return { id: result[0].insertId };
}

export async function updateClientNote(id: number, data: Partial<InsertClientNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientNotes).set(data).where(eq(clientNotes.id, id));
}

export async function deleteClientNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientNotes).where(eq(clientNotes.id, id));
}

// ─── CLIENT TASKS QUERIES ────────────────────

export async function listTasksForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientTasks).where(eq(clientTasks.patientId, patientId)).orderBy(desc(clientTasks.createdAt));
}

export async function createClientTask(data: InsertClientTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientTasks).values(data);
  return { id: result[0].insertId };
}

export async function updateClientTask(id: number, data: Partial<InsertClientTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientTasks).set(data).where(eq(clientTasks.id, id));
}

export async function deleteClientTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientTasks).where(eq(clientTasks.id, id));
}

// ─── PUSH SUBSCRIPTION QUERIES ────────────────

export async function savePushSubscription(data: InsertPushSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pushSubscriptions).values(data);
  return { id: result[0].insertId };
}

export async function getPushSubscriptionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}

// ─── AUDIT LOG ────────────────────────────────

export async function logAudit(data: InsertAuditLogEntry) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLog).values(data);
  } catch (e) {
    console.error("[Audit] Failed to log:", e);
  }
}

// ─── ATTENTION QUEUE (Provider Command Center) ─

export async function getAttentionQueue(providerId: number) {
  const db = await getDb();
  if (!db) return { overduePatients: [], lowCompliance: [], unreadMessages: [], upcomingAppointments: [], newPatients: [] };

  // 1. Patients with status "attention" or unread messages (exclude soft-deleted)
  const allPatients = await db.select().from(patients).where(and(eq(patients.providerId, providerId), isNull(patients.deletedAt)));

  // 2. Active assignments with low compliance
  const activeAssignments = await listActiveAssignmentsForProvider(providerId);
  const lowCompliance = activeAssignments.filter((a) => a.assignment.compliancePercent < 70);

  // 3. Unread messages
  const conversations = await listConversationsForProvider(providerId);
  const unreadMessages = conversations.filter((c) => c.unreadCount > 0);

  // 4. Upcoming appointments (next 7 days)
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Auto-complete any past "scheduled" appointments first
  await autoCompletePastAppointments(providerId);
  const upcoming = await db
    .select({ appointment: appointments, patient: patients })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        eq(appointments.providerId, providerId),
        eq(appointments.status, "scheduled"),
        gte(appointments.scheduledAt, now),
        lte(appointments.scheduledAt, weekFromNow)
      )
    )
    .orderBy(asc(appointments.scheduledAt));

  // 5. New patients
  const newPatients = allPatients.filter((p) => p.status === "new");

  // 6. Patients needing attention (no interaction in 3+ days)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const overduePatients = allPatients.filter(
    (p) => p.status === "active" && p.lastProviderInteraction && new Date(p.lastProviderInteraction) < threeDaysAgo
  );

  return {
    overduePatients,
    lowCompliance,
    unreadMessages,
    upcomingAppointments: upcoming,
    newPatients,
  };
}

// ─── ANALYTICS QUERIES ────────────────────────

export async function getProviderStats(providerId: number) {
  const db = await getDb();
  if (!db) return { totalPatients: 0, activePatients: 0, avgCompliance: 0, totalUnread: 0, upcomingAppointments: 0 };

  const allPatients = await db.select().from(patients).where(and(eq(patients.providerId, providerId), isNull(patients.deletedAt)));
  const activePatients = allPatients.filter((p) => p.status === "active");

  const activeAssignments = await listActiveAssignmentsForProvider(providerId);
  const avgCompliance = activeAssignments.length > 0
    ? Math.round(activeAssignments.reduce((sum, a) => sum + a.assignment.compliancePercent, 0) / activeAssignments.length)
    : 0;

  const conversations = await listConversationsForProvider(providerId);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await autoCompletePastAppointments(providerId);
  const upcomingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.providerId, providerId),
        eq(appointments.status, "scheduled"),
        gte(appointments.scheduledAt, now),
        lte(appointments.scheduledAt, weekFromNow)
      )
    );

  return {
    totalPatients: allPatients.length,
    activePatients: activePatients.length,
    avgCompliance,
    totalUnread,
    upcomingAppointments: upcomingResult[0]?.count ?? 0,
  };
}


// ── Get single appointment by ID ──────────────
export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── PATIENT INVITES ─────────────────────────

export async function createInvite(data: InsertPatientInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(patientInvites).values(data);
  return data;
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(patientInvites).where(eq(patientInvites.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveInviteForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(patientInvites)
    .where(
      and(
        eq(patientInvites.patientId, patientId),
        isNull(patientInvites.usedAt),
        gt(patientInvites.expiresAt, new Date())
      )
    )
    .orderBy(desc(patientInvites.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function markInviteUsed(token: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(patientInvites)
    .set({ usedAt: new Date(), usedByUserId: userId })
    .where(eq(patientInvites.token, token));
}

export async function listInvitesForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(patientInvites)
    .where(eq(patientInvites.patientId, patientId))
    .orderBy(desc(patientInvites.createdAt));
}


// ─── ATTENTION DISMISSALS ─────────────────────────
export async function dismissAttentionItem(userId: number, itemKey: string, action: "dismissed" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert: if already dismissed, update the action and expiry
  const existing = await db
    .select()
    .from(attentionDismissals)
    .where(and(eq(attentionDismissals.userId, userId), eq(attentionDismissals.itemKey, itemKey)))
    .limit(1);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  if (existing.length > 0) {
    await db
      .update(attentionDismissals)
      .set({ action, expiresAt })
      .where(eq(attentionDismissals.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(attentionDismissals).values({ userId, itemKey, action, expiresAt });
  return result[0].insertId;
}

export async function getDismissedAttentionItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  // Clean up expired items
  await db.delete(attentionDismissals).where(lt(attentionDismissals.expiresAt, now));
  // Return active dismissals
  return db
    .select()
    .from(attentionDismissals)
    .where(and(eq(attentionDismissals.userId, userId), gt(attentionDismissals.expiresAt, now)));
}

export async function restoreAttentionItem(userId: number, itemKey: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(attentionDismissals)
    .where(and(eq(attentionDismissals.userId, userId), eq(attentionDismissals.itemKey, itemKey)));
}

export async function restoreAllAttentionItems(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(attentionDismissals).where(eq(attentionDismissals.userId, userId));
}


// ─── PROVIDER PROFILE ───────────────────────────

export async function getProviderProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertProviderProfile(
  userId: number,
  data: Omit<InsertProviderProfile, "id" | "userId" | "createdAt" | "updatedAt">,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(providerProfiles)
      .set(data)
      .where(eq(providerProfiles.userId, userId));
    return { ...existing[0], ...data };
  } else {
    const result = await db.insert(providerProfiles).values({ userId, ...data });
    return { id: result[0].insertId, userId, ...data };
  }
}


// ─── BIOMARKER ENTRIES ───────────────────────────

export async function createBiomarkerEntry(data: InsertBiomarkerEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(biomarkerEntries).values(data);
  return { id: result[0].insertId, ...data };
}

export async function listBiomarkerEntries(patientId: number, metricName?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(biomarkerEntries.patientId, patientId)];
  if (metricName) {
    conditions.push(eq(biomarkerEntries.metricName, metricName));
  }
  return db
    .select()
    .from(biomarkerEntries)
    .where(and(...conditions))
    .orderBy(desc(biomarkerEntries.measuredAt), desc(biomarkerEntries.createdAt));
}

export async function updateBiomarkerEntry(id: number, data: Partial<InsertBiomarkerEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(biomarkerEntries).set(data).where(eq(biomarkerEntries.id, id));
}

export async function deleteBiomarkerEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(biomarkerEntries).where(eq(biomarkerEntries.id, id));
}

// ─── BIOMARKER CUSTOM METRICS ────────────────────

export async function createCustomMetric(data: InsertBiomarkerCustomMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(biomarkerCustomMetrics).values(data);
  return { id: result[0].insertId, ...data };
}

export async function listCustomMetrics(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(biomarkerCustomMetrics)
    .where(eq(biomarkerCustomMetrics.patientId, patientId))
    .orderBy(asc(biomarkerCustomMetrics.sortOrder), asc(biomarkerCustomMetrics.createdAt));
}

export async function deleteCustomMetric(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also delete all entries for this metric
  const metric = await db.select().from(biomarkerCustomMetrics).where(eq(biomarkerCustomMetrics.id, id)).limit(1);
  if (metric[0]) {
    await db.delete(biomarkerEntries).where(
      and(
        eq(biomarkerEntries.patientId, metric[0].patientId),
        eq(biomarkerEntries.metricName, metric[0].name)
      )
    );
  }
  await db.delete(biomarkerCustomMetrics).where(eq(biomarkerCustomMetrics.id, id));
}


// ─── EDUCATIONAL RESOURCES ─────────────────────

export async function createResource(data: InsertResource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(resources).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function updateResource(id: number, data: Partial<InsertResource>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resources).set(data).where(eq(resources.id, id));
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Also delete all shares for this resource
  await db.delete(resourceShares).where(eq(resourceShares.resourceId, id));
  await db.delete(resources).where(eq(resources.id, id));
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(resources).where(eq(resources.id, id));
  return rows[0] || null;
}

export async function listResources(createdBy?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(resources.isArchived, false)];
  if (createdBy) conditions.push(eq(resources.createdBy, createdBy));
  return db.select().from(resources).where(and(...conditions)).orderBy(desc(resources.createdAt));
}

export async function archiveResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resources).set({ isArchived: true }).where(eq(resources.id, id));
}

// ─── RESOURCE SHARES ─────────────────────

export async function shareResource(data: InsertResourceShare) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already shared
  const existing = await db.select().from(resourceShares)
    .where(and(eq(resourceShares.resourceId, data.resourceId!), eq(resourceShares.patientId, data.patientId!)));
  if (existing.length > 0) return existing[0];
  const [result] = await db.insert(resourceShares).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function unshareResource(resourceId: number, patientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(resourceShares)
    .where(and(eq(resourceShares.resourceId, resourceId), eq(resourceShares.patientId, patientId)));
}

export async function listSharesForResource(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    share: resourceShares,
    patient: {
      id: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
    },
  })
    .from(resourceShares)
    .leftJoin(patients, eq(resourceShares.patientId, patients.id))
    .where(eq(resourceShares.resourceId, resourceId))
    .orderBy(desc(resourceShares.sharedAt));
}

export async function listResourcesForPatient(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    resource: resources,
    share: resourceShares,
  })
    .from(resourceShares)
    .innerJoin(resources, eq(resourceShares.resourceId, resources.id))
    .where(and(eq(resourceShares.patientId, patientId), eq(resources.isArchived, false)))
    .orderBy(desc(resourceShares.sharedAt));
}

export async function markResourceViewed(shareId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resourceShares).set({ isViewed: true, viewedAt: new Date() }).where(eq(resourceShares.id, shareId));
}

// ─── STAFF INVITE HELPERS ───────────────────────

export async function createStaffInvite(data: {
  token: string;
  createdByUserId: number;
  name: string;
  email: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(staffInvites).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function getStaffInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [invite] = await db.select().from(staffInvites).where(eq(staffInvites.token, token)).limit(1);
  return invite ?? null;
}

export async function markStaffInviteUsed(token: string, usedByUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffInvites).set({ usedAt: new Date(), usedByUserId }).where(eq(staffInvites.token, token));
}

export async function revokeStaffInvite(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(staffInvites).set({ revokedAt: new Date() }).where(eq(staffInvites.id, id));
}

export async function listStaffInvites(createdByUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staffInvites).where(eq(staffInvites.createdByUserId, createdByUserId)).orderBy(desc(staffInvites.createdAt));
}

export async function listStaffMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).where(eq(users.role, "staff")).orderBy(desc(users.lastSignedIn));
}

export async function removeStaffMember(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "user" }).where(and(eq(users.id, userId), eq(users.role, "staff")));
}

export async function promoteToStaff(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "staff" }).where(eq(users.id, userId));
}

// ─── PATIENT-CREATED PROTOCOL HELPERS ───────────

export async function listPatientCreatedProtocols(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).where(eq(protocols.createdByPatientId, patientId)).orderBy(desc(protocols.createdAt));
}

export async function listAllPatientCreatedProtocols(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).where(
    and(
      eq(protocols.createdBy, providerId),
      sql`${protocols.createdByPatientId} IS NOT NULL`
    )
  ).orderBy(desc(protocols.createdAt));
}


// ─── INTAKE FORMS ─────────────────────────────

export async function getIntakeStatusForPatients(patientIds: number[]) {
  const db = await getDb();
  if (!db || patientIds.length === 0) return [];
  const rows = await db
    .select({
      patientId: intakeForms.patientId,
      status: intakeForms.status,
      reviewedByProvider: intakeForms.reviewedByProvider,
    })
    .from(intakeForms)
    .where(inArray(intakeForms.patientId, patientIds));
  return rows;
}

export async function getIntakeForm(patientId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(intakeForms).where(eq(intakeForms.patientId, patientId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertIntakeForm(patientId: number, data: Partial<InsertIntakeForm>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getIntakeForm(patientId);
  if (existing) {
    await db.update(intakeForms).set(data).where(eq(intakeForms.id, existing.id));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(intakeForms).values({ patientId, ...data });
    return { id: result.insertId, patientId, ...data };
  }
}

export async function markIntakeReviewed(patientId: number, providerNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(intakeForms).set({
    reviewedByProvider: true,
    reviewedAt: new Date(),
    providerNotes: providerNotes ?? null,
  }).where(eq(intakeForms.patientId, patientId));
}
