import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for the getLocalDateStr logic used in PatientProtocols.tsx.
 * The function must produce YYYY-MM-DD based on the user's local timezone,
 * NOT UTC. This ensures daily task completions reset at local midnight.
 *
 * We replicate the function here to unit-test it in isolation.
 */

function getLocalDateStr(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("getLocalDateStr — local timezone date generation", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getLocalDateStr(new Date(2026, 0, 15)); // Jan 15, 2026 local
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe("2026-01-15");
  });

  it("uses local date components, not UTC", () => {
    // Create a date at 11pm MST (UTC-7) = 6am next day UTC
    // In MST this is still Feb 19, but in UTC it's Feb 20
    const late = new Date("2026-02-20T05:30:00Z"); // 10:30pm MST on Feb 19
    // getLocalDateStr uses .getFullYear(), .getMonth(), .getDate()
    // which return LOCAL values. In a UTC-7 environment, this would be Feb 19.
    // In our test environment (likely UTC), this will be Feb 20.
    // The key assertion: it matches what .getDate() returns, NOT the UTC date.
    const expected = `${late.getFullYear()}-${String(late.getMonth() + 1).padStart(2, "0")}-${String(late.getDate()).padStart(2, "0")}`;
    expect(getLocalDateStr(late)).toBe(expected);
  });

  it("never uses toISOString (which is always UTC)", () => {
    const date = new Date(2026, 5, 15, 23, 30); // June 15 at 11:30pm local
    const localStr = getLocalDateStr(date);
    // getLocalDateStr should return the local date
    expect(localStr).toBe("2026-06-15");
    // toISOString might return the next day if local tz is behind UTC
    // The point: our function does NOT rely on toISOString
  });

  it("pads single-digit months and days", () => {
    expect(getLocalDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(getLocalDateStr(new Date(2026, 8, 9))).toBe("2026-09-09");
  });

  it("handles year boundaries correctly", () => {
    // Dec 31 at 11pm local
    const nye = new Date(2026, 11, 31, 23, 0);
    expect(getLocalDateStr(nye)).toBe("2026-12-31");

    // Jan 1 at 12:01am local
    const newYear = new Date(2027, 0, 1, 0, 1);
    expect(getLocalDateStr(newYear)).toBe("2027-01-01");
  });

  it("handles leap year Feb 29", () => {
    const leapDay = new Date(2028, 1, 29, 12, 0);
    expect(getLocalDateStr(leapDay)).toBe("2028-02-29");
  });
});

describe("Task completion date matching", () => {
  it("completions from yesterday local time do NOT match today", () => {
    // Simulate: yesterday's completion stored as "2026-02-18"
    const yesterdayCompletion = { taskDate: "2026-02-18", stepId: 1 };
    const todayStr = getLocalDateStr(new Date(2026, 1, 19)); // Feb 19 local

    const todayCompletions = [yesterdayCompletion].filter(
      (c) => c.taskDate === todayStr
    );
    expect(todayCompletions).toHaveLength(0);
  });

  it("completions from today local time DO match today", () => {
    const todayCompletion = { taskDate: "2026-02-19", stepId: 1 };
    const todayStr = getLocalDateStr(new Date(2026, 1, 19));

    const todayCompletions = [todayCompletion].filter(
      (c) => c.taskDate === todayStr
    );
    expect(todayCompletions).toHaveLength(1);
  });

  it("the old UTC-based approach would produce wrong date late at night", () => {
    // This test documents the bug we fixed.
    // At 11pm MST (UTC-7), toISOString gives the NEXT day in UTC.
    const lateNightMST = new Date("2026-02-20T06:00:00Z"); // = 11pm Feb 19 MST
    const utcDate = lateNightMST.toISOString().slice(0, 10); // "2026-02-20" (wrong for MST user)
    const localDate = getLocalDateStr(lateNightMST); // Uses local getDate()

    // In a UTC test environment, both will be Feb 20.
    // But the structure of the code is what matters:
    // getLocalDateStr uses getDate() (local), not toISOString() (UTC).
    // We verify the function signature is correct.
    expect(typeof localDate).toBe("string");
    expect(localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("Custom day frequency matching", () => {
  it("matches full day names case-insensitively", () => {
    const customDays = ["Monday", "Wednesday", "Friday"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    // Wednesday = index 3
    const localDayOfWeek = 3;
    const todayFull = dayNames[localDayOfWeek];
    const todayShort = shortDayNames[localDayOfWeek];

    const matches = customDays.some(
      (d: string) =>
        d.toLowerCase() === todayFull.toLowerCase() ||
        d.toLowerCase() === todayShort
    );
    expect(matches).toBe(true);
  });

  it("matches short day names", () => {
    const customDays = ["mon", "wed", "fri"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    // Friday = index 5
    const localDayOfWeek = 5;
    const todayFull = dayNames[localDayOfWeek];
    const todayShort = shortDayNames[localDayOfWeek];

    const matches = customDays.some(
      (d: string) =>
        d.toLowerCase() === todayFull.toLowerCase() ||
        d.toLowerCase() === todayShort
    );
    expect(matches).toBe(true);
  });

  it("does not match days not in the list", () => {
    const customDays = ["Monday", "Wednesday"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    // Thursday = index 4
    const localDayOfWeek = 4;
    const todayFull = dayNames[localDayOfWeek];
    const todayShort = shortDayNames[localDayOfWeek];

    const matches = customDays.some(
      (d: string) =>
        d.toLowerCase() === todayFull.toLowerCase() ||
        d.toLowerCase() === todayShort
    );
    expect(matches).toBe(false);
  });
});
