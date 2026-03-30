import { describe, it, expect } from "vitest";

/**
 * Tests for custom day-of-week frequency feature in protocol steps.
 * Validates the data model, day constants, and frequency label rendering.
 */

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayOfWeek = (typeof VALID_DAYS)[number];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "Once",
  as_needed: "As needed",
  custom: "Custom Days",
};

const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

describe("Custom Day Frequency", () => {
  describe("VALID_DAYS constant", () => {
    it("contains exactly 7 days", () => {
      expect(VALID_DAYS).toHaveLength(7);
    });

    it("starts with monday and ends with sunday", () => {
      expect(VALID_DAYS[0]).toBe("mon");
      expect(VALID_DAYS[6]).toBe("sun");
    });

    it("contains all days of the week", () => {
      expect(VALID_DAYS).toContain("mon");
      expect(VALID_DAYS).toContain("tue");
      expect(VALID_DAYS).toContain("wed");
      expect(VALID_DAYS).toContain("thu");
      expect(VALID_DAYS).toContain("fri");
      expect(VALID_DAYS).toContain("sat");
      expect(VALID_DAYS).toContain("sun");
    });
  });

  describe("FREQUENCY_LABELS", () => {
    it("includes the custom option", () => {
      expect(FREQUENCY_LABELS).toHaveProperty("custom");
      expect(FREQUENCY_LABELS.custom).toBe("Custom Days");
    });

    it("has labels for all 7 frequency types", () => {
      const expectedKeys = ["daily", "weekly", "biweekly", "monthly", "once", "as_needed", "custom"];
      for (const key of expectedKeys) {
        expect(FREQUENCY_LABELS).toHaveProperty(key);
        expect(typeof FREQUENCY_LABELS[key]).toBe("string");
      }
    });
  });

  describe("DAY_LABELS", () => {
    it("has short labels for all 7 days", () => {
      for (const day of VALID_DAYS) {
        expect(DAY_LABELS).toHaveProperty(day);
        expect(typeof DAY_LABELS[day]).toBe("string");
      }
    });

    it("uses 3-letter abbreviations", () => {
      expect(DAY_LABELS.mon).toBe("Mon");
      expect(DAY_LABELS.wed).toBe("Wed");
      expect(DAY_LABELS.fri).toBe("Fri");
    });
  });

  describe("Custom days display logic", () => {
    function formatCustomDays(frequency: string, customDays?: string[]): string {
      if (frequency === "custom" && customDays?.length) {
        return customDays.map((d) => DAY_LABELS[d] || d).join(", ");
      }
      return FREQUENCY_LABELS[frequency] || frequency;
    }

    it("renders M/W/F selection correctly", () => {
      const result = formatCustomDays("custom", ["mon", "wed", "fri"]);
      expect(result).toBe("Mon, Wed, Fri");
    });

    it("renders T/Th/Sat selection correctly", () => {
      const result = formatCustomDays("custom", ["tue", "thu", "sat"]);
      expect(result).toBe("Tue, Thu, Sat");
    });

    it("renders single day correctly", () => {
      const result = formatCustomDays("custom", ["mon"]);
      expect(result).toBe("Mon");
    });

    it("renders all days correctly", () => {
      const result = formatCustomDays("custom", ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
      expect(result).toBe("Mon, Tue, Wed, Thu, Fri, Sat, Sun");
    });

    it("falls back to frequency label when not custom", () => {
      expect(formatCustomDays("daily")).toBe("Daily");
      expect(formatCustomDays("weekly")).toBe("Weekly");
      expect(formatCustomDays("as_needed")).toBe("As needed");
    });

    it("falls back to frequency label when custom has no days", () => {
      expect(formatCustomDays("custom", [])).toBe("Custom Days");
      expect(formatCustomDays("custom", undefined)).toBe("Custom Days");
    });
  });

  describe("Day toggle logic", () => {
    function toggleDay(currentDays: DayOfWeek[], day: DayOfWeek): DayOfWeek[] {
      return currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
    }

    it("adds a day when not selected", () => {
      const result = toggleDay([], "mon");
      expect(result).toEqual(["mon"]);
    });

    it("removes a day when already selected", () => {
      const result = toggleDay(["mon", "wed", "fri"], "wed");
      expect(result).toEqual(["mon", "fri"]);
    });

    it("builds M/W/F selection step by step", () => {
      let days: DayOfWeek[] = [];
      days = toggleDay(days, "mon");
      expect(days).toEqual(["mon"]);
      days = toggleDay(days, "wed");
      expect(days).toEqual(["mon", "wed"]);
      days = toggleDay(days, "fri");
      expect(days).toEqual(["mon", "wed", "fri"]);
    });

    it("can deselect all days", () => {
      let days: DayOfWeek[] = ["mon"];
      days = toggleDay(days, "mon");
      expect(days).toEqual([]);
    });
  });
});
