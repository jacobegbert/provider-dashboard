import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { publicProcedure, protectedProcedure, router, staffProcedure } from "./_core/trpc";
import { getService, getStore } from "./portal/store";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { User } from "../drizzle/schema";

const SESSION_MS = 1000 * 60 * 60 * 12;

const failures = new Map<string, { count: number; resetAt: number }>();

function assertLoginAllowed(email: string) {
  const row = failures.get(email);
  if (row && row.resetAt > Date.now() && row.count >= 8) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many sign-in attempts. Wait a few minutes and try again.",
    });
  }
}

function recordFailure(email: string) {
  const now = Date.now();
  const row = failures.get(email);
  if (!row || row.resetAt < now) {
    failures.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return;
  }
  row.count += 1;
}

function clearFailures(email: string) {
  failures.delete(email);
}

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

const emailSchema = z
  .string()
  .trim()
  .max(320)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email");

const itemShape = {
  kind: z.enum(["medication", "peptide", "regenerative", "note"]),
  name: z.string().trim().min(1).max(256),
  dose: z.string().trim().max(64).nullable().optional(),
  unit: z.string().trim().max(32).nullable().optional(),
  route: z.string().trim().max(64).nullable().optional(),
  frequency: z.string().trim().max(128).nullable().optional(),
  instructions: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["active", "paused", "clinic_managed", "completed"]),
  isSampleTemplate: z.boolean().optional(),
};

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null;
      return {
        ...publicUser(ctx.user),
        demoMode: getStore().mode === "memory",
        storage: getStore().mode,
      };
    }),
    login: publicProcedure
      .input(z.object({ email: emailSchema, password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.toLowerCase();
        assertLoginAllowed(email);
        try {
          const user = await getService().authenticate(email, input.password);
          clearFailures(email);
          const token = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
            expiresInMs: SESSION_MS,
          });
          ctx.res.cookie(COOKIE_NAME, token, {
            ...getSessionCookieOptions(ctx.req),
            maxAge: SESSION_MS,
          });
          await getStore().upsertUser({ openId: user.openId, lastSignedIn: new Date() });
          return { user: publicUser(user) };
        } catch (error) {
          if (error instanceof TRPCError && error.code === "UNAUTHORIZED") recordFailure(email);
          throw error;
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: 0 });
      return { ok: true };
    }),
  }),

  portal: router({
    patient: router({
      home: protectedProcedure.query(({ ctx }) => getService().patientHome(ctx.user)),
      labs: protectedProcedure.query(({ ctx }) => getService().patientLabs(ctx.user)),
      messages: protectedProcedure.query(({ ctx }) => getService().patientThread(ctx.user)),
      sendMessage: protectedProcedure
        .input(z.object({ content: z.string().trim().min(1).max(4000) }))
        .mutation(({ ctx, input }) => getService().patientSend(ctx.user, input.content)),
      intake: protectedProcedure.query(({ ctx }) => getService().patientIntake(ctx.user)),
      saveIntake: protectedProcedure
        .input(z.object({
          goals: z.string().max(4000),
          currentMedications: z.string().max(4000),
          conditions: z.string().max(4000),
          submit: z.boolean(),
        }))
        .mutation(({ ctx, input }) => getService().patientSaveIntake(ctx.user, input)),
    }),
    clinic: router({
      roster: staffProcedure.query(({ ctx }) => getService().roster(ctx.user)),
      chart: staffProcedure
        .input(z.object({ patientId: z.number().int().positive() }))
        .query(({ ctx, input }) => getService().chart(ctx.user, input.patientId)),
      saveSummary: staffProcedure
        .input(z.object({ patientId: z.number().int().positive(), summary: z.string().max(4000) }))
        .mutation(({ ctx, input }) => getService().saveSummary(ctx.user, input.patientId, input.summary)),
      addItem: staffProcedure
        .input(z.object({ patientId: z.number().int().positive(), ...itemShape }))
        .mutation(({ ctx, input }) => getService().addItem(ctx.user, input.patientId, input)),
      updateItem: staffProcedure
        .input(z.object({
          patientId: z.number().int().positive(),
          itemId: z.number().int().positive(),
          kind: itemShape.kind.optional(),
          name: z.string().trim().min(1).max(256).optional(),
          dose: z.string().trim().max(64).nullable().optional(),
          unit: z.string().trim().max(32).nullable().optional(),
          route: z.string().trim().max(64).nullable().optional(),
          frequency: z.string().trim().max(128).nullable().optional(),
          instructions: z.string().trim().max(4000).nullable().optional(),
          status: itemShape.status.optional(),
          isSampleTemplate: z.boolean().optional(),
        }))
        .mutation(({ ctx, input }) => {
          const { patientId, itemId, ...patch } = input;
          return getService().updateItem(ctx.user, patientId, itemId, patch);
        }),
      removeItem: staffProcedure
        .input(z.object({ patientId: z.number().int().positive(), itemId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => getService().removeItem(ctx.user, input.patientId, input.itemId)),
      publish: staffProcedure
        .input(z.object({ patientId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => getService().publish(ctx.user, input.patientId)),
      sendMessage: staffProcedure
        .input(z.object({ patientId: z.number().int().positive(), content: z.string().trim().min(1).max(4000) }))
        .mutation(({ ctx, input }) => getService().clinicSend(ctx.user, input.patientId, input.content)),
      reviewIntake: staffProcedure
        .input(z.object({ patientId: z.number().int().positive(), providerNotes: z.string().max(4000) }))
        .mutation(({ ctx, input }) => getService().reviewIntake(ctx.user, input.patientId, input.providerNotes)),
      requestGuidance: staffProcedure
        .input(z.object({ patientId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => getService().requestGuidance(ctx.user, input.patientId)),
      reviewGuidance: staffProcedure
        .input(z.object({ draftId: z.number().int().positive(), decision: z.enum(["approved", "dismissed"]) }))
        .mutation(({ ctx, input }) => getService().reviewGuidance(ctx.user, input.draftId, input.decision)),
    }),
    pharmacy: router({
      queue: staffProcedure.query(({ ctx }) => getService().pharmacyQueue(ctx.user)),
      setStatus: staffProcedure
        .input(z.object({ orderId: z.number().int().positive(), status: z.enum(["filled", "cancelled"]) }))
        .mutation(({ ctx, input }) => getService().setPharmacyStatus(ctx.user, input.orderId, input.status)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
