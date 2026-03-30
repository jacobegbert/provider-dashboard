import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the googleCalendar module to avoid hitting real DB
vi.mock("./googleCalendar", () => ({
  getGoogleAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth?scope=calendar.events&redirect_uri=https://example.com/api/google/callback"),
  getConnectionStatus: vi.fn().mockResolvedValue({ connected: false, googleEmail: null }),
  disconnectGoogle: vi.fn().mockResolvedValue(undefined),
  syncAppointmentToGoogle: vi.fn().mockResolvedValue(undefined),
  deleteGoogleEvent: vi.fn().mockResolvedValue(undefined),
  syncAllAppointments: vi.fn().mockRejectedValue(new Error("Google Calendar not connected")),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 99999,
    openId: "test-provider-gcal",
    email: "provider-gcal@test.com",
    name: "Test Provider",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("googleCalendar router", () => {
  it("status returns connected: false when no tokens exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.status();
    expect(result).toHaveProperty("connected");
    expect(result).toHaveProperty("googleEmail");
    expect(result.connected).toBe(false);
    expect(result.googleEmail).toBeNull();
  });

  it("getAuthUrl returns a valid Google OAuth URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.getAuthUrl({
      origin: "https://example.com",
    });

    expect(result).toHaveProperty("url");
    expect(result.url).toContain("accounts.google.com");
    expect(result.url).toContain("calendar.events");
    expect(result.url).toContain("redirect_uri");
  });

  it("disconnect succeeds even when no tokens exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.googleCalendar.disconnect();
    expect(result).toEqual({ success: true });
  });
});

describe("appointment.syncAllToGoogle", () => {
  it("throws when Google Calendar is not connected", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.appointment.syncAllToGoogle()).rejects.toThrow(
      "Google Calendar not connected"
    );
  });
});
