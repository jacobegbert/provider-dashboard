import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  auditLog,
  carePlanItems,
  carePlans,
  guidanceDrafts,
  intakeForms,
  labResults,
  patients,
  pharmacyOrders,
  users,
  type CarePlanItemRow,
  type CarePlanRow,
  type GuidanceDraftRow,
  type LabResultRow,
  type PharmacyOrderRow,
} from "../../drizzle/schema";
import type {
  AuditEntry,
  CarePlan,
  GuidanceDraft,
  IntakeRecord,
  LabResult,
  PharmacyOrder,
  PlanItem,
  PortalStore,
  ThreadMessage,
} from "./types";
import { messages } from "../../drizzle/schema";

function insertId(result: unknown): number {
  const header = (Array.isArray(result) ? result[0] : result) as { insertId?: number } | undefined;
  if (!header?.insertId) throw new Error("Database insert did not return an id");
  return Number(header.insertId);
}

function toPlan(row: CarePlanRow): CarePlan {
  return {
    id: row.id,
    patientId: row.patientId,
    providerId: row.providerId,
    summary: row.summary,
    publishedSummary: row.publishedSummary,
    version: row.version,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
  };
}

function toItem(row: CarePlanItemRow): PlanItem {
  return {
    id: row.id,
    planId: row.planId,
    patientId: row.patientId,
    phase: row.phase,
    sourceItemId: row.sourceItemId,
    kind: row.kind,
    name: row.name,
    dose: row.dose,
    unit: row.unit,
    route: row.route,
    frequency: row.frequency,
    instructions: row.instructions,
    status: row.status,
    isSampleTemplate: Boolean(row.isSampleTemplate),
    sortOrder: row.sortOrder,
  };
}

function toLab(row: LabResultRow): LabResult {
  return {
    id: row.id,
    patientId: row.patientId,
    name: row.name,
    value: row.value,
    unit: row.unit,
    referenceLow: row.referenceLow,
    referenceHigh: row.referenceHigh,
    collectedOn: row.collectedOn,
    note: row.note,
  };
}

function toOrder(row: PharmacyOrderRow): PharmacyOrder {
  return {
    id: row.id,
    patientId: row.patientId,
    planItemId: row.planItemId,
    adapterId: row.adapterId,
    externalId: row.externalId,
    changeType: row.changeType,
    drugName: row.drugName,
    details: row.details,
    status: row.status,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function toGuidance(row: GuidanceDraftRow): GuidanceDraft {
  return {
    id: row.id,
    patientId: row.patientId,
    modelId: row.modelId,
    title: row.title,
    body: row.body,
    status: row.status,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
    createdAt: new Date(row.createdAt),
  };
}

function toMessage(row: typeof messages.$inferSelect): ThreadMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    receiverId: row.receiverId,
    patientId: row.patientId,
    content: row.content,
    isRead: Boolean(row.isRead),
    createdAt: new Date(row.createdAt),
  };
}

export function createDrizzleStore(db: MySql2Database): PortalStore {
  return {
    mode: "mysql",
    async getUserByOpenId(openId) {
      const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      return rows[0];
    },
    async getUserByEmail(email) {
      const needle = email.trim().toLowerCase();
      const rows = await db
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${needle}`)
        .limit(1);
      return rows[0];
    },
    async getUserById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return rows[0];
    },
    async upsertUser(input) {
      const existing = await this.getUserByOpenId(input.openId);
      if (!existing) {
        await db.insert(users).values({
          openId: input.openId,
          name: input.name ?? null,
          email: input.email ?? null,
          passwordHash: input.passwordHash ?? null,
          loginMethod: input.loginMethod ?? null,
          role: input.role ?? "user",
          lastSignedIn: input.lastSignedIn ?? new Date(),
        });
        return;
      }
      await db
        .update(users)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
          ...(input.loginMethod !== undefined ? { loginMethod: input.loginMethod } : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.lastSignedIn !== undefined ? { lastSignedIn: input.lastSignedIn } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.openId, input.openId));
    },
    async listPatients() {
      return db.select().from(patients).where(sql`${patients.deletedAt} is null`);
    },
    async getPatient(id) {
      const rows = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
      return rows[0];
    },
    async getPatientByUserId(userId) {
      const rows = await db
        .select()
        .from(patients)
        .where(and(eq(patients.userId, userId), sql`${patients.deletedAt} is null`))
        .limit(1);
      return rows[0];
    },
    async insertPatient(input) {
      const result = await db.insert(patients).values({
        userId: input.userId,
        providerId: input.providerId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        status: input.status ?? "active",
        healthGoals: input.healthGoals ?? [],
        conditions: input.conditions ?? [],
        notes: input.notes ?? null,
      });
      const patient = await this.getPatient(insertId(result));
      if (!patient) throw new Error("Patient insert failed");
      return patient;
    },
    async getPlan(patientId) {
      const rows = await db.select().from(carePlans).where(eq(carePlans.patientId, patientId)).limit(1);
      return rows[0] ? toPlan(rows[0]) : undefined;
    },
    async insertPlan(input) {
      const result = await db.insert(carePlans).values(input);
      const plan = await this.getPlan(input.patientId);
      void result;
      if (!plan) throw new Error("Plan insert failed");
      return plan;
    },
    async updatePlan(patientId, patch) {
      await db.update(carePlans).set({ ...patch, updatedAt: new Date() }).where(eq(carePlans.patientId, patientId));
      const plan = await this.getPlan(patientId);
      if (!plan) throw new Error("Plan not found");
      return plan;
    },
    async listItems(patientId, phase) {
      const rows = await db
        .select()
        .from(carePlanItems)
        .where(
          phase
            ? and(eq(carePlanItems.patientId, patientId), eq(carePlanItems.phase, phase))
            : eq(carePlanItems.patientId, patientId),
        );
      return rows.map(toItem).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    },
    async getItem(id) {
      const rows = await db.select().from(carePlanItems).where(eq(carePlanItems.id, id)).limit(1);
      return rows[0] ? toItem(rows[0]) : undefined;
    },
    async insertItem(input) {
      const result = await db.insert(carePlanItems).values(input);
      const item = await this.getItem(insertId(result));
      if (!item) throw new Error("Plan item insert failed");
      return item;
    },
    async updateItem(id, patch) {
      await db.update(carePlanItems).set({ ...patch, updatedAt: new Date() }).where(eq(carePlanItems.id, id));
      const item = await this.getItem(id);
      if (!item) throw new Error("Item not found");
      return item;
    },
    async deleteItem(id) {
      await db.delete(carePlanItems).where(eq(carePlanItems.id, id));
    },
    async deletePublished(patientId) {
      await db
        .delete(carePlanItems)
        .where(and(eq(carePlanItems.patientId, patientId), eq(carePlanItems.phase, "published")));
    },
    async listLabs(patientId) {
      const rows = await db.select().from(labResults).where(eq(labResults.patientId, patientId));
      return rows.map(toLab).sort((a, b) => a.collectedOn.localeCompare(b.collectedOn) || a.id - b.id);
    },
    async insertLab(input) {
      const result = await db.insert(labResults).values(input);
      const rows = await db.select().from(labResults).where(eq(labResults.id, insertId(result))).limit(1);
      if (!rows[0]) throw new Error("Lab insert failed");
      return toLab(rows[0]);
    },
    async listMessages(patientId) {
      const rows = await db.select().from(messages).where(eq(messages.patientId, patientId));
      return rows.map(toMessage).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
    },
    async insertMessage(input) {
      const result = await db.insert(messages).values({
        senderId: input.senderId,
        receiverId: input.receiverId,
        patientId: input.patientId,
        content: input.content,
        messageType: "text",
        isRead: input.isRead ?? false,
        createdAt: input.createdAt ?? new Date(),
      });
      const rows = await db.select().from(messages).where(eq(messages.id, insertId(result))).limit(1);
      if (!rows[0]) throw new Error("Message insert failed");
      return toMessage(rows[0]);
    },
    async markIncomingRead(patientId, viewerId) {
      await db
        .update(messages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(messages.patientId, patientId), ne(messages.senderId, viewerId), eq(messages.isRead, false)));
    },
    async getIntake(patientId) {
      const rows = await db.select().from(intakeForms).where(eq(intakeForms.patientId, patientId)).limit(1);
      const row = rows[0];
      if (!row) return undefined;
      const data = row.formData ?? {};
      return {
        patientId: row.patientId,
        status: row.status,
        goals: data.goals ?? "",
        currentMedications: data.currentMedications ?? "",
        conditions: data.conditions ?? "",
        reviewedByProvider: Boolean(row.reviewedByProvider),
        providerNotes: row.providerNotes,
        submittedAt: row.submittedAt ? new Date(row.submittedAt) : null,
        reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
      };
    },
    async saveIntake(record: IntakeRecord) {
      const existing = await db.select().from(intakeForms).where(eq(intakeForms.patientId, record.patientId)).limit(1);
      const values = {
        currentSection: record.status === "completed" ? 3 : 1,
        status: record.status,
        formData: {
          goals: record.goals,
          currentMedications: record.currentMedications,
          conditions: record.conditions,
        },
        completedSections: record.status === "completed" ? ["goals", "medications", "conditions"] : [],
        submittedAt: record.submittedAt,
        providerNotes: record.providerNotes,
        reviewedByProvider: record.reviewedByProvider,
        reviewedAt: record.reviewedAt,
        updatedAt: new Date(),
      };
      if (!existing[0]) {
        await db.insert(intakeForms).values({ patientId: record.patientId, ...values });
      } else {
        await db.update(intakeForms).set(values).where(eq(intakeForms.id, existing[0].id));
      }
      const saved = await this.getIntake(record.patientId);
      if (!saved) throw new Error("Intake save failed");
      return saved;
    },
    async listOrders(patientId) {
      const rows = patientId == null
        ? await db.select().from(pharmacyOrders).orderBy(desc(pharmacyOrders.id))
        : await db.select().from(pharmacyOrders).where(eq(pharmacyOrders.patientId, patientId)).orderBy(desc(pharmacyOrders.id));
      return rows.map(toOrder);
    },
    async getOrder(id) {
      const rows = await db.select().from(pharmacyOrders).where(eq(pharmacyOrders.id, id)).limit(1);
      return rows[0] ? toOrder(rows[0]) : undefined;
    },
    async insertOrder(input) {
      const result = await db.insert(pharmacyOrders).values({
        patientId: input.patientId,
        planItemId: input.planItemId,
        adapterId: input.adapterId,
        externalId: input.externalId,
        changeType: input.changeType,
        drugName: input.drugName,
        details: input.details,
        status: input.status,
        createdAt: input.createdAt ?? new Date(),
      });
      const order = await this.getOrder(insertId(result));
      if (!order) throw new Error("Order insert failed");
      return order;
    },
    async updateOrderStatus(id, status) {
      await db.update(pharmacyOrders).set({ status, updatedAt: new Date() }).where(eq(pharmacyOrders.id, id));
      const order = await this.getOrder(id);
      if (!order) throw new Error("Order not found");
      return order;
    },
    async listGuidance(patientId) {
      const rows = await db
        .select()
        .from(guidanceDrafts)
        .where(eq(guidanceDrafts.patientId, patientId))
        .orderBy(desc(guidanceDrafts.id));
      return rows.map(toGuidance);
    },
    async getGuidance(id) {
      const rows = await db.select().from(guidanceDrafts).where(eq(guidanceDrafts.id, id)).limit(1);
      return rows[0] ? toGuidance(rows[0]) : undefined;
    },
    async insertGuidance(input) {
      const result = await db.insert(guidanceDrafts).values({
        patientId: input.patientId,
        modelId: input.modelId,
        title: input.title,
        body: input.body,
        status: input.status ?? "pending",
      });
      const draft = await this.getGuidance(insertId(result));
      if (!draft) throw new Error("Guidance insert failed");
      return draft;
    },
    async updateGuidance(id, patch) {
      await db.update(guidanceDrafts).set(patch).where(eq(guidanceDrafts.id, id));
      const draft = await this.getGuidance(id);
      if (!draft) throw new Error("Guidance draft not found");
      return draft;
    },
    async logAudit(entry) {
      await db.insert(auditLog).values({
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details ?? null,
      });
    },
    async listAudit(patientId, limit) {
      const rows = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(200);
      return rows
        .filter((row) => row.details?.patientId === patientId)
        .slice(0, limit)
        .map((row): AuditEntry => ({
          id: row.id,
          userId: row.userId,
          action: row.action,
          entityType: row.entityType,
          entityId: row.entityId,
          details: row.details,
          createdAt: new Date(row.createdAt),
        }));
    },
  };
}
