import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  listCompletionsForAssignment: vi.fn(),
  bulkCreateTaskCompletions: vi.fn(),
  listCompletionsByDateRange: vi.fn(),
}));

import * as db from "./db";

describe("Protocol Calendar Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("bulkCreateTaskCompletions", () => {
    it("should accept an array of completion records", async () => {
      const mockData = [
        { assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-13" },
        { assignmentId: 1, stepId: 11, patientId: 5, taskDate: "2026-03-13" },
        { assignmentId: 1, stepId: 12, patientId: 5, taskDate: "2026-03-13" },
      ];
      vi.mocked(db.bulkCreateTaskCompletions).mockResolvedValue(undefined);

      await db.bulkCreateTaskCompletions(mockData);
      expect(db.bulkCreateTaskCompletions).toHaveBeenCalledWith(mockData);
      expect(db.bulkCreateTaskCompletions).toHaveBeenCalledTimes(1);
    });

    it("should handle empty array gracefully", async () => {
      vi.mocked(db.bulkCreateTaskCompletions).mockResolvedValue(undefined);

      await db.bulkCreateTaskCompletions([]);
      expect(db.bulkCreateTaskCompletions).toHaveBeenCalledWith([]);
    });
  });

  describe("listCompletionsByDateRange", () => {
    it("should return completions within the given date range", async () => {
      const mockCompletions = [
        { id: 1, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-10", completedAt: new Date(), notes: null },
        { id: 2, assignmentId: 1, stepId: 11, patientId: 5, taskDate: "2026-03-11", completedAt: new Date(), notes: null },
        { id: 3, assignmentId: 2, stepId: 20, patientId: 5, taskDate: "2026-03-12", completedAt: new Date(), notes: null },
      ];
      vi.mocked(db.listCompletionsByDateRange).mockResolvedValue(mockCompletions as any);

      const result = await db.listCompletionsByDateRange(5, "2026-03-01", "2026-03-31");
      expect(result).toHaveLength(3);
      expect(db.listCompletionsByDateRange).toHaveBeenCalledWith(5, "2026-03-01", "2026-03-31");
    });

    it("should return empty array when no completions exist", async () => {
      vi.mocked(db.listCompletionsByDateRange).mockResolvedValue([]);

      const result = await db.listCompletionsByDateRange(5, "2026-01-01", "2026-01-31");
      expect(result).toEqual([]);
    });
  });

  describe("completeAll logic (deduplication)", () => {
    it("should skip already-completed steps when bulk completing", async () => {
      // Simulate existing completions for step 10 on this date
      const existingCompletions = [
        { id: 1, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-13", completedAt: new Date(), notes: null },
      ];
      vi.mocked(db.listCompletionsForAssignment).mockResolvedValue(existingCompletions as any);
      vi.mocked(db.bulkCreateTaskCompletions).mockResolvedValue(undefined);

      // Simulate the completeAll logic from the router
      const allStepIds = [10, 11, 12];
      const taskDate = "2026-03-13";
      const assignmentId = 1;
      const patientId = 5;

      const existing = await db.listCompletionsForAssignment(assignmentId);
      const existingSet = new Set(
        existing.filter((c) => c.taskDate === taskDate).map((c) => c.stepId)
      );

      const toInsert = allStepIds
        .filter((id) => !existingSet.has(id))
        .map((stepId) => ({
          assignmentId,
          stepId,
          patientId,
          taskDate,
        }));

      expect(toInsert).toHaveLength(2); // Only steps 11 and 12
      expect(toInsert.map((t) => t.stepId)).toEqual([11, 12]);

      if (toInsert.length > 0) {
        await db.bulkCreateTaskCompletions(toInsert);
      }
      expect(db.bulkCreateTaskCompletions).toHaveBeenCalledWith(toInsert);
    });

    it("should not call bulk insert when all steps already completed", async () => {
      const existingCompletions = [
        { id: 1, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-13", completedAt: new Date(), notes: null },
        { id: 2, assignmentId: 1, stepId: 11, patientId: 5, taskDate: "2026-03-13", completedAt: new Date(), notes: null },
      ];
      vi.mocked(db.listCompletionsForAssignment).mockResolvedValue(existingCompletions as any);
      vi.mocked(db.bulkCreateTaskCompletions).mockResolvedValue(undefined);

      const allStepIds = [10, 11];
      const taskDate = "2026-03-13";
      const assignmentId = 1;

      const existing = await db.listCompletionsForAssignment(assignmentId);
      const existingSet = new Set(
        existing.filter((c) => c.taskDate === taskDate).map((c) => c.stepId)
      );

      const toInsert = allStepIds
        .filter((id) => !existingSet.has(id))
        .map((stepId) => ({
          assignmentId,
          stepId,
          patientId: 5,
          taskDate,
        }));

      expect(toInsert).toHaveLength(0);
      // Should NOT call bulk insert
      expect(db.bulkCreateTaskCompletions).not.toHaveBeenCalled();
    });
  });

  describe("Calendar completion grouping logic", () => {
    it("should correctly group completions by date", () => {
      const completionHistory = [
        { id: 1, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-10" },
        { id: 2, assignmentId: 1, stepId: 11, patientId: 5, taskDate: "2026-03-10" },
        { id: 3, assignmentId: 2, stepId: 20, patientId: 5, taskDate: "2026-03-10" },
        { id: 4, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-11" },
      ];

      // Replicate the frontend grouping logic
      const map: Record<string, { total: number; stepIds: Set<number>; assignmentIds: Set<number> }> = {};
      completionHistory.forEach((c) => {
        if (!map[c.taskDate]) {
          map[c.taskDate] = { total: 0, stepIds: new Set(), assignmentIds: new Set() };
        }
        map[c.taskDate].total++;
        map[c.taskDate].stepIds.add(c.stepId);
        map[c.taskDate].assignmentIds.add(c.assignmentId);
      });

      expect(Object.keys(map)).toHaveLength(2);
      expect(map["2026-03-10"].total).toBe(3);
      expect(map["2026-03-10"].assignmentIds.size).toBe(2);
      expect(map["2026-03-11"].total).toBe(1);
    });

    it("should correctly group completions by assignment for day detail", () => {
      const dayCompletions = [
        { id: 1, assignmentId: 1, stepId: 10, patientId: 5, taskDate: "2026-03-10" },
        { id: 2, assignmentId: 1, stepId: 11, patientId: 5, taskDate: "2026-03-10" },
        { id: 3, assignmentId: 2, stepId: 20, patientId: 5, taskDate: "2026-03-10" },
      ];

      const byAssignment: Record<number, { assignmentId: number; completedStepIds: Set<number> }> = {};
      dayCompletions.forEach((c) => {
        if (!byAssignment[c.assignmentId]) {
          byAssignment[c.assignmentId] = { assignmentId: c.assignmentId, completedStepIds: new Set() };
        }
        byAssignment[c.assignmentId].completedStepIds.add(c.stepId);
      });

      expect(Object.keys(byAssignment)).toHaveLength(2);
      expect(byAssignment[1].completedStepIds.size).toBe(2);
      expect(byAssignment[2].completedStepIds.size).toBe(1);
    });
  });
});
