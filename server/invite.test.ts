import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 1,
    openId: "admin-open-id",
    email: "admin@blacklabelmedicine.com",
    name: "Dr. Jacob Egbert",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createPatientUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 99,
    openId: "patient-open-id",
    email: "patient@example.com",
    name: "Test Patient",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe("invite.verify", () => {
  it("returns invalid for a non-existent token", async () => {
    const ctx = createContext(); // no auth needed for verify
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invite.verify({ token: "nonexistent-token-12345" });
    expect(result.valid).toBe(false);
    expect(result).toHaveProperty("reason");
  });
});

describe("invite.generate", () => {
  it("requires authentication", async () => {
    const ctx = createContext(); // no user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.generate({ patientId: 1, origin: "https://example.com" })
    ).rejects.toThrow();
  });

  it("throws NOT_FOUND for non-existent patient", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.generate({ patientId: 999999, origin: "https://example.com" })
    ).rejects.toThrow(/not found/i);
  });
});

describe("invite.accept", () => {
  it("requires authentication", async () => {
    const ctx = createContext(); // no user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.accept({ token: "some-token" })
    ).rejects.toThrow();
  });

  it("throws NOT_FOUND for non-existent token", async () => {
    const patient = createPatientUser();
    const ctx = createContext(patient);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.accept({ token: "nonexistent-token-12345" })
    ).rejects.toThrow(/not found/i);
  });

  it("blocks admin accounts from accepting invites", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.accept({ token: "any-token" })
    ).rejects.toThrow(/cannot accept patient invites/i);
  });
});

describe("invite.listForPatient", () => {
  it("requires authentication", async () => {
    const ctx = createContext(); // no user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invite.listForPatient({ patientId: 1 })
    ).rejects.toThrow();
  });

  it("returns empty array for patient with no invites", async () => {
    const admin = createAdminUser();
    const ctx = createContext(admin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.invite.listForPatient({ patientId: 999999 });
    expect(result).toEqual([]);
  });
});
