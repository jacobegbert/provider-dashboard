import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * Resolve the practice owner's numeric user ID.
 * Staff members share the owner's data scope, so all data queries
 * should use ownerId instead of ctx.user.id for filtering.
 *
 * Uses a promise-based singleton to prevent race conditions:
 * concurrent requests all await the same in-flight lookup.
 *
 * IMPORTANT: Never falls back to the current user's ID for staff users.
 * If the owner cannot be resolved, staff requests will fail with an error
 * rather than silently creating data under the wrong provider.
 */
let _ownerIdPromise: Promise<number> | null = null;

async function resolveOwnerId(fallbackUserId: number, userRole: string): Promise<number> {
  // For the admin (owner) user, we can safely use their own ID as fallback
  if (userRole === 'admin') {
    if (_ownerIdPromise) return _ownerIdPromise;
    _ownerIdPromise = _doResolveOwnerId(fallbackUserId);
    return _ownerIdPromise;
  }

  // For staff users, we MUST resolve to the actual owner — never fall back
  if (_ownerIdPromise) return _ownerIdPromise;
  _ownerIdPromise = _doResolveOwnerId(null);
  return _ownerIdPromise;
}

async function _doResolveOwnerId(fallbackId: number | null): Promise<number> {
  try {
    const { getUserByEmail, getUserByRole } = await import("../db");
    const ownerEmail = ENV.ownerEmail;
    console.log(`[resolveOwnerId] Looking up owner with email: ${ownerEmail}`);

    if (!ownerEmail) {
      if (fallbackId !== null) {
        console.warn("[resolveOwnerId] OWNER_EMAIL env var is not set, falling back to admin user");
        return fallbackId;
      }
      _ownerIdPromise = null; // Clear so it retries next time
      throw new Error("OWNER_EMAIL env var is not set and no admin fallback available");
    }

    const owner = await getUserByEmail(ownerEmail);
    if (!owner) {
      if (fallbackId !== null) {
        console.warn(`[resolveOwnerId] Owner not found for email: ${ownerEmail}, falling back to admin user`);
        return fallbackId;
      }
      _ownerIdPromise = null; // Clear so it retries next time
      throw new Error(`Owner not found for email: ${ownerEmail}`);
    }

    console.log(`[resolveOwnerId] Resolved owner: id=${owner.id}, name=${owner.name}`);
    return owner.id;
  } catch (err) {
    if (fallbackId !== null) {
      console.error("[resolveOwnerId] Error resolving owner, falling back to admin:", err);
      return fallbackId;
    }
    _ownerIdPromise = null; // Clear so it retries next time
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to resolve practice owner. Please try again or contact support.",
    });
  }
}

/** Clear cached owner ID (useful for testing) */
export function clearOwnerIdCache() {
  _ownerIdPromise = null;
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'staff')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    const ownerId = await resolveOwnerId(ctx.user.id, ctx.user.role);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        ownerId,
      },
    });
  }),
);

/** Owner-only procedure — only the admin (owner) can perform these actions */
export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the practice owner can perform this action" });
    }

    const ownerId = await resolveOwnerId(ctx.user.id, ctx.user.role);

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        ownerId,
      },
    });
  }),
);
