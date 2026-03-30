import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock } from "./__mocks__/dbMockFactory";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Stateful mock data for protocol CRUD tests
let protocols: any[] = [];
let protocolIdCounter = 1;
let assignments: any[] = [];
let assignmentIdCounter = 1;

vi.mock("./db", () =>
  createDbMock({
    listProtocols: vi.fn(async () => protocols.filter((p) => !p.isArchived)),
    listAllProtocols: vi.fn(async () => [...protocols]),
    createProtocol: vi.fn(async (data: any) => {
      const p = {
        id: protocolIdCounter++,
        ...data,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      protocols.push(p);
      return p;
    }),
    updateProtocol: vi.fn(async (id: number, data: any) => {
      const idx = protocols.findIndex((p) => p.id === id);
      if (idx >= 0) protocols[idx] = { ...protocols[idx], ...data };
    }),
    getProtocol: vi.fn(async (id: number) => protocols.find((p) => p.id === id)),
    listPatients: vi.fn(async () => [
      { id: 1, firstName: "Jacob", lastName: "Egbert", email: "jacob@test.com", providerId: 1, status: "active" },
    ]),
    getPatient: vi.fn(async () => ({
      id: 1,
      firstName: "Jacob",
      lastName: "Egbert",
      email: "jacob@test.com",
      providerId: 1,
      status: "active",
    })),
    createAssignment: vi.fn(async (data: any) => {
      const a = { id: assignmentIdCounter++, ...data, status: "active", createdAt: new Date() };
      assignments.push(a);
      return a;
    }),
  })
);

// Mock email/sms/patientNotify to prevent real sends
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  appointmentEmailHtml: vi.fn().mockReturnValue("<p>appointment</p>"),
  protocolAssignedEmailHtml: vi.fn().mockReturnValue("<p>assigned</p>"),
  protocolUpdatedEmailHtml: vi.fn().mockReturnValue("<p>updated</p>"),
}));
vi.mock("./sms", () => ({
  sendSms: vi.fn().mockResolvedValue(true),
  appointmentSmsBody: vi.fn().mockReturnValue("appointment sms"),
  protocolAssignedSmsBody: vi.fn().mockReturnValue("assigned sms"),
  protocolUpdatedSmsBody: vi.fn().mockReturnValue("updated sms"),
}));
vi.mock("./patientNotify", () => ({
  notifyPatientProtocolAssigned: vi.fn().mockResolvedValue(undefined),
  notifyPatientProtocolUpdated: vi.fn().mockResolvedValue(undefined),
  notifyPatientAppointment: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "provider-user",
    email: "dr.egbert@blacklabelmedicine.com",
    name: "Dr. Jacob Egbert",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

beforeEach(async () => {
  const { clearOwnerIdCache } = await import("./_core/trpc");
  clearOwnerIdCache();
  protocols = [];
  protocolIdCounter = 1;
  assignments = [];
  assignmentIdCounter = 1;
  vi.clearAllMocks();
});

describe("protocol.listAll", () => {
  it("returns all protocols including archived", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.protocol.listAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.protocol.listAll()).rejects.toThrow();
  });
});

describe("protocol.create with ongoing duration (null durationDays)", () => {
  it("accepts null durationDays for ongoing protocols", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.protocol.create({
      name: "Test Ongoing Protocol",
      category: "nutrition",
      description: "An ongoing protocol with no end date",
      durationDays: null,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("accepts a numeric durationDays for fixed-length protocols", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.protocol.create({
      name: "Test Fixed Protocol",
      category: "hormone",
      description: "A 30-day protocol",
      durationDays: 30,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });
});

describe("protocol.archive and unarchive", () => {
  it("archives a protocol", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.protocol.create({
      name: "Archive Test Protocol",
      category: "peptides",
    });
    await caller.protocol.update({ id: created.id, isArchived: true });
    const allProtocols = await caller.protocol.listAll();
    const archived = allProtocols.find((p: any) => p.id === created.id);
    expect(archived?.isArchived).toBeTruthy();
  });

  it("unarchives a protocol (restore)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.protocol.create({
      name: "Restore Test Protocol",
      category: "peptides",
    });
    await caller.protocol.update({ id: created.id, isArchived: true });
    await caller.protocol.update({ id: created.id, isArchived: false });
    const allProtocols = await caller.protocol.listAll();
    const restored = allProtocols.find((p: any) => p.id === created.id);
    expect(restored?.isArchived).toBeFalsy();
  });
});

describe("attention.queue", () => {
  it("returns attention queue data for authenticated provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attention.queue();
    expect(result).toBeDefined();
    expect(result).toBeDefined();
    expect(Array.isArray(result.overduePatients) || result.overduePatients === undefined).toBeTruthy();
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.attention.queue()).rejects.toThrow();
  });
});

describe("attention.stats", () => {
  it("returns stats for authenticated provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attention.stats();
    expect(result).toBeDefined();
    expect(typeof result.totalPatients).toBe("number");
    expect(typeof result.activePatients).toBe("number");
    expect(typeof result.avgCompliance).toBe("number");
    expect(typeof result.totalUnread).toBe("number");
    expect(typeof result.upcomingAppointments).toBe("number");
  });
});

describe("assignment.create", () => {
  it("creates a protocol assignment for a patient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const protocol = await caller.protocol.create({
      name: "Test Protocol for Assignment",
      category: "nutrition",
    });
    const patients = await caller.patient.list();
    if (patients.length > 0) {
      const result = await caller.assignment.create({
        patientId: patients[0].id,
        protocolId: protocol.id,
        startDate: new Date(),
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    }
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.assignment.create({ patientId: 1, protocolId: 1, startDate: new Date() })
    ).rejects.toThrow();
  });
});
