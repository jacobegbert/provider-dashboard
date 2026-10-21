import { TRPCError } from "@trpc/server";
import type { Patient, User } from "../../drizzle/schema";
import { emitPortalEvent } from "./events";
import { createGuidanceModel, type GuidanceModel } from "./guidance";
import { pharmacyChanges, plansDiffer } from "./planDiff";
import { createPharmacyAdapter, type PharmacyAdapter } from "./pharmacy";
import type { ItemKind, ItemStatus, PharmacyStatus, PlanItem, PortalStore } from "./types";

function staff(user: User) {
  return user.role === "admin" || user.role === "staff";
}

function forbidden(message: string) {
  return new TRPCError({ code: "FORBIDDEN", message });
}

function badRequest(message: string) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}

function notFound(message: string) {
  return new TRPCError({ code: "NOT_FOUND", message });
}

function clean(value: string | null | undefined, max: number) {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

type ItemInput = {
  kind: ItemKind;
  name: string;
  dose?: string | null;
  unit?: string | null;
  route?: string | null;
  frequency?: string | null;
  instructions?: string | null;
  status: ItemStatus;
  isSampleTemplate?: boolean;
};

function normalizeItem(input: ItemInput) {
  const name = input.name.trim();
  if (!name || name.length > 256) throw badRequest("Give the item a name under 256 characters.");
  return {
    kind: input.kind,
    name,
    dose: clean(input.dose, 64),
    unit: clean(input.unit, 32),
    route: clean(input.route, 64),
    frequency: clean(input.frequency, 128),
    instructions: clean(input.instructions, 4000),
    status: input.kind === "regenerative" && input.status === "active" ? "clinic_managed" as const : input.status,
    isSampleTemplate: Boolean(input.isSampleTemplate),
  };
}

function publicPatient(patient: Patient) {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
    status: patient.status,
    healthGoals: patient.healthGoals ?? [],
    conditions: patient.conditions ?? [],
  };
}

function publicItem(item: PlanItem) {
  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    dose: item.dose,
    unit: item.unit,
    route: item.route,
    frequency: item.frequency,
    instructions: item.instructions,
    status: item.status,
    isSampleTemplate: item.isSampleTemplate,
    sortOrder: item.sortOrder,
  };
}

export function createPortalService(
  store: PortalStore,
  deps?: { pharmacy?: PharmacyAdapter; guidance?: GuidanceModel },
) {
  const pharmacy = deps?.pharmacy ?? createPharmacyAdapter();
  const guidance = deps?.guidance ?? createGuidanceModel();

  async function ownPatient(user: User) {
    if (user.role !== "user") {
      throw forbidden("This view is for a patient login. Clinic staff use the clinic portal.");
    }
    const patient = await store.getPatientByUserId(user.id);
    if (!patient || patient.deletedAt) throw forbidden("No patient record is linked to this login.");
    return patient;
  }

  async function requirePatient(user: User, patientId: number) {
    if (!staff(user)) throw forbidden("Clinic tools are limited to the practice team.");
    const patient = await store.getPatient(patientId);
    if (!patient || patient.deletedAt) throw notFound("Patient not found.");
    return patient;
  }

  async function ensurePlan(patient: Patient) {
    const existing = await store.getPlan(patient.id);
    if (existing) return existing;
    return store.insertPlan({
      patientId: patient.id,
      providerId: patient.providerId,
      summary: "",
      publishedSummary: "",
      version: 0,
      publishedAt: null,
    });
  }

  async function audit(userId: number, action: string, patientId: number, entityType: string, entityId?: number | null, extra?: Record<string, unknown>) {
    await store.logAudit({
      userId,
      action,
      entityType,
      entityId: entityId ?? null,
      details: { patientId, ...extra },
    });
  }

  function notify(userIds: Array<number | null | undefined>, event: { type: "plan" | "message"; patientId: number; version?: number }) {
    const seen = new Set<number>();
    for (const userId of userIds) {
      if (!userId || seen.has(userId)) continue;
      seen.add(userId);
      emitPortalEvent(userId, event);
    }
  }

  async function withNames(patientId: number, viewerId: number) {
    const thread = await store.listMessages(patientId);
    const names = new Map<number, string>();
    for (const message of thread) {
      if (!names.has(message.senderId)) {
        const sender = await store.getUserById(message.senderId);
        names.set(message.senderId, sender?.name || "Clinic");
      }
    }
    return thread.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      senderName: names.get(message.senderId) || "Clinic",
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
      mine: message.senderId === viewerId,
    }));
  }

  return {
    pharmacy,
    guidance,

    async authenticate(email: string, password: string) {
      const { verifyPassword } = await import("./password");
      const user = await store.getUserByEmail(email);
      const hash = user?.passwordHash || "0".repeat(64);
      const match = verifyPassword(password, hash);
      if (!user?.passwordHash || !match) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      return user;
    },

    async patientHome(user: User) {
      const patient = await ownPatient(user);
      const plan = await ensurePlan(patient);
      const published = await store.listItems(patient.id, "published");
      const intake = await store.getIntake(patient.id);
      const messages = await withNames(patient.id, user.id);
      const labs = await store.listLabs(patient.id);
      const highlights = new Map<string, (typeof labs)[number]>();
      for (const lab of labs) highlights.set(lab.name, lab);
      const labHighlights = Array.from(highlights.values()).slice(0, 4).map((lab) => ({
        name: lab.name,
        value: lab.value,
        unit: lab.unit,
        collectedOn: lab.collectedOn,
      }));
      return {
        storage: store.mode,
        patient: publicPatient(patient),
        plan: {
          version: plan.version,
          publishedAt: plan.publishedAt,
          summary: plan.publishedSummary,
          items: published.map(publicItem),
        },
        intake: {
          status: intake?.status ?? "not_started",
          reviewedByProvider: intake?.reviewedByProvider ?? false,
        },
        messages: messages.slice(-3),
        labHighlights,
      };
    },

    async patientLabs(user: User) {
      const patient = await ownPatient(user);
      const labs = await store.listLabs(patient.id);
      const grouped = new Map<string, typeof labs>();
      for (const lab of labs) {
        const rows = grouped.get(lab.name) ?? [];
        rows.push(lab);
        grouped.set(lab.name, rows);
      }
      return {
        series: Array.from(grouped.entries()).map(([name, points]) => ({
          name,
          unit: points[0]?.unit ?? "",
          referenceLow: points[0]?.referenceLow ?? null,
          referenceHigh: points[0]?.referenceHigh ?? null,
          points: points.map((point) => ({
            collectedOn: point.collectedOn,
            value: point.value,
            numeric: Number(point.value),
            note: point.note,
          })),
        })),
      };
    },

    async patientThread(user: User) {
      const patient = await ownPatient(user);
      await store.markIncomingRead(patient.id, user.id);
      return { messages: await withNames(patient.id, user.id) };
    },

    async patientSend(user: User, content: string) {
      const patient = await ownPatient(user);
      const text = content.trim();
      if (!text || text.length > 4000) throw badRequest("Write a message under 4,000 characters.");
      const message = await store.insertMessage({
        senderId: user.id,
        receiverId: patient.providerId,
        patientId: patient.id,
        content: text,
      });
      await audit(user.id, "message.send", patient.id, "message", message.id);
      notify([patient.providerId, user.id], { type: "message", patientId: patient.id });
      return { id: message.id };
    },

    async patientIntake(user: User) {
      const patient = await ownPatient(user);
      const intake = await store.getIntake(patient.id);
      return intake ?? {
        patientId: patient.id,
        status: "not_started" as const,
        goals: "",
        currentMedications: "",
        conditions: "",
        reviewedByProvider: false,
        providerNotes: null,
        submittedAt: null,
        reviewedAt: null,
      };
    },

    async patientSaveIntake(user: User, input: { goals: string; currentMedications: string; conditions: string; submit: boolean }) {
      const patient = await ownPatient(user);
      const goals = input.goals.trim().slice(0, 4000);
      const currentMedications = input.currentMedications.trim().slice(0, 4000);
      const conditions = input.conditions.trim().slice(0, 4000);
      if (input.submit && !goals) throw badRequest("Add a short note about what you want to work on before submitting.");
      const current = await store.getIntake(patient.id);
      if (current?.status === "completed") {
        throw badRequest("This intake is already submitted. The clinic can still add a review note.");
      }
      const status = input.submit ? "completed" as const : goals || currentMedications || conditions ? "in_progress" as const : "not_started" as const;
      const saved = await store.saveIntake({
        patientId: patient.id,
        status,
        goals,
        currentMedications,
        conditions,
        reviewedByProvider: input.submit ? false : current?.reviewedByProvider ?? false,
        providerNotes: current?.providerNotes ?? null,
        submittedAt: input.submit ? new Date() : current?.submittedAt ?? null,
        reviewedAt: input.submit ? null : current?.reviewedAt ?? null,
      });
      await audit(user.id, input.submit ? "intake.submit" : "intake.save", patient.id, "intake", patient.id);
      return saved;
    },

    async roster(user: User) {
      if (!staff(user)) throw forbidden("Clinic tools are limited to the practice team.");
      const patients = await store.listPatients();
      const rows = [];
      for (const patient of patients) {
        const plan = await store.getPlan(patient.id);
        const items = plan ? await store.listItems(patient.id) : [];
        const intake = await store.getIntake(patient.id);
        const thread = await store.listMessages(patient.id);
        const unread = thread.filter((message) => message.senderId !== user.id && !message.isRead).length;
        const last = thread[thread.length - 1];
        rows.push({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          status: patient.status,
          hasLogin: patient.userId != null,
          intakeStatus: intake?.status ?? "not_started",
          intakeReviewed: intake?.reviewedByProvider ?? false,
          planVersion: plan?.version ?? 0,
          unpublished: plan ? plansDiffer(plan, items) : false,
          unread,
          lastMessageAt: last?.createdAt ?? null,
        });
      }
      return rows.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
    },

    async chart(user: User, patientId: number) {
      const patient = await requirePatient(user, patientId);
      const plan = await ensurePlan(patient);
      const items = await store.listItems(patient.id);
      await store.markIncomingRead(patient.id, user.id);
      const intake = await store.getIntake(patient.id);
      return {
        storage: store.mode,
        patient: publicPatient(patient),
        plan: {
          summary: plan.summary,
          publishedSummary: plan.publishedSummary,
          version: plan.version,
          publishedAt: plan.publishedAt,
          unpublished: plansDiffer(plan, items),
        },
        draftItems: items.filter((item) => item.phase === "draft").map(publicItem),
        publishedItems: items.filter((item) => item.phase === "published").map(publicItem),
        labs: await store.listLabs(patient.id),
        messages: await withNames(patient.id, user.id),
        intake: intake ?? {
          patientId: patient.id,
          status: "not_started" as const,
          goals: "",
          currentMedications: "",
          conditions: "",
          reviewedByProvider: false,
          providerNotes: null,
          submittedAt: null,
          reviewedAt: null,
        },
        guidance: (await store.listGuidance(patient.id)).filter((draft) => draft.status === "pending"),
        orders: await store.listOrders(patient.id),
        activity: await store.listAudit(patient.id, 8),
      };
    },

    async saveSummary(user: User, patientId: number, summary: string) {
      const patient = await requirePatient(user, patientId);
      const plan = await ensurePlan(patient);
      const next = summary.trim().slice(0, 4000);
      await store.updatePlan(plan.patientId, { summary: next });
      await audit(user.id, "plan.draft", patient.id, "care_plan", plan.id, { op: "summary" });
      return { ok: true };
    },

    async addItem(user: User, patientId: number, input: ItemInput) {
      const patient = await requirePatient(user, patientId);
      const plan = await ensurePlan(patient);
      const draft = await store.listItems(patient.id, "draft");
      const item = await store.insertItem({
        ...normalizeItem(input),
        planId: plan.id,
        patientId: patient.id,
        phase: "draft",
        sourceItemId: null,
        sortOrder: draft.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1,
      });
      await audit(user.id, "plan.draft", patient.id, "care_plan_item", item.id, { op: "add" });
      return publicItem(item);
    },

    async updateItem(user: User, patientId: number, itemId: number, input: Partial<ItemInput>) {
      const patient = await requirePatient(user, patientId);
      const current = await store.getItem(itemId);
      if (!current || current.patientId !== patient.id) throw notFound("Plan item not found on this chart.");
      if (current.phase !== "draft") throw badRequest("Published lines update only when you publish the draft.");
      const next = normalizeItem({
        kind: input.kind ?? current.kind,
        name: input.name ?? current.name,
        dose: input.dose === undefined ? current.dose : input.dose,
        unit: input.unit === undefined ? current.unit : input.unit,
        route: input.route === undefined ? current.route : input.route,
        frequency: input.frequency === undefined ? current.frequency : input.frequency,
        instructions: input.instructions === undefined ? current.instructions : input.instructions,
        status: input.status ?? current.status,
        isSampleTemplate: input.isSampleTemplate ?? current.isSampleTemplate,
      });
      const saved = await store.updateItem(itemId, next);
      await audit(user.id, "plan.draft", patient.id, "care_plan_item", itemId, { op: "update" });
      return publicItem(saved);
    },

    async removeItem(user: User, patientId: number, itemId: number) {
      const patient = await requirePatient(user, patientId);
      const current = await store.getItem(itemId);
      if (!current || current.patientId !== patient.id) throw notFound("Plan item not found on this chart.");
      if (current.phase !== "draft") throw badRequest("Remove the draft line, then publish to update the patient.");
      await store.deleteItem(itemId);
      await audit(user.id, "plan.draft", patient.id, "care_plan_item", itemId, { op: "remove" });
      return { ok: true };
    },

    async publish(user: User, patientId: number) {
      const patient = await requirePatient(user, patientId);
      const plan = await ensurePlan(patient);
      const items = await store.listItems(patient.id);
      const draft = items.filter((item) => item.phase === "draft");
      const published = items.filter((item) => item.phase === "published");
      if (!plansDiffer(plan, items)) {
        return { version: plan.version, changed: false, ordersCreated: 0 };
      }
      const changes = pharmacyChanges(published, draft);
      await store.deletePublished(patient.id);
      for (const item of draft) {
        await store.insertItem({
          planId: plan.id,
          patientId: patient.id,
          phase: "published",
          sourceItemId: item.id,
          kind: item.kind,
          name: item.name,
          dose: item.dose,
          unit: item.unit,
          route: item.route,
          frequency: item.frequency,
          instructions: item.instructions,
          status: item.status,
          isSampleTemplate: item.isSampleTemplate,
          sortOrder: item.sortOrder,
        });
      }
      const version = plan.version + 1;
      await store.updatePlan(patient.id, {
        publishedSummary: plan.summary.trim(),
        version,
        publishedAt: new Date(),
      });
      let ordersCreated = 0;
      for (const change of changes) {
        const submitted = await pharmacy.submit({
          localId: `${patient.id}-${change.planItemId ?? "none"}-${version}-${change.changeType}`,
          patientId: patient.id,
          changeType: change.changeType,
          drugName: change.drugName,
          details: change.details,
        });
        await store.insertOrder({
          patientId: patient.id,
          planItemId: change.planItemId,
          adapterId: pharmacy.id,
          externalId: submitted.externalId,
          changeType: change.changeType,
          drugName: change.drugName,
          details: change.details,
          status: submitted.status === "accepted" ? "accepted" : "queued",
        });
        ordersCreated += 1;
      }
      await audit(user.id, "plan.publish", patient.id, "care_plan", plan.id, { version, ordersCreated });
      notify([patient.userId], { type: "plan", patientId: patient.id, version });
      return { version, changed: true, ordersCreated };
    },

    async clinicSend(user: User, patientId: number, content: string) {
      const patient = await requirePatient(user, patientId);
      const text = content.trim();
      if (!text || text.length > 4000) throw badRequest("Write a message under 4,000 characters.");
      const message = await store.insertMessage({
        senderId: user.id,
        receiverId: patient.userId ?? patient.providerId,
        patientId: patient.id,
        content: text,
      });
      await audit(user.id, "message.send", patient.id, "message", message.id);
      notify([patient.userId, user.id], { type: "message", patientId: patient.id });
      return { id: message.id };
    },

    async reviewIntake(user: User, patientId: number, providerNotes: string) {
      const patient = await requirePatient(user, patientId);
      const current = await store.getIntake(patient.id);
      if (!current) throw badRequest("This patient has not started an intake.");
      const saved = await store.saveIntake({
        ...current,
        reviewedByProvider: true,
        providerNotes: providerNotes.trim().slice(0, 4000) || null,
        reviewedAt: new Date(),
      });
      await audit(user.id, "intake.review", patient.id, "intake", patient.id);
      return saved;
    },

    async requestGuidance(user: User, patientId: number) {
      const patient = await requirePatient(user, patientId);
      const labs = await store.listLabs(patient.id);
      const draft = await store.listItems(patient.id, "draft");
      let suggestions;
      try {
        suggestions = await guidance.suggest({
          patientFirstName: patient.firstName,
          labs: labs.map((lab) => ({
            name: lab.name,
            value: lab.value,
            unit: lab.unit,
            collectedOn: lab.collectedOn,
          })),
          items: draft.map((item) => ({
            kind: item.kind,
            name: item.name,
            dose: item.dose,
            status: item.status,
          })),
        });
      } catch (error) {
        console.error("[guidance] draft request failed", error instanceof Error ? error.message : "unknown");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "A guidance draft could not be created. Nothing was sent to the patient.",
        });
      }
      const created = [];
      for (const suggestion of suggestions) {
        created.push(await store.insertGuidance({
          patientId: patient.id,
          modelId: guidance.id,
          title: suggestion.title.slice(0, 256),
          body: suggestion.body.slice(0, 4000),
          status: "pending",
        }));
      }
      await audit(user.id, "guidance.request", patient.id, "guidance", null, { count: created.length, modelId: guidance.id });
      return created.map((draftRow) => ({
        id: draftRow.id,
        title: draftRow.title,
        body: draftRow.body,
        status: draftRow.status,
        modelId: draftRow.modelId,
      }));
    },

    async reviewGuidance(user: User, draftId: number, decision: "approved" | "dismissed") {
      if (!staff(user)) throw forbidden("Clinic tools are limited to the practice team.");
      const draft = await store.getGuidance(draftId);
      if (!draft) throw notFound("Guidance draft not found.");
      if (draft.status !== "pending") throw badRequest("This draft was already reviewed.");
      const patient = await requirePatient(user, draft.patientId);
      await store.updateGuidance(draftId, {
        status: decision,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      });
      if (decision === "approved") {
        const plan = await ensurePlan(patient);
        const existing = await store.listItems(patient.id, "draft");
        await store.insertItem({
          planId: plan.id,
          patientId: patient.id,
          phase: "draft",
          sourceItemId: null,
          kind: "note",
          name: draft.title,
          dose: null,
          unit: null,
          route: null,
          frequency: null,
          instructions: draft.body,
          status: "active",
          isSampleTemplate: draft.modelId === "stub",
          sortOrder: existing.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 1,
        });
      }
      await audit(user.id, "guidance.review", patient.id, "guidance", draftId, { decision });
      return { ok: true };
    },

    async pharmacyQueue(user: User) {
      if (!staff(user)) throw forbidden("Clinic tools are limited to the practice team.");
      const orders = await store.listOrders();
      const patients = await store.listPatients();
      const names = new Map(patients.map((patient) => [patient.id, `${patient.firstName} ${patient.lastName}`]));
      return {
        adapterId: pharmacy.id,
        adapterName: pharmacy.displayName,
        orders: orders.map((order) => ({
          ...order,
          patientName: names.get(order.patientId) ?? "Unknown chart",
        })),
      };
    },

    async setPharmacyStatus(user: User, orderId: number, status: Extract<PharmacyStatus, "filled" | "cancelled">) {
      if (!staff(user)) throw forbidden("Clinic tools are limited to the practice team.");
      const order = await store.getOrder(orderId);
      if (!order) throw notFound("Order not found.");
      if (order.adapterId !== "mock") {
        throw badRequest("Only the mock queue can be updated from this screen.");
      }
      if (order.status === "filled" || order.status === "cancelled" || order.status === "failed") {
        throw badRequest("This mock order is already closed.");
      }
      const saved = await store.updateOrderStatus(orderId, status);
      await audit(user.id, "pharmacy.status", order.patientId, "pharmacy_order", orderId, { status });
      return saved;
    },
  };
}

export type PortalService = ReturnType<typeof createPortalService>;
