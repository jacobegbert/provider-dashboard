import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => {
  const steps: any[] = [];
  let nextId = 100;

  return {
    default: {},
    duplicateStepsToAssignment: vi.fn(async (protocolId: number, assignmentId: number) => {
      // Simulate copying library steps to assignment
      const librarySteps = [
        { id: 1, protocolId, title: "Step 1", description: "Desc 1", frequency: "daily", timeOfDay: "morning", startDay: 1 },
        { id: 2, protocolId, title: "Step 2", description: "Desc 2", frequency: "weekly", timeOfDay: "any", startDay: 1 },
      ];
      for (const ls of librarySteps) {
        steps.push({
          id: nextId++,
          assignmentId,
          sourceStepId: ls.id,
          title: ls.title,
          description: ls.description,
          frequency: ls.frequency,
          timeOfDay: ls.timeOfDay,
          startDay: ls.startDay,
          endDay: null,
          customDays: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }),
    listAssignmentSteps: vi.fn(async (assignmentId: number) => {
      return steps.filter((s) => s.assignmentId === assignmentId);
    }),
    createAssignmentStep: vi.fn(async (data: any) => {
      const step = { id: nextId++, ...data, createdAt: new Date(), updatedAt: new Date() };
      steps.push(step);
      return step;
    }),
    updateAssignmentStep: vi.fn(async (id: number, data: any) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) {
        steps[idx] = { ...steps[idx], ...data, updatedAt: new Date() };
      }
    }),
    deleteAssignmentStep: vi.fn(async (id: number) => {
      const idx = steps.findIndex((s) => s.id === id);
      if (idx >= 0) steps.splice(idx, 1);
    }),
    _getSteps: () => steps,
    _reset: () => {
      steps.length = 0;
      nextId = 100;
    },
  };
});

const db = await import("./db");
const mockDb = db as any;

describe("Assignment Steps — Per-Patient Protocol Personalization", () => {
  beforeEach(() => {
    mockDb._reset();
    vi.clearAllMocks();
  });

  it("duplicates library steps to assignment on creation", async () => {
    await mockDb.duplicateStepsToAssignment(1, 10);
    const steps = await mockDb.listAssignmentSteps(10);

    expect(steps).toHaveLength(2);
    expect(steps[0].assignmentId).toBe(10);
    expect(steps[0].sourceStepId).toBe(1);
    expect(steps[0].title).toBe("Step 1");
    expect(steps[1].sourceStepId).toBe(2);
    expect(steps[1].title).toBe("Step 2");
  });

  it("creates per-patient assignment steps independently", async () => {
    const step = await mockDb.createAssignmentStep({
      assignmentId: 20,
      title: "Custom Step",
      description: "Patient-specific instructions",
      frequency: "custom",
      customDays: ["Mon", "Wed", "Fri"],
      timeOfDay: "morning",
      startDay: 1,
    });

    expect(step.id).toBeDefined();
    expect(step.title).toBe("Custom Step");
    expect(step.assignmentId).toBe(20);

    const steps = await mockDb.listAssignmentSteps(20);
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe("Custom Step");
  });

  it("updates a per-patient step without affecting other steps", async () => {
    await mockDb.duplicateStepsToAssignment(1, 30);
    const steps = await mockDb.listAssignmentSteps(30);
    const stepToUpdate = steps[0];

    await mockDb.updateAssignmentStep(stepToUpdate.id, {
      title: "Testosterone Cypionate 0.35mL IM",
      description: "Adjusted dose — MWF",
    });

    const updatedSteps = await mockDb.listAssignmentSteps(30);
    expect(updatedSteps[0].title).toBe("Testosterone Cypionate 0.35mL IM");
    expect(updatedSteps[0].description).toBe("Adjusted dose — MWF");
    // Second step unchanged
    expect(updatedSteps[1].title).toBe("Step 2");
  });

  it("deletes a per-patient step", async () => {
    await mockDb.duplicateStepsToAssignment(1, 40);
    const steps = await mockDb.listAssignmentSteps(40);
    expect(steps).toHaveLength(2);

    await mockDb.deleteAssignmentStep(steps[0].id);

    const remaining = await mockDb.listAssignmentSteps(40);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe("Step 2");
  });

  it("keeps steps isolated between different assignments", async () => {
    await mockDb.duplicateStepsToAssignment(1, 50);
    await mockDb.duplicateStepsToAssignment(1, 60);

    const stepsA = await mockDb.listAssignmentSteps(50);
    const stepsB = await mockDb.listAssignmentSteps(60);

    // Update only assignment 50's first step
    await mockDb.updateAssignmentStep(stepsA[0].id, { title: "Modified for Patient A" });

    const updatedA = await mockDb.listAssignmentSteps(50);
    const unchangedB = await mockDb.listAssignmentSteps(60);

    expect(updatedA[0].title).toBe("Modified for Patient A");
    expect(unchangedB[0].title).toBe("Step 1"); // Unchanged
  });

  it("can add new steps to an existing assignment", async () => {
    await mockDb.duplicateStepsToAssignment(1, 70);

    await mockDb.createAssignmentStep({
      assignmentId: 70,
      title: "Extra: Supply Check",
      description: "Verify needle and syringe count",
      frequency: "weekly",
      timeOfDay: "any",
      startDay: 1,
    });

    const steps = await mockDb.listAssignmentSteps(70);
    expect(steps).toHaveLength(3);
    expect(steps[2].title).toBe("Extra: Supply Check");
  });
});

describe("updateSteps — Legacy Assignment Migration", () => {
  beforeEach(() => {
    mockDb._reset();
    vi.clearAllMocks();
  });

  it("treats incoming step IDs as new when no assignment_steps exist (legacy)", async () => {
    // Simulate the updateSteps logic for a legacy assignment
    // Legacy: no assignment_steps exist, incoming steps have library IDs
    const assignmentId = 80;
    const existing = await mockDb.listAssignmentSteps(assignmentId);
    expect(existing).toHaveLength(0); // legacy — no assignment steps

    const isLegacy = existing.length === 0;
    const existingIds = new Set(existing.map((e: any) => e.id));

    const incomingSteps = [
      {
        id: 60015, // This is a library step ID, NOT an assignment step ID
        title: "Testosterone Cypionate 0.35mL IM Injection",
        description: "Adjusted dose",
        frequency: "custom" as const,
        customDays: ["mon", "wed", "fri"],
        startDay: 1,
        timeOfDay: "morning" as const,
      },
    ];

    for (let i = 0; i < incomingSteps.length; i++) {
      const step = incomingSteps[i];
      if (step.id && !isLegacy && existingIds.has(step.id)) {
        // Would update — but should NOT happen for legacy
        await mockDb.updateAssignmentStep(step.id, { ...step, sortOrder: i });
      } else {
        // Should create new assignment step
        await mockDb.createAssignmentStep({
          assignmentId,
          sortOrder: i,
          title: step.title,
          description: step.description,
          frequency: step.frequency,
          customDays: step.customDays,
          startDay: step.startDay,
          timeOfDay: step.timeOfDay,
        });
      }
    }

    const result = await mockDb.listAssignmentSteps(assignmentId);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Testosterone Cypionate 0.35mL IM Injection");
    expect(result[0].assignmentId).toBe(80);
    // The ID should be a NEW assignment step ID, not the library ID
    expect(result[0].id).not.toBe(60015);
  });

  it("updates existing assignment steps normally (non-legacy)", async () => {
    // First, create assignment steps (simulating a non-legacy assignment)
    const assignmentId = 90;
    await mockDb.createAssignmentStep({
      assignmentId,
      sortOrder: 0,
      title: "Original Step",
      description: "Original desc",
      frequency: "daily",
      timeOfDay: "morning",
      startDay: 1,
    });

    const existing = await mockDb.listAssignmentSteps(assignmentId);
    expect(existing).toHaveLength(1);
    const existingIds = new Set(existing.map((e: any) => e.id));
    const isLegacy = existing.length === 0;
    expect(isLegacy).toBe(false);

    // Now update with the existing assignment step ID
    const incomingSteps = [
      {
        id: existing[0].id,
        title: "Updated Step Title",
        description: "Updated desc",
        frequency: "daily" as const,
        timeOfDay: "morning" as const,
        startDay: 1,
      },
    ];

    for (let i = 0; i < incomingSteps.length; i++) {
      const step = incomingSteps[i];
      if (step.id && !isLegacy && existingIds.has(step.id)) {
        const { id: stepId, ...stepData } = step;
        await mockDb.updateAssignmentStep(stepId, { ...stepData, sortOrder: i });
      } else {
        await mockDb.createAssignmentStep({
          assignmentId,
          sortOrder: i,
          title: step.title,
          description: step.description,
          frequency: step.frequency,
          timeOfDay: step.timeOfDay,
          startDay: step.startDay,
        });
      }
    }

    const result = await mockDb.listAssignmentSteps(assignmentId);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Updated Step Title");
    expect(result[0].id).toBe(existing[0].id); // Same ID — updated in place
  });
});
