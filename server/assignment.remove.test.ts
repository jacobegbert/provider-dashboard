import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  deleteAssignment: vi.fn().mockResolvedValue(undefined),
  logAudit: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue({ id: 1, openId: "owner", name: "Owner", email: "owner@test.com", role: "admin" }),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("assignment.remove", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { clearOwnerIdCache } = await import("./_core/trpc");
    clearOwnerIdCache();
  });

  it("allows admin to remove an assignment", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.assignment.remove({ id: 42 });

    expect(db.deleteAssignment).toHaveBeenCalledWith(42);
    expect(db.logAudit).toHaveBeenCalledWith({
      userId: 1,
      action: "assignment.remove",
      entityType: "assignment",
      entityId: 42,
    });
  });

  it("rejects non-admin users", async () => {
    const ctx = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.assignment.remove({ id: 42 })).rejects.toThrow();
    expect(db.deleteAssignment).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.assignment.remove({ id: 42 })).rejects.toThrow();
    expect(db.deleteAssignment).not.toHaveBeenCalled();
  });
});
