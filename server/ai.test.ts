import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "This is a test AI response with clinical recommendations.",
        },
      },
    ],
  }),
}));

// Mock db functions used by the AI router
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getPatient: vi.fn().mockResolvedValue({
      id: 1,
      firstName: "Sarah",
      lastName: "Mitchell",
      status: "active",
      subscriptionTier: "premium",
      healthGoals: ["weight_management", "energy"],
      conditions: ["hypothyroid"],
    }),
    listAssignmentsForPatient: vi.fn().mockResolvedValue([
      {
        assignment: { id: 1, status: "active", protocolId: 1, compliancePercent: 80 },
        protocol: { id: 1, name: "Test Protocol", category: "supplement" },
      },
    ]),
    listNotesForPatient: vi.fn().mockResolvedValue([
      { id: 1, content: "Patient reports improved energy levels." },
    ]),
    listProtocolSteps: vi.fn().mockResolvedValue([
      { id: 1, title: "Take supplement", frequency: "daily", sortOrder: 0 },
    ]),
    listCompletionsForAssignment: vi.fn().mockResolvedValue([]),
    getProviderStats: vi.fn().mockResolvedValue({
      totalPatients: 25,
      activePatients: 18,
      avgCompliance: 82,
      upcomingAppointments: 5,
    }),
    getPatientByUserId: vi.fn().mockResolvedValue({
      id: 1,
      firstName: "Sarah",
      healthGoals: ["energy"],
      conditions: [],
    }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-provider",
    email: "provider@example.com",
    name: "Dr. Test",
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

describe("ai.providerChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a response for a basic clinical question", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.providerChat({
      messages: [
        { role: "user", content: "What supplements support mitochondrial function?" },
      ],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe("string");
  });

  it("accepts an optional patientId for context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.providerChat({
      messages: [
        { role: "user", content: "Review this patient's current protocol." },
      ],
      patientId: 1,
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });

  it("handles conversation history (multi-turn)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.providerChat({
      messages: [
        { role: "user", content: "What is the optimal testosterone range?" },
        { role: "assistant", content: "For male optimization, the optimal total testosterone range is typically 600-900 ng/dL." },
        { role: "user", content: "What about free testosterone?" },
      ],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });
});

describe("ai.patientChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a response for a patient wellness question", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.patientChat({
      messages: [
        { role: "user", content: "How can I improve my sleep quality?" },
      ],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe("string");
  });

  it("handles multi-turn patient conversations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.patientChat({
      messages: [
        { role: "user", content: "What should I eat before a workout?" },
        { role: "assistant", content: "A balanced pre-workout meal should include..." },
        { role: "user", content: "What about post-workout nutrition?" },
      ],
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });
});
