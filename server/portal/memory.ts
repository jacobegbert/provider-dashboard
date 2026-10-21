import type { Patient, User } from "../../drizzle/schema";
import type {
  AuditEntry,
  CarePlan,
  GuidanceDraft,
  GuidanceStatus,
  IntakeRecord,
  LabResult,
  NewPatient,
  NewPlanItem,
  PharmacyOrder,
  PharmacyStatus,
  PlanItem,
  PortalStore,
  ThreadMessage,
} from "./types";

/**
 * Process-local demo store. It is wiped when the process stops.
 * Never put real patient information in this mode.
 */
export function createMemoryStore(): PortalStore {
  let seq = 1;
  const nextId = () => seq++;
  const users: User[] = [];
  const patients: Patient[] = [];
  const plans: CarePlan[] = [];
  const items: PlanItem[] = [];
  const labs: LabResult[] = [];
  const messages: ThreadMessage[] = [];
  const intakes: IntakeRecord[] = [];
  const orders: PharmacyOrder[] = [];
  const guidance: GuidanceDraft[] = [];
  const audits: AuditEntry[] = [];

  const byId = <T extends { id: number }>(rows: T[], id: number) => rows.find((row) => row.id === id);

  return {
    mode: "memory",
    async getUserByOpenId(openId) {
      return users.find((user) => user.openId === openId);
    },
    async getUserByEmail(email) {
      const needle = email.trim().toLowerCase();
      return users.find((user) => user.email?.toLowerCase() === needle);
    },
    async getUserById(id) {
      return byId(users, id);
    },
    async upsertUser(input) {
      const now = new Date();
      const existing = users.find((user) => user.openId === input.openId);
      if (!existing) {
        users.push({
          id: nextId(),
          openId: input.openId,
          name: input.name ?? null,
          email: input.email ?? null,
          passwordHash: input.passwordHash ?? null,
          loginMethod: input.loginMethod ?? null,
          role: input.role ?? "user",
          createdAt: now,
          updatedAt: now,
          lastSignedIn: input.lastSignedIn ?? now,
        });
        return;
      }
      if (input.name !== undefined) existing.name = input.name;
      if (input.email !== undefined) existing.email = input.email;
      if (input.passwordHash !== undefined) existing.passwordHash = input.passwordHash;
      if (input.loginMethod !== undefined) existing.loginMethod = input.loginMethod;
      if (input.role !== undefined) existing.role = input.role;
      if (input.lastSignedIn !== undefined) existing.lastSignedIn = input.lastSignedIn;
      existing.updatedAt = now;
    },
    async listPatients() {
      return patients.filter((patient) => !patient.deletedAt);
    },
    async getPatient(id) {
      return byId(patients, id);
    },
    async getPatientByUserId(userId) {
      return patients.find((patient) => patient.userId === userId && !patient.deletedAt);
    },
    async insertPatient(input: NewPatient) {
      const now = new Date();
      const patient: Patient = {
        id: nextId(),
        userId: input.userId,
        providerId: input.providerId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        sex: null,
        status: input.status ?? "active",
        subscriptionTier: "standard",
        subscriptionExpiresAt: null,
        healthGoals: input.healthGoals ?? [],
        conditions: input.conditions ?? [],
        smsOptIn: null,
        smsOptInAt: null,
        notes: input.notes ?? null,
        avatarUrl: null,
        lastProviderInteraction: null,
        nextRequiredAction: null,
        onboardingCompletedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      patients.push(patient);
      return patient;
    },
    async getPlan(patientId) {
      return plans.find((plan) => plan.patientId === patientId);
    },
    async insertPlan(input) {
      const plan = { ...input, id: nextId() };
      plans.push(plan);
      return plan;
    },
    async updatePlan(patientId, patch) {
      const plan = plans.find((row) => row.patientId === patientId);
      if (!plan) throw new Error("Plan not found");
      Object.assign(plan, patch);
      return plan;
    },
    async listItems(patientId, phase) {
      return items
        .filter((item) => item.patientId === patientId && (!phase || item.phase === phase))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    },
    async getItem(id) {
      return byId(items, id);
    },
    async insertItem(input: NewPlanItem) {
      const item = { ...input, id: nextId() };
      items.push(item);
      return item;
    },
    async updateItem(id, patch) {
      const item = byId(items, id);
      if (!item) throw new Error("Item not found");
      Object.assign(item, patch);
      return item;
    },
    async deleteItem(id) {
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) items.splice(index, 1);
    },
    async deletePublished(patientId) {
      for (let index = items.length - 1; index >= 0; index -= 1) {
        if (items[index].patientId === patientId && items[index].phase === "published") {
          items.splice(index, 1);
        }
      }
    },
    async listLabs(patientId) {
      return labs
        .filter((lab) => lab.patientId === patientId)
        .sort((a, b) => a.collectedOn.localeCompare(b.collectedOn) || a.id - b.id);
    },
    async insertLab(input) {
      const lab = { ...input, id: nextId() };
      labs.push(lab);
      return lab;
    },
    async listMessages(patientId) {
      return messages
        .filter((message) => message.patientId === patientId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id);
    },
    async insertMessage(input) {
      const message: ThreadMessage = {
        id: nextId(),
        senderId: input.senderId,
        receiverId: input.receiverId,
        patientId: input.patientId,
        content: input.content,
        isRead: input.isRead ?? false,
        createdAt: input.createdAt ?? new Date(),
      };
      messages.push(message);
      return message;
    },
    async markIncomingRead(patientId, viewerId) {
      for (const message of messages) {
        if (message.patientId === patientId && message.senderId !== viewerId && !message.isRead) {
          message.isRead = true;
        }
      }
    },
    async getIntake(patientId) {
      return intakes.find((intake) => intake.patientId === patientId);
    },
    async saveIntake(record) {
      const index = intakes.findIndex((intake) => intake.patientId === record.patientId);
      if (index >= 0) intakes[index] = record;
      else intakes.push(record);
      return record;
    },
    async listOrders(patientId) {
      return orders
        .filter((order) => patientId == null || order.patientId === patientId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
    },
    async getOrder(id) {
      return byId(orders, id);
    },
    async insertOrder(input) {
      const now = new Date();
      const order: PharmacyOrder = {
        ...input,
        id: nextId(),
        createdAt: input.createdAt ?? now,
        updatedAt: now,
      };
      orders.push(order);
      return order;
    },
    async updateOrderStatus(id, status: PharmacyStatus) {
      const order = byId(orders, id);
      if (!order) throw new Error("Order not found");
      order.status = status;
      order.updatedAt = new Date();
      return order;
    },
    async listGuidance(patientId) {
      return guidance
        .filter((draft) => draft.patientId === patientId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
    },
    async getGuidance(id) {
      return byId(guidance, id);
    },
    async insertGuidance(input) {
      const draft: GuidanceDraft = {
        ...input,
        id: nextId(),
        status: input.status ?? "pending",
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
      };
      guidance.push(draft);
      return draft;
    },
    async updateGuidance(id, patch) {
      const draft = byId(guidance, id);
      if (!draft) throw new Error("Guidance draft not found");
      if (patch.status) draft.status = patch.status as GuidanceStatus;
      if (patch.reviewedBy !== undefined) draft.reviewedBy = patch.reviewedBy;
      if (patch.reviewedAt !== undefined) draft.reviewedAt = patch.reviewedAt;
      return draft;
    },
    async logAudit(entry) {
      audits.push({
        id: nextId(),
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: entry.details ?? null,
        createdAt: new Date(),
      });
    },
    async listAudit(patientId, limit) {
      return audits
        .filter((entry) => entry.details?.patientId === patientId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    },
  };
}
