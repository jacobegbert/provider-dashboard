import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, ownerProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHash, timingSafeEqual } from "crypto";
import * as db from "./db";
import { messages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getGoogleAuthUrl,
  getConnectionStatus,
  disconnectGoogle,
  syncAppointmentToGoogle,
  deleteGoogleEvent,
  syncAllAppointments,
} from "./googleCalendar";
import { createDatabaseBackup, listBackups, addToManifest, getBackupDownloadUrl, restoreDatabaseBackup } from "./backup";
import { notifyOwner } from "./_core/notification";
import { generateIntakePdf } from "./intakePdfGenerator";

/**
 * Ensures the current user has access to the given patient's data.
 * - Admins (providers) can access any patient.
 * - Regular users can only access their own patient record.
 * Throws FORBIDDEN if access is denied.
 */
async function ensurePatientAccess(ctx: { user: { id: number; role: string; email?: string | null; name?: string | null } }, patientId: number) {
  if (ctx.user.role === "admin" || ctx.user.role === "staff") return; // Provider/staff can access all patients
  const patient = await db.getPatient(patientId);
  if (!patient) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this patient's data" });
  }
  // Direct userId match
  if (patient.userId === ctx.user.id) return;
  // Allow access if the user resolves to this patient via email/name matching
  const resolved = await resolvePatientForUser(ctx);
  if (resolved && resolved.id === patientId) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this patient's data" });
}

/**
 * Ensures the current user owns the given assignment (via the linked patient).
 * - Admins can access any assignment.
 * - Regular users can only access assignments for their own patient record.
 */
async function ensureAssignmentAccess(ctx: { user: { id: number; role: string } }, assignmentId: number) {
  if (ctx.user.role === "admin" || ctx.user.role === "staff") return;
  const assignment = await db.getAssignment(assignmentId);
  if (!assignment) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
  }
  await ensurePatientAccess(ctx, assignment.patientId);
}

/**
 * Resolves the patient record for the current user.
 * Tries: userId match → email match → name match (for admin preview).
 * Used by all patient-facing procedures to support linked accounts.
 */
async function resolvePatientForUser(ctx: { user: { id: number; email?: string | null; name?: string | null; role: string } }) {
  // 1. Direct userId link
  let patient = await db.getPatientByUserId(ctx.user.id);
  if (patient) return patient;

  // 2. Email match (auto-link if unlinked)
  if (ctx.user.email) {
    patient = await db.getPatientByEmail(ctx.user.email);
    if (patient) {
      if (!patient.userId) {
        await db.linkPatientToUser(patient.id, ctx.user.id);
      }
      return patient;
    }
  }

  // 3. Name match (for admin accounts with different email)
  if (ctx.user.name) {
    const nameParts = ctx.user.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      patient = await db.getPatientByName(firstName, lastName);
      if (patient) return patient;
    }
  }

  return null;
}

// ─── PROVIDER PROFILE ROUTER ─────────────────

const providerProfileRouter = router({
  get: adminProcedure.query(async ({ ctx }) => {
    return db.getProviderProfile(ctx.ownerId);
  }),

  upsert: adminProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        practiceName: z.string().optional(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.upsertProviderProfile(ctx.ownerId, input);
    }),
});

// ─── PATIENT ROUTER ───────────────────────────

const patientRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return db.listPatients(ctx.ownerId);
  }),

  intakeStatuses: adminProcedure.query(async ({ ctx }) => {
    const patients = await db.listPatients(ctx.ownerId);
    const patientIds = patients.map((p) => p.id);
    return db.getIntakeStatusForPatients(patientIds);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.id);
      return db.getPatient(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        dateOfBirth: z.string().optional(),
        sex: z.enum(["male", "female"]).optional(),
        subscriptionTier: z.enum(["standard", "premium", "elite"]).optional(),
        healthGoals: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.createPatient({
        ...input,
        providerId: ctx.ownerId,
        status: "new",
      });
      await db.logAudit({
        userId: ctx.user.id,
        action: "patient.create",
        entityType: "patient",
        entityId: result.id,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.string().optional().nullable(),
        status: z.enum(["active", "paused", "completed", "new", "inactive", "prospective"]).optional(),
        sex: z.enum(["male", "female"]).optional().nullable(),
        subscriptionTier: z.enum(["standard", "premium", "elite"]).optional(),
        healthGoals: z.array(z.string()).optional(),
        conditions: z.array(z.string()).optional(),
        notes: z.string().optional().nullable(),
        nextRequiredAction: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updatePatient(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "patient.update",
        entityType: "patient",
        entityId: id,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deletePatient(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "patient.delete",
        entityType: "patient",
        entityId: input.id,
      });
      return { success: true };
    }),

  restore: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.restorePatient(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "patient.restore",
        entityType: "patient",
        entityId: input.id,
      });
      return { success: true };
    }),

  permanentDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Only allow permanent delete of soft-deleted patients
      const patient = await db.getPatient(input.id);
      if (!patient?.deletedAt) {
        throw new Error("Patient must be soft-deleted first before permanent deletion");
      }
      await db.permanentlyDeletePatient(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "patient.permanentDelete",
        entityType: "patient",
        entityId: input.id,
      });
      return { success: true };
    }),

  listDeleted: adminProcedure.query(async ({ ctx }) => {
    return db.listDeletedPatients(ctx.ownerId);
  }),

  /** Get the patient record linked to the current authenticated user.
   *  Admin/staff can pass viewAs=patientId to impersonate a patient for preview. */
  myRecord: protectedProcedure
    .input(z.object({ viewAs: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Admin impersonation: return the specified patient record directly
      if (input?.viewAs && (ctx.user.role === "admin" || ctx.user.role === "staff")) {
        return db.getPatient(input.viewAs);
      }
      return resolvePatientForUser(ctx);
    }),
});

const protocolRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return db.listProtocols(ctx.ownerId);
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    const protos = await db.listAllProtocols(ctx.ownerId);
    // Enrich with step count and active assignment count
    const enriched = await Promise.all(
      protos.map(async (p) => {
        const steps = await db.listProtocolSteps(p.id);
        const assignments = await db.listAssignmentsForProtocol(p.id);
        return {
          ...p,
          stepCount: steps.length,
          activeAssignments: assignments.filter((a: any) => a.status === "active").length,
          totalAssignments: assignments.length,
        };
      })
    );
    return enriched;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const protocol = await db.getProtocol(input.id);
      if (!protocol) return null;
      const steps = await db.listProtocolSteps(input.id);
      return { ...protocol, steps };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum([
          "nutrition", "supplement", "lifestyle", "lab_work", "exercise",
          "sleep", "stress", "peptides", "hormone", "other",
        ]),
        durationDays: z.number().min(1).optional().nullable(),
        milestones: z.array(z.object({ day: z.number(), label: z.string() })).optional(),
        labCheckpoints: z.array(z.object({ day: z.number(), labName: z.string() })).optional(),
        steps: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]),
            customDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
            startDay: z.number().optional().nullable(),
            endDay: z.number().optional().nullable(),
            timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
            dosageAmount: z.string().optional().nullable(),
            dosageUnit: z.string().optional().nullable(),
            route: z.string().optional().nullable(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { steps, ...protocolData } = input;
      const result = await db.createProtocol({
        ...protocolData,
        createdBy: ctx.ownerId,
        isTemplate: true,
      });
      if (steps && steps.length > 0) {
        for (let i = 0; i < steps.length; i++) {
          await db.createProtocolStep({
            protocolId: result.id,
            sortOrder: i,
            ...steps[i],
          });
        }
      }
      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.create",
        entityType: "protocol",
        entityId: result.id,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.enum([
          "nutrition", "supplement", "lifestyle", "lab_work", "exercise",
          "sleep", "stress", "peptides", "hormone", "other",
        ]).optional(),
        durationDays: z.number().min(1).optional().nullable(),
        milestones: z.array(z.object({ day: z.number(), label: z.string() })).optional(),
        labCheckpoints: z.array(z.object({ day: z.number(), labName: z.string() })).optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateProtocol(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.update",
        entityType: "protocol",
        entityId: id,
      });
    }),

  /** Full update: protocol metadata + replace all steps */
  fullUpdate: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum([
          "nutrition", "supplement", "lifestyle", "lab_work", "exercise",
          "sleep", "stress", "peptides", "hormone", "other",
        ]),
        durationDays: z.number().min(1).optional().nullable(),
        milestones: z.array(z.object({ day: z.number(), label: z.string() })).optional(),
        labCheckpoints: z.array(z.object({ day: z.number(), labName: z.string() })).optional(),
        steps: z.array(
          z.object({
            id: z.number().optional(), // existing step id (undefined = new step)
            title: z.string().min(1),
            description: z.string().optional(),
            frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]),
            customDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
            startDay: z.number().optional().nullable(),
            endDay: z.number().optional().nullable(),
            timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
            dosageAmount: z.string().optional().nullable(),
            dosageUnit: z.string().optional().nullable(),
            route: z.string().optional().nullable(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, steps, ...protocolData } = input;
      // Update protocol metadata
      await db.updateProtocol(id, protocolData);

      if (steps !== undefined) {
        // Get existing steps
        const existingSteps = await db.listProtocolSteps(id);
        const incomingIds = new Set(steps.filter(s => s.id).map(s => s.id!));

        // Delete steps that are no longer present
        for (const existing of existingSteps) {
          if (!incomingIds.has(existing.id)) {
            await db.deleteProtocolStep(existing.id);
          }
        }

        // Update existing steps and create new ones
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (step.id) {
            // Update existing step
            const { id: stepId, ...stepData } = step;
            await db.updateProtocolStep(stepId, { ...stepData, sortOrder: i });
          } else {
            // Create new step
            await db.createProtocolStep({
              protocolId: id,
              sortOrder: i,
              ...step,
            });
          }
        }
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.fullUpdate",
        entityType: "protocol",
        entityId: id,
      });

      // Notify all patients with active assignments of this protocol
      try {
        const { notifyPatientProtocolUpdated } = await import("./patientNotify");
        const assignments = await db.listAssignmentsForProtocol(id);
        const activeAssignments = assignments.filter((a: any) => a.status === "active");
        const providerProfile = await db.getProviderProfile(ctx.ownerId);
        const providerName = providerProfile
          ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || "Your provider"
          : "Your provider";
        const protocol = await db.getProtocol(id);
        for (const assignment of activeAssignments) {
          const patient = await db.getPatient(assignment.patientId);
          if (patient) {
            const user = patient.userId ? await db.getUserById(patient.userId) : null;
            notifyPatientProtocolUpdated({
              email: user?.email || patient.email || null,
              phone: patient.phone || null,
              providerName,
              protocolName: protocol?.name || "Your protocol",
              changeDescription: "Your provider has updated the steps and details of this protocol. Please review the latest version in your portal.",
              portalUrl: "https://www.blacklabelmedicine.com/patient/protocols",
            }).catch((err) => console.error("[Notify] Protocol update notification failed:", err));
          }
        }
      } catch (e) {
        console.warn("[Protocol] Update notification failed:", e);
      }
    }),

  /** Clone a protocol: duplicate protocol + all steps with (Copy) suffix */
  clone: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const protocol = await db.getProtocol(input.id);
      if (!protocol) throw new TRPCError({ code: "NOT_FOUND", message: "Protocol not found" });
      const steps = await db.listProtocolSteps(input.id);

      const cloned = await db.createProtocol({
        name: `${protocol.name} (Copy)`,
        description: protocol.description,
        category: protocol.category,
        durationDays: protocol.durationDays,
        milestones: protocol.milestones,
        labCheckpoints: protocol.labCheckpoints,
        createdBy: ctx.ownerId,
        isTemplate: true,
      });

      for (const step of steps) {
        await db.createProtocolStep({
          protocolId: cloned.id,
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
          sortOrder: step.sortOrder,
        });
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.clone",
        entityType: "protocol",
        entityId: cloned.id,
      });

      return cloned;
    }),

  /** Seed a pre-built template into the protocol library */
  seedTemplate: adminProcedure
    .input(z.object({ templateKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { PROTOCOL_TEMPLATES } = await import("../shared/protocolTemplates");
      const template = PROTOCOL_TEMPLATES.find((t) => t.key === input.templateKey);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      const result = await db.createProtocol({
        name: template.name,
        description: template.description,
        category: template.category,
        durationDays: template.durationDays,
        milestones: template.milestones,
        labCheckpoints: template.labCheckpoints,
        createdBy: ctx.ownerId,
        isTemplate: true,
      });

      for (let i = 0; i < template.steps.length; i++) {
        const step = template.steps[i];
        await db.createProtocolStep({
          protocolId: result.id,
          title: step.title,
          description: step.description || null,
          frequency: step.frequency,
          customDays: step.customDays || null,
          startDay: step.startDay ?? null,
          endDay: step.endDay ?? null,
          timeOfDay: step.timeOfDay,
          dosageAmount: step.dosageAmount ?? null,
          dosageUnit: step.dosageUnit ?? null,
          route: step.route ?? null,
          sortOrder: i,
        });
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.seedTemplate",
        entityType: "protocol",
        entityId: result.id,
        details: { templateKey: input.templateKey },
      });

      return result;
    }),

  // Protocol steps management
  addStep: adminProcedure
    .input(
      z.object({
        protocolId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed"]),
        startDay: z.number().optional().nullable(),
        endDay: z.number().optional().nullable(),
        timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
        dosageAmount: z.string().optional().nullable(),
        dosageUnit: z.string().optional().nullable(),
        route: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createProtocolStep(input);
    }),

  updateStep: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed"]).optional(),
        startDay: z.number().optional().nullable(),
        endDay: z.number().optional().nullable(),
        timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
        dosageAmount: z.string().optional().nullable(),
        dosageUnit: z.string().optional().nullable(),
        route: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProtocolStep(id, data);
    }),

  deleteStep: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteProtocolStep(input.id);
    }),

  /** Patient creates their own protocol (blank form) */
  patientCreate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Protocol name is required"),
        description: z.string().optional(),
        category: z.enum([
          "nutrition", "supplement", "lifestyle", "lab_work", "exercise",
          "sleep", "stress", "peptides", "hormone", "other",
        ]),
        durationDays: z.number().min(1).optional().nullable(),
        steps: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]),
            customDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
            startDay: z.number().optional().nullable(),
            endDay: z.number().optional().nullable(),
            timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).optional(),
            dosageAmount: z.string().optional().nullable(),
            dosageUnit: z.string().optional().nullable(),
            route: z.string().optional().nullable(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the patient record for this user
      const patient = await resolvePatientForUser(ctx);
      if (!patient) throw new TRPCError({ code: "FORBIDDEN", message: "You must be a registered patient to create protocols" });

      const { steps, ...protocolData } = input;
      const result = await db.createProtocol({
        ...protocolData,
        createdBy: patient.providerId, // Assign to the provider so they can see it
        createdByPatientId: patient.id, // Mark as patient-created
        isTemplate: false, // Patient protocols are not templates
      });

      if (steps && steps.length > 0) {
        for (let i = 0; i < steps.length; i++) {
          await db.createProtocolStep({
            protocolId: result.id,
            sortOrder: i,
            ...steps[i],
          });
        }
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "protocol.patientCreate",
        entityType: "protocol",
        entityId: result.id,
        details: { patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` },
      });

      return result;
    }),

  /** List protocols created by the current patient */
  listMyCreated: protectedProcedure.query(async ({ ctx }) => {
    const patient = await resolvePatientForUser(ctx);
    if (!patient) return [];
    return db.listPatientCreatedProtocols(patient.id);
  }),

  /** List all patient-created protocols (for provider view) */
  listPatientCreated: adminProcedure.query(async ({ ctx }) => {
    const all = await db.listAllPatientCreatedProtocols(ctx.ownerId);
    // Enrich with patient name and step count
    const enriched = await Promise.all(
      all.map(async (p) => {
        const steps = await db.listProtocolSteps(p.id);
        const patient = p.createdByPatientId ? await db.getPatient(p.createdByPatientId) : null;
        return {
          ...p,
          stepCount: steps.length,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
        };
      })
    );
    return enriched;
  }),
});

// ─── ASSIGNMENT ROUTER ────────────────────────

const assignmentRouter = router({
  listForPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      const rows = await db.listAssignmentsForPatient(input.patientId);
      // Enrich each assignment with per-patient assignment steps and completions
      const enriched = await Promise.all(
        rows.map(async (row) => {
          let steps = await db.listAssignmentSteps(row.assignment.id);
          // Fallback: if no assignment steps exist (legacy assignments), load from library
          if (steps.length === 0) {
            steps = (await db.listProtocolSteps(row.protocol.id)).map((s) => ({
              ...s,
              assignmentId: row.assignment.id,
              sourceStepId: s.id,
              updatedAt: s.createdAt ?? new Date(),
            }));
          }
          const completions = await db.listCompletionsForAssignment(row.assignment.id);
          return { ...row, steps, completions };
        })
      );
      return enriched;
    }),

  listActiveForProvider: adminProcedure.query(async ({ ctx }) => {
    return db.listActiveAssignmentsForProvider(ctx.ownerId);
  }),

  create: adminProcedure
    .input(
      z.object({
        patientId: z.number(),
        protocolId: z.number(),
        startDate: z.date(),
        endDate: z.date().optional(),
        providerNotes: z.string().optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.createAssignment({
        ...input,
        assignedBy: ctx.user.id,
        status: "active",
        compliancePercent: 0,
      });
      // Duplicate library steps into per-patient assignment steps
      await db.duplicateStepsToAssignment(input.protocolId, result.id);
      // Update patient status to active and record interaction
      await db.updatePatient(input.patientId, {
        status: "active",
        lastProviderInteraction: new Date(),
      });
      // Notify patient about new protocol assignment
      const assignedPatient = await db.getPatient(input.patientId);
      const protocol = await db.getProtocol(input.protocolId);
      const steps = protocol ? await db.listProtocolSteps(input.protocolId) : [];
      if (assignedPatient?.userId) {
        await db.createNotificationWithEmail(
          {
            userId: assignedPatient.userId,
            title: "New Protocol Assigned",
            body: `You've been assigned the "${protocol?.name || "protocol"}" care plan. Check your Protocols tab to get started.`,
            type: "system",
            relatedEntityType: "assignment",
            relatedEntityId: result.id,
          },
          { sendEmail: true }
        );
      }
      // Send email/SMS to patient about new protocol
      if (assignedPatient) {
        const providerProfile = await db.getProviderProfile(ctx.ownerId);
        const providerName = providerProfile?.practiceName || ctx.user.name || "Your provider";
        const portalUrl = input.origin ? `${input.origin}/patient/protocols` : "https://www.blacklabelmedicine.com/patient/protocols";
        const user = assignedPatient.userId ? await db.getUserById(assignedPatient.userId) : null;
        const { notifyPatientProtocolAssigned } = await import("./patientNotify");
        notifyPatientProtocolAssigned({
          email: user?.email || assignedPatient.email || null,
          phone: assignedPatient.phone || null,
          providerName,
          protocolName: protocol?.name || "New Protocol",
          protocolDescription: protocol?.description || undefined,
          stepCount: steps.length,
          portalUrl,
        }).catch((err) => console.error("[Notify] Protocol assigned notification failed:", err));
      }
      await db.logAudit({
        userId: ctx.user.id,
        action: "assignment.create",
        entityType: "assignment",
        entityId: result.id,
      });
      return result;
    }),

  bulkAssign: adminProcedure
    .input(
      z.object({
        patientIds: z.array(z.number()).min(1),
        protocolId: z.number(),
        startDate: z.date(),
        providerNotes: z.string().optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const protocol = await db.getProtocol(input.protocolId);
      const steps = protocol ? await db.listProtocolSteps(input.protocolId) : [];
      const providerProfile = await db.getProviderProfile(ctx.ownerId);
      const providerName = providerProfile?.practiceName || ctx.user.name || "Your provider";
      const portalUrl = input.origin ? `${input.origin}/patient/protocols` : "https://www.blacklabelmedicine.com/patient/protocols";

      const results = [];
      for (const patientId of input.patientIds) {
        const result = await db.createAssignment({
          patientId,
          protocolId: input.protocolId,
          startDate: input.startDate,
          providerNotes: input.providerNotes,
          assignedBy: ctx.user.id,
          status: "active",
          compliancePercent: 0,
        });
        await db.duplicateStepsToAssignment(input.protocolId, result.id);
        await db.updatePatient(patientId, {
          status: "active",
          lastProviderInteraction: new Date(),
        });
        const patient = await db.getPatient(patientId);
        if (patient?.userId) {
          await db.createNotificationWithEmail(
            {
              userId: patient.userId,
              title: "New Protocol Assigned",
              body: `You've been assigned the "${protocol?.name || "protocol"}" care plan. Check your Protocols tab to get started.`,
              type: "system",
              relatedEntityType: "assignment",
              relatedEntityId: result.id,
            },
            { sendEmail: true }
          );
        }
        if (patient) {
          const user = patient.userId ? await db.getUserById(patient.userId) : null;
          const { notifyPatientProtocolAssigned } = await import("./patientNotify");
          notifyPatientProtocolAssigned({
            email: user?.email || patient.email || null,
            phone: patient.phone || null,
            providerName,
            protocolName: protocol?.name || "New Protocol",
            protocolDescription: protocol?.description || undefined,
            stepCount: steps.length,
            portalUrl,
          }).catch((err) => console.error("[Notify] Bulk assign notification failed:", err));
        }
        await db.logAudit({
          userId: ctx.user.id,
          action: "assignment.bulkCreate",
          entityType: "assignment",
          entityId: result.id,
        });
        results.push(result);
      }
      return { assigned: results.length, protocolName: protocol?.name || "Protocol" };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "completed"]).optional(),
        compliancePercent: z.number().min(0).max(100).optional(),
        providerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateAssignment(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "assignment.update",
        entityType: "assignment",
        entityId: id,
      });
    }),

  /** Full edit of per-patient assignment steps (add, update, remove) */
  updateSteps: adminProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        steps: z.array(
          z.object({
            id: z.number().optional(),
            title: z.string().min(1),
            description: z.string().optional(),
            frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"]).default("daily"),
            customDays: z.array(z.string()).optional(),
            startDay: z.number().optional().nullable(),
            endDay: z.number().optional().nullable(),
            timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),
            dosageAmount: z.string().optional().nullable(),
            dosageUnit: z.string().optional().nullable(),
            route: z.string().optional().nullable(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { assignmentId, steps } = input;
      // Get existing assignment steps
      const existing = await db.listAssignmentSteps(assignmentId);
      const existingIds = new Set(existing.map((e) => e.id));

      // If no assignment_steps exist yet (legacy assignment), treat ALL incoming
      // steps as new — their IDs are library step IDs, not assignment step IDs.
      const isLegacy = existing.length === 0;

      const incomingIds = new Set(
        isLegacy ? [] : steps.filter((s) => s.id).map((s) => s.id!)
      );

      // Delete steps that were removed (only for non-legacy)
      for (const ex of existing) {
        if (!incomingIds.has(ex.id)) {
          await db.deleteAssignmentStep(ex.id);
        }
      }

      // Update existing or create new steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        // Only update if the step ID actually belongs to assignment_steps
        if (step.id && !isLegacy && existingIds.has(step.id)) {
          const { id: stepId, ...stepData } = step;
          await db.updateAssignmentStep(stepId, { ...stepData, sortOrder: i });
        } else {
          await db.createAssignmentStep({
            assignmentId,
            sortOrder: i,
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
        }
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "assignment.updateSteps",
        entityType: "assignment",
        entityId: assignmentId,
      });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteAssignment(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "assignment.remove",
        entityType: "assignment",
        entityId: input.id,
      });
    }),
});

// ─── TASK COMPLETION ROUTER ───────────────────

const taskRouter = router({
  listForAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensureAssignmentAccess(ctx, input.assignmentId);
      return db.listCompletionsForAssignment(input.assignmentId);
    }),

  complete: protectedProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        stepId: z.number(),
        patientId: z.number(),
        taskDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.createTaskCompletion(input);
    }),

  uncomplete: protectedProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        stepId: z.number(),
        taskDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureAssignmentAccess(ctx, input.assignmentId);
      await db.deleteTaskCompletion(input.assignmentId, input.stepId, input.taskDate);
    }),

  /** Bulk-complete all active steps for a given assignment on a given day */
  completeAll: protectedProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        patientId: z.number(),
        taskDate: z.string(),
        stepIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      // Get existing completions for this day to avoid duplicates
      const existing = await db.listCompletionsForAssignment(input.assignmentId);
      const existingSet = new Set(
        existing
          .filter((c) => c.taskDate === input.taskDate)
          .map((c) => c.stepId)
      );
      const toInsert = input.stepIds
        .filter((id) => !existingSet.has(id))
        .map((stepId) => ({
          assignmentId: input.assignmentId,
          stepId,
          patientId: input.patientId,
          taskDate: input.taskDate,
        }));
      if (toInsert.length > 0) {
        await db.bulkCreateTaskCompletions(toInsert);
      }
      return { completed: toInsert.length };
    }),

  /** Get completion history for a patient within a date range (for calendar) */
  completionHistory: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listCompletionsByDateRange(input.patientId, input.startDate, input.endDate);
    }),
});

// ─── MESSAGE ROUTER ───────────────────────────

const messageRouter = router({
  conversations: adminProcedure.query(async ({ ctx }) => {
    return db.listConversationsForProvider(ctx.ownerId);
  }),

  listForPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listMessagesForPatient(input.patientId);
    }),

  send: protectedProcedure
    .input(
      z.object({
        receiverId: z.number(),
        patientId: z.number(),
        content: z.string().min(1),
        messageType: z.enum(["text", "system", "alert"]).optional(),
        origin: z.string().optional(), // frontend passes window.location.origin for email links
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      const result = await db.createMessage({
        senderId: ctx.user.id,
        ...input,
      });
      // Update last provider interaction
      await db.updatePatient(input.patientId, {
        lastProviderInteraction: new Date(),
      });
      // Create notification for receiver (skip if sender is the receiver)
      if (input.receiverId !== ctx.user.id) {
        const isProviderSending = ctx.user.role === "admin" || ctx.user.role === "staff";
        const patient = await db.getPatient(input.patientId);

        // Determine sender name for notification
        let senderName = "Someone";
        if (isProviderSending) {
          const providerProfile = await db.getProviderProfile(ctx.ownerId ?? ctx.user.id);
          senderName = providerProfile
            ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || ctx.user.name || "Your provider"
            : ctx.user.name || "Your provider";
        } else if (patient) {
          senderName = `${patient.firstName} ${patient.lastName}`.trim();
        }

        // Create in-app notification with sender name
        if (patient?.userId) {
          try {
            await db.createNotificationWithEmail(
              {
                userId: isProviderSending ? patient.userId : input.receiverId,
                title: `New Message from ${senderName}`,
                body: `${senderName}: ${input.content.substring(0, 180)}`,
                type: "message",
                relatedEntityType: "message",
                relatedEntityId: result.id,
              },
              { sendEmail: !isProviderSending }
            );
          } catch (e) {
            console.warn("[Message] In-app notification failed:", e);
          }
        }

        // When patient sends to provider, also notify owner with sender name
        if (!isProviderSending) {
          try {
            const { notifyOwner } = await import("./_core/notification");
            await notifyOwner({
              title: `[BLM] New Message from ${senderName}`,
              content: `${senderName} says: "${input.content.substring(0, 180)}"\n\nReply at https://www.blacklabelmedicine.com/provider/messages?patient=${input.patientId}`,
            });
          } catch (e) {
            console.warn("[Message] Owner notification failed:", e);
          }
        }

        // Send email + SMS to patient when provider sends a message
        if (isProviderSending) {
          try {
            if (patient && (patient.email || patient.phone)) {
              const { notifyPatientNewMessage } = await import("./patientNotify");
              await notifyPatientNewMessage({
                email: patient.email,
                phone: patient.phone,
                providerName: senderName,
                messagePreview: input.content,
                portalUrl: `${input.origin || ""}/patient/messages`,
              });
            }
          } catch (e) {
            console.warn("[Message] Patient notification failed:", e);
          }
        }
      }
      return result;
    }),

  markRead: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      await db.markMessagesRead(input.patientId, ctx.user.id);
    }),

  deleteAttachment: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const msg = await db.getMessage(input.messageId);
      if (!msg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }
      // Only the sender can delete their own attachment
      if (msg.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own attachments" });
      }
      // Verify it's actually an attachment message
      const isAttachment = /^📎 \[.*?\]\(.*?\)$/.test(msg.content);
      if (!isAttachment) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This message is not an attachment" });
      }
      await db.deleteMessageContent(input.messageId);
      await db.logAudit({
        userId: ctx.user.id,
        action: "message.deleteAttachment",
        entityType: "message",
        entityId: input.messageId,
      });
      return { success: true };
    }),

  bulkSend: adminProcedure
    .input(
      z.object({
        patientIds: z.array(z.number()).min(1),
        content: z.string().min(1),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const providerProfile = await db.getProviderProfile(ctx.ownerId);
      const senderName = providerProfile
        ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || ctx.user.name || "Your provider"
        : ctx.user.name || "Your provider";

      let sent = 0;
      for (const patientId of input.patientIds) {
        const patient = await db.getPatient(patientId);
        if (!patient) continue;
        const receiverUserId = patient.userId;
        if (!receiverUserId) continue;

        const result = await db.createMessage({
          senderId: ctx.user.id,
          receiverId: receiverUserId,
          patientId,
          content: input.content,
          messageType: "text",
        });
        await db.updatePatient(patientId, {
          lastProviderInteraction: new Date(),
        });
        // In-app notification
        try {
          await db.createNotificationWithEmail(
            {
              userId: receiverUserId,
              title: `New Message from ${senderName}`,
              body: `${senderName}: ${input.content.substring(0, 180)}`,
              type: "message",
              relatedEntityType: "message",
              relatedEntityId: result.id,
            },
            { sendEmail: false }
          );
        } catch (e) {
          console.warn("[BulkMessage] Notification failed for patient", patientId, e);
        }
        // Email/SMS notification
        try {
          if (patient.email || patient.phone) {
            const { notifyPatientNewMessage } = await import("./patientNotify");
            await notifyPatientNewMessage({
              email: patient.email,
              phone: patient.phone,
              providerName: senderName,
              messagePreview: input.content,
              portalUrl: `${input.origin || ""}/patient/messages`,
            });
          }
        } catch (e) {
          console.warn("[BulkMessage] Email/SMS failed for patient", patientId, e);
        }
        await db.logAudit({
          userId: ctx.user.id,
          action: "message.bulkSend",
          entityType: "message",
          entityId: result.id,
        });
        sent++;
      }
      return { sent };
    }),
});

// ─── APPOINTMENT ROUTER ───────────────────────

const appointmentRouter = router({
  listForProvider: adminProcedure.query(async ({ ctx }) => {
    return db.listAppointmentsForProvider(ctx.ownerId);
  }),

  listForPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listAppointmentsForPatient(input.patientId);
    }),

  create: adminProcedure
    .input(
      z.object({
        patientId: z.number(),
        title: z.string().min(1),
        type: z.enum(["initial", "follow_up", "check_in", "lab_work", "urgent"]),
        scheduledAt: z.date(),
        durationMinutes: z.number().min(5).optional(),
        location: z.string().optional(),
        assistantNotes: z.string().optional(),
        patientNotes: z.string().optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.createAppointment({
        ...input,
        providerId: ctx.ownerId,
        createdBy: ctx.user.id,
      });
      // Create notification for patient (in-app + email)
      const patient = await db.getPatient(input.patientId);
      if (patient?.userId) {
        await db.createNotificationWithEmail(
          {
            userId: patient.userId,
            title: "New Appointment Scheduled",
            body: `${input.title} on ${input.scheduledAt.toLocaleDateString()}`,
            type: "appointment_reminder",
            relatedEntityType: "appointment",
            relatedEntityId: result.id,
          },
          { sendEmail: false } // we handle email/SMS below
        );
      }
      // Send email + SMS to patient about the new appointment
      if (patient && (patient.email || patient.phone)) {
        try {
          const { notifyPatientAppointment } = await import("./patientNotify");
          const providerProfile = await db.getProviderProfile(ctx.ownerId);
          const providerName = providerProfile
            ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || "Your provider"
            : "Your provider";
          const dateStr = input.scheduledAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          const timeStr = input.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          const durationMs = (input.durationMinutes || 60) * 60 * 1000;
          const endTime = new Date(input.scheduledAt.getTime() + durationMs);
          const user = patient.userId ? await db.getUserById(patient.userId) : null;
          await notifyPatientAppointment({
            email: user?.email || patient.email,
            phone: patient.phone,
            providerName,
            providerEmail: "notifications@blacklabelmedicine.com",
            patientName: `${patient.firstName} ${patient.lastName}`,
            appointmentDate: dateStr,
            appointmentTime: timeStr,
            appointmentType: input.title,
            appointmentNotes: input.patientNotes || undefined,
            startTime: input.scheduledAt,
            endTime,
            portalUrl: `${input.origin || "https://www.blacklabelmedicine.com"}/patient/schedule`,
          });
        } catch (e) {
          console.warn("[Appointment] Patient notification failed:", e);
        }
      }
      await db.logAudit({
        userId: ctx.user.id,
        action: "appointment.create",
        entityType: "appointment",
        entityId: result.id,
      });

      // Sync to Google Calendar (non-blocking)
      const patientForSync = patient || await db.getPatient(input.patientId);
      const patientName = patientForSync ? `${patientForSync.firstName} ${patientForSync.lastName}` : "Patient";
      syncAppointmentToGoogle(ctx.ownerId, result.id, patientName).catch((e) =>
        console.warn("[GoogleCalendar] Auto-sync on create failed:", e.message)
      );

      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        type: z.enum(["initial", "follow_up", "check_in", "lab_work", "urgent"]).optional(),
        scheduledAt: z.date().optional(),
        durationMinutes: z.number().min(5).optional(),
        location: z.string().optional(),
        assistantNotes: z.string().optional(),
        patientNotes: z.string().optional(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateAppointment(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "appointment.update",
        entityType: "appointment",
        entityId: id,
      });

      // Sync to Google Calendar (non-blocking)
      if (input.status === "cancelled") {
        deleteGoogleEvent(ctx.ownerId, id).catch((e) =>
          console.warn("[GoogleCalendar] Auto-delete on cancel failed:", e.message)
        );
      } else {
        const apt = await db.getAppointmentById(id);
        if (apt) {
          const patient = await db.getPatient(apt.patientId);
          const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";
          syncAppointmentToGoogle(ctx.ownerId, id, patientName).catch((e) =>
            console.warn("[GoogleCalendar] Auto-sync on update failed:", e.message)
          );
        }
      }
    }),

  syncAllToGoogle: adminProcedure.mutation(async ({ ctx }) => {
    return syncAllAppointments(ctx.ownerId, ctx.ownerId);
  }),
});

// ─── NOTIFICATION ROUTER ──────────────────────

const notificationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.listNotificationsForUser(ctx.user.id);
  }),

  listPaginated: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional(),
        offset: z.number().min(0).optional(),
        type: z.enum([
          "message", "task_overdue", "task_reminder", "appointment_reminder",
          "compliance_alert", "subscription_expiring", "milestone_reached", "system",
        ]).optional(),
        unreadOnly: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return db.listNotificationsForUserPaginated(ctx.user.id, input ?? {});
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadNotificationCount(ctx.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "notification.markRead",
        entityType: "notification",
        entityId: input.id,
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    await db.logAudit({
      userId: ctx.user.id,
      action: "notification.markAllRead",
      entityType: "notification",
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteNotification(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "notification.delete",
        entityType: "notification",
        entityId: input.id,
      });
    }),

  /** Resolve a notification's deep-link URL based on relatedEntityType/Id */
  resolveUrl: protectedProcedure
    .input(z.object({
      relatedEntityType: z.string().nullable().optional(),
      relatedEntityId: z.number().nullable().optional(),
      type: z.string(),
    }))
    .query(async ({ input }) => {
      const { relatedEntityType, relatedEntityId, type } = input;
      if (!relatedEntityType || !relatedEntityId) return null;

      switch (relatedEntityType) {
        case "message": {
          // relatedEntityId is the message ID — look up the patientId
          const dbInstance = await db.getDb();
          if (!dbInstance) return null;
          const [msg] = await dbInstance.select({ patientId: messages.patientId })
            .from(messages)
            .where(eq(messages.id, relatedEntityId))
            .limit(1);
          return msg ? `/provider/messages?patient=${msg.patientId}` : "/provider/messages";
        }
        case "appointment":
          return "/provider/schedule";
        case "assignment":
          return "/patient/protocols";
        case "clientTask":
          return "/patient/protocols";
        default:
          // Fallback based on notification type
          if (type === "message") return "/provider/messages";
          if (type === "appointment_reminder") return "/provider/schedule";
          if (type === "task_reminder" || type === "task_overdue") return "/provider/clients";
          if (type === "compliance_alert") return "/provider/attention";
          return null;
      }
    }),

  /** Manually create a notification (admin/provider use) */
  create: adminProcedure
    .input(
      z.object({
        targetUserId: z.number(),
        title: z.string().min(1),
        body: z.string().optional(),
        type: z.enum([
          "message", "task_overdue", "task_reminder", "appointment_reminder",
          "compliance_alert", "subscription_expiring", "milestone_reached", "system",
        ]),
        relatedEntityType: z.string().optional(),
        relatedEntityId: z.number().optional(),
        sendEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { targetUserId, sendEmail, ...notifData } = input;
      const result = await db.createNotificationWithEmail(
        { ...notifData, userId: targetUserId },
        { sendEmail: sendEmail ?? false }
      );
      await db.logAudit({
        userId: ctx.user.id,
        action: "notification.create",
        entityType: "notification",
        entityId: result.id,
      });
      return result;
    }),
});

// ─── DOCUMENT ROUTER ─────────────────────

const documentRouter = router({
  listForPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listDocumentsForPatient(input.patientId);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await db.deleteDocument(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "document.delete",
        entityType: "document",
        entityId: input.id,
        details: doc ? { fileName: doc.fileName } : undefined,
      });
      return { success: true };
    }),

  /** Patient can delete their own uploaded documents */
  deleteOwn: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the document exists
      const doc = await db.getDocument(input.id);
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }
      // Verify the patient owns this document
      const patient = await resolvePatientForUser(ctx);
      if (!patient || doc.patientId !== patient.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own documents" });
      }
      // Verify the patient uploaded it (not the provider)
      if (doc.uploadedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete documents you uploaded" });
      }
      const deleted = await db.deleteDocument(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "document.deleteOwn",
        entityType: "document",
        entityId: input.id,
        details: deleted ? { fileName: deleted.fileName } : undefined,
      });
      return { success: true };
    }),
});

// ─── CLIENT NOTES ROUTER ─────────────────

const clientNoteRouter = router({
  list: adminProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      return db.listNotesForPatient(input.patientId);
    }),

  create: adminProcedure
    .input(
      z.object({
        patientId: z.number(),
        content: z.string().min(1),
        category: z.enum(["general", "clinical", "follow_up", "phone_call", "lab_review", "other"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.createClientNote({
        patientId: input.patientId,
        authorId: ctx.user.id,
        content: input.content,
        category: input.category,
      });
      // Update last provider interaction
      await db.updatePatient(input.patientId, {
        lastProviderInteraction: new Date(),
      });
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientNote.create",
        entityType: "clientNote",
        entityId: result.id,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(1).optional(),
        category: z.enum(["general", "clinical", "follow_up", "phone_call", "lab_review", "other"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateClientNote(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientNote.update",
        entityType: "clientNote",
        entityId: id,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteClientNote(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientNote.delete",
        entityType: "clientNote",
        entityId: input.id,
      });
      return { success: true };
    }),
});

// ─── CLIENT TASKS ROUTER ─────────────────

const clientTaskRouter = router({
  list: adminProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      return db.listTasksForPatient(input.patientId);
    }),

  create: adminProcedure
    .input(
      z.object({
        patientId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.createClientTask({
        patientId: input.patientId,
        assignedBy: ctx.user.id,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
      });
      // Notify patient about new task
      const patient = await db.getPatient(input.patientId);
      if (patient?.userId) {
        await db.createNotificationWithEmail(
          {
            userId: patient.userId,
            title: "New Task Assigned",
            body: `You have a new task: "${input.title}"${input.dueDate ? ` due ${input.dueDate.toLocaleDateString()}` : ""}`,
            type: "task_reminder",
            relatedEntityType: "clientTask",
            relatedEntityId: result.id,
          },
          { sendEmail: false }
        );
      }
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientTask.create",
        entityType: "clientTask",
        entityId: result.id,
      });
      return result;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // If completing the task, set completedAt
      if (data.status === "completed") {
        (data as any).completedAt = new Date();
      }
      await db.updateClientTask(id, data);
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientTask.update",
        entityType: "clientTask",
        entityId: id,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteClientTask(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "clientTask.delete",
        entityType: "clientTask",
        entityId: input.id,
      });
      return { success: true };
    }),
});

// ─── ATTENTION QUEUE ROUTER ───────────────────

const attentionRouter = router({
  queue: adminProcedure.query(async ({ ctx }) => {
    return db.getAttentionQueue(ctx.ownerId);
  }),

  stats: adminProcedure.query(async ({ ctx }) => {
    return db.getProviderStats(ctx.ownerId);
  }),

  /** Get all dismissed/resolved item keys for the current user */
  dismissedItems: adminProcedure.query(async ({ ctx }) => {
    return db.getDismissedAttentionItems(ctx.ownerId);
  }),

  /** Dismiss an attention queue item (persists for 7 days) */
  dismiss: adminProcedure
    .input(z.object({ itemKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.dismissAttentionItem(ctx.ownerId, input.itemKey, "dismissed");
      return { success: true };
    }),

  /** Resolve an attention queue item (persists for 7 days) */
  resolve: adminProcedure
    .input(z.object({ itemKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.dismissAttentionItem(ctx.ownerId, input.itemKey, "resolved");
      return { success: true };
    }),

  /** Restore a single dismissed/resolved item */
  restore: adminProcedure
    .input(z.object({ itemKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.restoreAttentionItem(ctx.ownerId, input.itemKey);
      return { success: true };
    }),

  /** Restore all dismissed/resolved items */
  restoreAll: adminProcedure.mutation(async ({ ctx }) => {
    await db.restoreAllAttentionItems(ctx.ownerId);
    return { success: true };
  }),
});

// ─── GOOGLE CALENDAR ROUTER ───────────────

const googleCalendarRouter = router({
  status: adminProcedure.query(async ({ ctx }) => {
    return getConnectionStatus(ctx.ownerId);
  }),

  getAuthUrl: adminProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const redirectUri = `${input.origin}/api/google/callback`;
      const url = getGoogleAuthUrl(redirectUri, ctx.ownerId);
      return { url };
    }),

  disconnect: adminProcedure.mutation(async ({ ctx }) => {
    await disconnectGoogle(ctx.ownerId);
    return { success: true };
  }),
});

// ─── AI ADVISOR ROUTER ──────────────────────

const aiRouter = router({
  /** Provider Clinical Advisor — chat with context about patients, protocols, labs */
  providerChat: adminProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.union([
              z.string(),
              z.array(z.union([
                z.object({ type: z.literal("text"), text: z.string() }),
                z.object({ type: z.literal("image_url"), image_url: z.object({ url: z.string(), detail: z.enum(["auto", "low", "high"]).optional() }) }),
                z.object({ type: z.literal("file_url"), file_url: z.object({ url: z.string(), mime_type: z.string().optional() }) }),
              ])),
            ]),
          })
        ),
        /** Optional patient context to include */
        patientId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");

      // Build context about the provider's practice
      let contextInfo = "";

      // If a specific patient is referenced, include their data
      if (input.patientId) {
        const patient = await db.getPatient(input.patientId);
        if (patient) {
          const assignments = await db.listAssignmentsForPatient(patient.id);
          const notes = await db.listNotesForPatient(patient.id);
          contextInfo += `\n\nPatient Context:\n- Name: ${patient.firstName} ${patient.lastName}\n- Status: ${patient.status}\n- Tier: ${patient.subscriptionTier}\n- Health Goals: ${(patient.healthGoals || []).join(", ") || "None listed"}\n- Conditions: ${(patient.conditions || []).join(", ") || "None listed"}\n- Active Protocols: ${assignments.filter((a: any) => a.assignment.status === "active").length}\n- Recent Notes: ${notes.slice(0, 3).map((n: { content: string }) => n.content.substring(0, 100)).join("; ") || "None"}`;
        }
      }

      // Get practice-level stats
      const stats = await db.getProviderStats(ctx.ownerId);
      contextInfo += `\n\nPractice Overview:\n- Total Patients: ${stats.totalPatients}\n- Active Patients: ${stats.activePatients}\n- Upcoming Appointments: ${stats.upcomingAppointments}`;

      const systemPrompt = `You are an AI Clinical Advisor for Dr. Jacob Egbert's concierge medicine practice, Black Label Medicine. You specialize in functional and integrative medicine, optimization protocols, and personalized health strategies.

Your role:
- Help interpret lab results and biomarkers in the context of optimization medicine
- Suggest protocol adjustments based on patient progress and symptoms
- Draft clinical notes and progress summaries
- Recommend evidence-based supplement stacks and lifestyle interventions
- Provide differential considerations for complex cases
- Help with treatment planning and protocol design

Important guidelines:
- Always note that your suggestions require clinical review and are not direct medical advice
- Reference current evidence-based practices in functional medicine
- Consider the whole patient — lifestyle, stress, sleep, nutrition, hormones, gut health
- Be concise but thorough; use clinical terminology appropriately
- Format responses with clear headings and bullet points when appropriate
${contextInfo}`;

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.filter(m => m.role !== "system"),
      ];

      const result = await invokeLLM({ messages: llmMessages });
      const content = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : "I apologize, but I was unable to generate a response. Please try again.";

      return { content };
    }),

  /** Patient Wellness Assistant — friendly, patient-facing AI */
  patientChat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.union([
              z.string(),
              z.array(z.union([
                z.object({ type: z.literal("text"), text: z.string() }),
                z.object({ type: z.literal("image_url"), image_url: z.object({ url: z.string(), detail: z.enum(["auto", "low", "high"]).optional() }) }),
                z.object({ type: z.literal("file_url"), file_url: z.object({ url: z.string(), mime_type: z.string().optional() }) }),
              ])),
            ]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");

      // Get patient context
      let patientContext = "";
      const patient = await resolvePatientForUser(ctx);
      if (patient) {
        const assignments = await db.listAssignmentsForPatient(patient.id);
        patientContext = `\n\nPatient Info:\n- Name: ${patient.firstName}\n- Health Goals: ${(patient.healthGoals || []).join(", ") || "General wellness"}\n- Active Protocols: ${assignments.filter((a: any) => a.assignment.status === "active").length}\n- Conditions: ${(patient.conditions || []).join(", ") || "None listed"}`;
      }

      const systemPrompt = `You are a friendly Wellness Assistant for Black Label Medicine, a concierge health optimization practice led by Dr. Jacob Egbert. You help patients understand their health journey.

Your role:
- Explain protocols and supplement recommendations in plain language
- Help patients understand their lab results and what they mean
- Provide general wellness tips aligned with functional medicine principles
- Encourage patients to follow their prescribed protocols consistently
- Answer questions about nutrition, sleep, exercise, and stress management
- Help patients prepare questions for their next appointment with Dr. Egbert

Important guidelines:
- Always be warm, encouraging, and supportive
- Use simple, accessible language — avoid excessive medical jargon
- Never contradict or override Dr. Egbert's prescribed protocols
- For specific medical concerns, always recommend contacting Dr. Egbert directly
- Remind patients that you're an AI assistant, not a replacement for their provider
- Be concise and practical in your advice
${patientContext}`;

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.filter(m => m.role !== "system"),
      ];

      const result = await invokeLLM({ messages: llmMessages });
      const content = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : "I apologize, but I was unable to generate a response. Please try again.";

      return { content };
    }),
});

// ─── INVITE ROUTER ──────────────────────────────

const inviteRouter = router({
  /** Generate an invite link for a patient (provider only) */
  generate: adminProcedure
    .input(z.object({
      patientId: z.number(),
      origin: z.string(), // frontend passes window.location.origin
      sendEmail: z.boolean().optional(), // whether to email the invite to the patient
    }))
    .mutation(async ({ ctx, input }) => {
      // Check patient exists and belongs to this provider
      const patient = await db.getPatient(input.patientId);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });

      // Check if there's already an active invite
      const existing = await db.getActiveInviteForPatient(input.patientId);
      if (existing) {
        const inviteUrl = `${input.origin}/invite?token=${existing.token}`;
        let emailSent = false;
        let smsSent = false;
        if (input.sendEmail && patient.email) {
          try {
            const { notifyPatientInvite } = await import("./patientNotify");
            const providerProfile = await db.getProviderProfile(ctx.ownerId);
            const providerName = providerProfile
              ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || "Your provider"
              : "Your provider";
            const result = await notifyPatientInvite({
              email: patient.email,
              phone: patient.phone,
              providerName,
              inviteUrl,
            });
            emailSent = result.emailSent;
            smsSent = result.smsSent;
          } catch (e) {
            console.warn("[Invite] Notification failed for existing invite:", e);
          }
        }
        return { token: existing.token, inviteUrl, expiresAt: existing.expiresAt, existing: true, emailSent, smsSent };
      }

      // Generate a new invite token
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.createInvite({
        token,
        patientId: input.patientId,
        createdByUserId: ctx.user.id,
        expiresAt,
      });

      await db.logAudit({
        userId: ctx.user.id,
        action: "invite.generate",
        entityType: "patient",
        entityId: input.patientId,
      });

      const inviteUrl = `${input.origin}/invite?token=${token}`;

      // Send email + SMS notification to patient if requested
      let emailSent = false;
      let smsSent = false;
      if (input.sendEmail && patient.email) {
        try {
          const { notifyPatientInvite } = await import("./patientNotify");
          const providerProfile = await db.getProviderProfile(ctx.ownerId);
          const providerName = providerProfile
            ? `${providerProfile.firstName ?? ""} ${providerProfile.lastName ?? ""}`.trim() || "Your provider"
            : "Your provider";
          const result = await notifyPatientInvite({
            email: patient.email,
            phone: patient.phone,
            providerName,
            inviteUrl,
          });
          emailSent = result.emailSent;
          smsSent = result.smsSent;
        } catch (e) {
          console.warn("[Invite] Notification failed:", e);
        }
      }

      return { token, inviteUrl, expiresAt, existing: false, emailSent, smsSent };
    }),

  /** Verify an invite token (public — used by the invite landing page) */
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invite = await db.getInviteByToken(input.token);
      if (!invite) return { valid: false as const, reason: "Invite not found" };
      if (invite.usedAt) return { valid: false as const, reason: "This invite has already been used" };
      if (new Date(invite.expiresAt) < new Date()) return { valid: false as const, reason: "This invite has expired" };

      // Get patient info (just first name for the welcome message)
      const patient = await db.getPatient(invite.patientId);
      return {
        valid: true as const,
        patientFirstName: patient?.firstName || "there",
        patientId: invite.patientId,
      };
    }),

  /** Accept an invite — links the current user to the patient record */
  accept: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent admin/provider/staff from accidentally claiming a patient invite
      if (ctx.user.role === "admin" || ctx.user.role === "staff") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Provider/staff accounts cannot accept patient invites. Please use a separate patient account." });
      }

      const invite = await db.getInviteByToken(input.token);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been used" });
      if (new Date(invite.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired" });

      // Check if this user is already linked to a patient
      const existingPatient = await db.getPatientByUserId(ctx.user.id);
      if (existingPatient) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your account is already linked to a patient record" });
      }

      // Link the patient record to this user
      await db.linkPatientToUser(invite.patientId, ctx.user.id);

      // Mark the invite as used
      await db.markInviteUsed(input.token, ctx.user.id);

      await db.logAudit({
        userId: ctx.user.id,
        action: "invite.accept",
        entityType: "patient",
        entityId: invite.patientId,
      });

      return { success: true, patientId: invite.patientId };
    }),

  /** List invites for a patient (provider view) */
  listForPatient: adminProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      return db.listInvitesForPatient(input.patientId);
    }),
});

// ─── BIOMARKER ROUTER ─────────────────────────

const biomarkerRouter = router({
  // List all entries for a patient, optionally filtered by metric
  listEntries: protectedProcedure
    .input(z.object({ patientId: z.number(), metricName: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listBiomarkerEntries(input.patientId, input.metricName);
    }),

  // Add a new biomarker entry
  addEntry: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        metricName: z.string().min(1),
        value: z.string().min(1),
        unit: z.string().min(1),
        measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.createBiomarkerEntry(input);
    }),

  // Update a biomarker entry
  updateEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        patientId: z.number(),
        value: z.string().min(1).optional(),
        unit: z.string().min(1).optional(),
        measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        note: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      const { id, patientId, ...data } = input;
      await db.updateBiomarkerEntry(id, data);
      return { success: true };
    }),

  // Delete a biomarker entry
  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number(), patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      await db.deleteBiomarkerEntry(input.id);
      return { success: true };
    }),

  // List custom metrics for a patient
  listCustomMetrics: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listCustomMetrics(input.patientId);
    }),

  // Add a custom metric
  addCustomMetric: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        name: z.string().min(1),
        unit: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.createCustomMetric(input);
    }),

  // Delete a custom metric (and its entries)
  deleteCustomMetric: protectedProcedure
    .input(z.object({ id: z.number(), patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      await db.deleteCustomMetric(input.id);
      return { success: true };
    }),
});

// ─── RESOURCE ROUTER ─────────────────────────

const resourceRouter = router({
  // Create a new resource (file, link, or article)
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["file", "link", "article"]),
        category: z.enum([
          "nutrition", "exercise", "supplement", "lifestyle",
          "hormone", "lab_education", "recovery", "mental_health", "general",
        ]).default("general"),
        fileKey: z.string().optional(),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        externalUrl: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createResource({ ...input, createdBy: ctx.ownerId });
    }),

  // Update a resource
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        category: z.enum([
          "nutrition", "exercise", "supplement", "lifestyle",
          "hormone", "lab_education", "recovery", "mental_health", "general",
        ]).optional(),
        externalUrl: z.string().optional().nullable(),
        content: z.string().optional().nullable(),
        tags: z.array(z.string()).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateResource(id, data);
      return { success: true };
    }),

  // Delete a resource
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteResource(input.id);
      return { success: true };
    }),

  // Archive a resource
  archive: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.archiveResource(input.id);
      return { success: true };
    }),

  // List all resources (provider view)
  list: adminProcedure.query(async () => {
    return db.listResources();
  }),

  // Get a single resource by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getResourceById(input.id);
    }),

  // Share a resource with patients
  share: adminProcedure
    .input(
      z.object({
        resourceId: z.number(),
        patientIds: z.array(z.number()).min(1),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];
      for (const patientId of input.patientIds) {
        const share = await db.shareResource({
          resourceId: input.resourceId,
          patientId,
          sharedBy: ctx.ownerId,
          message: input.message,
        });
        results.push(share);
      }
      return results;
    }),

  // Unshare a resource from a patient
  unshare: adminProcedure
    .input(z.object({ resourceId: z.number(), patientId: z.number() }))
    .mutation(async ({ input }) => {
      await db.unshareResource(input.resourceId, input.patientId);
      return { success: true };
    }),

  // List shares for a specific resource (provider view)
  listShares: adminProcedure
    .input(z.object({ resourceId: z.number() }))
    .query(async ({ input }) => {
      return db.listSharesForResource(input.resourceId);
    }),

  // List resources shared with a patient (patient view)
  listForPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.listResourcesForPatient(input.patientId);
    }),

  // Mark a resource as viewed by patient
  markViewed: protectedProcedure
    .input(z.object({ shareId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markResourceViewed(input.shareId);
      return { success: true };
    }),
});

// ─── MAIN APP ROUTER ──────────────────────────

const backupRouter = router({
  create: adminProcedure.mutation(async () => {
    const result = await createDatabaseBackup();
    await addToManifest(result);
    return result;
  }),

  list: adminProcedure.query(async () => {
    return listBackups();
  }),

  download: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const url = await getBackupDownloadUrl(input.key);
      return { url };
    }),

  /** Restore the database from a backup stored in S3.
   *  Automatically creates a safety backup before restoring. */
  restore: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Create a safety backup first
      const safetyBackup = await createDatabaseBackup();
      await addToManifest({ ...safetyBackup, key: safetyBackup.key.replace("db-backup-", "pre-restore-safety-") });

      // 2. Restore from the selected backup
      const result = await restoreDatabaseBackup(input.key);

      // 3. Log the restore action
      await db.logAudit({
        userId: ctx.user.id,
        action: "backup.restore",
        entityType: "backup",
        details: {
          restoredFrom: input.key,
          safetyBackupKey: safetyBackup.key,
          tablesRestored: result.tablesRestored,
          totalRowsRestored: result.totalRowsRestored,
          errors: result.errors,
        },
      });

      return {
        ...result,
        safetyBackupKey: safetyBackup.key,
      };
    }),
});

// ─── STAFF INVITE ROUTER ─────────────────────────

const staffRouter = router({
  /** Send a staff invite (owner only) */
  invite: ownerProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email is required"),
      origin: z.string(), // frontend passes window.location.origin
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate a unique invite token
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const invite = await db.createStaffInvite({
        token,
        createdByUserId: ctx.user.id,
        name: input.name,
        email: input.email,
        expiresAt,
      });

      const inviteUrl = `${input.origin}/staff-invite?token=${token}`;

      // Send invite email
      let emailSent = false;
      try {
        const { sendEmail } = await import("./email");
        emailSent = await sendEmail({
          to: input.email,
          subject: "You've been invited to join the provider portal",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px;">
              <h1 style="color: #3C3228; font-size: 24px; font-weight: 400;">You're Invited</h1>
              <p style="color: #5C5248; line-height: 1.6;">Hi ${input.name},</p>
              <p style="color: #5C5248; line-height: 1.6;">You've been invited to join the Black Label Medicine provider portal as a staff member. You'll have access to manage clients, protocols, scheduling, and more.</p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${inviteUrl}" style="display: inline-block; background: #B8926A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="color: #8C8278; font-size: 13px;">This invitation expires in 30 days.</p>
            </div>
          `,
        });
      } catch (e) {
        console.warn("[StaffInvite] Email failed:", e);
      }

      await db.logAudit({
        userId: ctx.user.id,
        action: "staff.invite",
        entityType: "staffInvite",
        entityId: invite.id,
        details: { email: input.email, name: input.name },
      });

      return { token, inviteUrl, expiresAt, emailSent };
    }),

  /** Verify a staff invite token (public — used by the landing page) */
  verifyInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invite = await db.getStaffInviteByToken(input.token);
      if (!invite) return { valid: false as const, reason: "Invite not found" };
      if (invite.revokedAt) return { valid: false as const, reason: "This invite has been revoked" };
      if (invite.usedAt) return { valid: false as const, reason: "This invite has already been used" };
      if (new Date(invite.expiresAt) < new Date()) return { valid: false as const, reason: "This invite has expired" };
      return { valid: true as const, name: invite.name, email: invite.email };
    }),

  /** Accept a staff invite — promotes the current user to staff role */
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await db.getStaffInviteByToken(input.token);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.revokedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has been revoked" });
      if (invite.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been used" });
      if (new Date(invite.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired" });

      // Promote user to staff
      await db.promoteToStaff(ctx.user.id);

      // Mark invite as used
      await db.markStaffInviteUsed(input.token, ctx.user.id);

      await db.logAudit({
        userId: ctx.user.id,
        action: "staff.accept",
        entityType: "staffInvite",
        entityId: invite.id,
      });

      return { success: true };
    }),

  /** List all staff invites (owner only) */
  listInvites: ownerProcedure.query(async ({ ctx }) => {
    return db.listStaffInvites(ctx.user.id);
  }),

  /** Revoke a staff invite (owner only) */
  revokeInvite: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.revokeStaffInvite(input.id);
      await db.logAudit({
        userId: ctx.user.id,
        action: "staff.revokeInvite",
        entityType: "staffInvite",
        entityId: input.id,
      });
      return { success: true };
    }),

  /** List all active staff members (owner only) */
  listMembers: ownerProcedure.query(async () => {
    return db.listStaffMembers();
  }),

  /** Remove a staff member (demote to user) (owner only) */
  removeMember: ownerProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeStaffMember(input.userId);
      await db.logAudit({
        userId: ctx.user.id,
        action: "staff.remove",
        entityType: "user",
        entityId: input.userId,
      });
      return { success: true };
    }),
});

// ─── INTAKE FORM ROUTER ─────────────────

const intakeRouter = router({
  /** Get intake form for a patient (both provider and patient can access their own) */
  get: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      await ensurePatientAccess(ctx, input.patientId);
      return db.getIntakeForm(input.patientId);
    }),

  /** Get my own intake form (patient-facing) */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const patient = await resolvePatientForUser(ctx);
    if (!patient) return null;
    return db.getIntakeForm(patient.id);
  }),

  /** Save a section of the intake form (patient-facing, auto-save) */
  saveSection: protectedProcedure
    .input(
      z.object({
        sectionKey: z.string(),
        sectionData: z.any(),
        currentSection: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await resolvePatientForUser(ctx);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "No patient record found" });

      const existing = await db.getIntakeForm(patient.id);
      const currentFormData = (existing?.formData as Record<string, unknown>) || {};
      const currentCompleted = (existing?.completedSections as string[]) || [];

      // Merge the section data
      const updatedFormData = {
        ...currentFormData,
        [input.sectionKey]: input.sectionData,
      };

      // Add to completed sections if not already there
      const updatedCompleted = currentCompleted.includes(input.sectionKey)
        ? currentCompleted
        : [...currentCompleted, input.sectionKey];

      await db.upsertIntakeForm(patient.id, {
        formData: updatedFormData as any,
        completedSections: updatedCompleted,
        currentSection: input.currentSection ?? (existing?.currentSection || 0),
        status: "in_progress",
      });

      await db.logAudit({
        userId: ctx.user.id,
        action: "intake.saveSection",
        entityType: "intake_form",
        entityId: existing?.id ?? 0,
        details: { sectionKey: input.sectionKey },
      });

      return { success: true };
    }),

  /** Submit the completed intake form (patient-facing) */
  submit: protectedProcedure.mutation(async ({ ctx }) => {
    const patient = await resolvePatientForUser(ctx);
    if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "No patient record found" });

    await db.upsertIntakeForm(patient.id, {
      status: "completed",
      submittedAt: new Date(),
    });

    await db.logAudit({
      userId: ctx.user.id,
      action: "intake.submit",
      entityType: "intake_form",
    });

    // Notify the provider that a patient submitted their intake form
    try {
      await notifyOwner({
        title: `Intake Form Submitted — ${patient.firstName} ${patient.lastName}`,
        content: `${patient.firstName} ${patient.lastName} has completed and submitted their comprehensive health intake form. Review it in their client profile under the Intake tab.`,
      });
    } catch (err) {
      console.warn("[Intake] Failed to send owner notification:", err);
    }

    return { success: true };
  }),

  /** Mark intake as reviewed by provider */
  markReviewed: adminProcedure
    .input(
      z.object({
        patientId: z.number(),
        providerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.markIntakeReviewed(input.patientId, input.providerNotes);
      await db.logAudit({
        userId: ctx.user.id,
        action: "intake.reviewed",
        entityType: "intake_form",
        details: { patientId: input.patientId },
      });
      return { success: true };
    }),

  /** Generate PDF of all intake form data (provider only) */
  generatePdf: adminProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const patient = await db.getPatient(input.patientId);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });

      const intakeForm = await db.getIntakeForm(input.patientId);
      if (!intakeForm) throw new TRPCError({ code: "NOT_FOUND", message: "No intake form found for this patient" });

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const formData = (intakeForm.formData ?? {}) as import("../shared/intakeFormSchema").IntakeFormData;
      const completedSections = (intakeForm.completedSections ?? []) as string[];

      const pdfBuffer = generateIntakePdf(
        patientName,
        patient.dateOfBirth ?? null,
        patient.email ?? null,
        formData,
        completedSections,
        intakeForm.submittedAt ? new Date(intakeForm.submittedAt) : null,
        (intakeForm as any).providerNotes ?? null
      );

      await db.logAudit({
        userId: ctx.user.id,
        action: "intake.generatePdf",
        entityType: "intake_form",
        details: { patientId: input.patientId },
      });

      // Return base64-encoded PDF
      return {
        base64: pdfBuffer.toString("base64"),
        filename: `${patientName.replace(/\s+/g, "_")}_Intake_Form.pdf`,
      };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    /** Diagnostic endpoint — shows what the server sees for the current session */
    debug: protectedProcedure.query(async ({ ctx }) => {
      const ownerEmail = process.env.OWNER_EMAIL ?? "(not set)";
      let resolvedOwnerId: number | null = null;
      let ownerLookupResult: string = "";
      let patientCount: number = 0;
      try {
        const owner = await db.getUserByEmail(ownerEmail);
        if (owner) {
          resolvedOwnerId = owner.id;
          ownerLookupResult = `Found: id=${owner.id}, name=${owner.name}, role=${owner.role}`;
          const patients = await db.listPatients(owner.id);
          patientCount = patients.length;
        } else {
          ownerLookupResult = `NOT FOUND for email: ${ownerEmail}`;
        }
      } catch (err: any) {
        ownerLookupResult = `ERROR: ${err.message}`;
      }
      return {
        currentUser: {
          id: ctx.user.id,
          name: ctx.user.name,
          email: ctx.user.email,
          role: ctx.user.role,
          openId: ctx.user.openId,
        },
        ownerEmail,
        ownerLookup: ownerLookupResult,
        resolvedOwnerId,
        patientCount,
        adminCheckWouldPass: ctx.user.role === "admin" || ctx.user.role === "staff",
      };
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        // Verify password using SHA-256 HMAC stored hash (bcrypt-free, no native deps)
        const inputHash = createHash("sha256").update(input.password).digest("hex");
        const storedHash = Buffer.from(user.passwordHash, "hex");
        const inputHashBuf = Buffer.from(inputHash, "hex");
        const match = storedHash.length === inputHashBuf.length &&
          timingSafeEqual(storedHash, inputHashBuf);
        if (!match) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  patient: patientRouter,
  protocol: protocolRouter,
  assignment: assignmentRouter,
  task: taskRouter,
  message: messageRouter,
  appointment: appointmentRouter,
  notification: notificationRouter,
  attention: attentionRouter,
  document: documentRouter,
  clientNote: clientNoteRouter,
  clientTask: clientTaskRouter,
  googleCalendar: googleCalendarRouter,
  ai: aiRouter,
  invite: inviteRouter,
  providerProfile: providerProfileRouter,
  biomarker: biomarkerRouter,
  resource: resourceRouter,
  backup: backupRouter,
  staff: staffRouter,
  intake: intakeRouter,
});

export type AppRouter = typeof appRouter;
