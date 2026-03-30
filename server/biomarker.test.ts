import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock the db module
vi.mock("./db", () => {
  const entries: any[] = [];
  const customMetrics: any[] = [];
  let entryIdCounter = 1;
  let metricIdCounter = 1;

  return {
    listBiomarkerEntries: vi.fn(async (patientId: number, metricName?: string) => {
      let result = entries.filter((e) => e.patientId === patientId);
      if (metricName) result = result.filter((e) => e.metricName === metricName);
      return result.sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
    }),
    createBiomarkerEntry: vi.fn(async (data: any) => {
      const entry = { id: entryIdCounter++, ...data };
      entries.push(entry);
      return entry;
    }),
    deleteBiomarkerEntry: vi.fn(async (id: number) => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    }),
    updateBiomarkerEntry: vi.fn(async (id: number, data: any) => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) Object.assign(entries[idx], data);
    }),
    listCustomMetrics: vi.fn(async (patientId: number) => {
      return customMetrics.filter((m) => m.patientId === patientId);
    }),
    createCustomMetric: vi.fn(async (data: any) => {
      const metric = { id: metricIdCounter++, ...data };
      customMetrics.push(metric);
      return metric;
    }),
    deleteCustomMetric: vi.fn(async (id: number) => {
      const idx = customMetrics.findIndex((m) => m.id === id);
      if (idx >= 0) customMetrics.splice(idx, 1);
    }),
    // Stubs for other db functions that may be referenced
    getUserByOpenId: vi.fn(async () => null),
    createUser: vi.fn(async () => ({ id: 1 })),
    getUserById: vi.fn(async (id: number) => {
      if (id === 1) return { id: 1, openId: "test-open-id", name: "Test User", role: "admin" };
      return null;
    }),
    getPatientByUserId: vi.fn(async () => null),
  };
});

function createAuthContext() {
  return {
    user: { id: 1, openId: "test-open-id", name: "Test User", role: "admin" as const },
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

function createUnauthContext() {
  return {
    user: null,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

describe("biomarker.addEntry", () => {
  it("creates a biomarker entry for a patient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.addEntry({
      patientId: 100,
      metricName: "Weight",
      value: "185",
      unit: "lbs",
      measuredAt: "2026-02-18",
    });
    expect(result).toHaveProperty("id");
    expect(result.metricName).toBe("Weight");
    expect(result.value).toBe("185");
  });

  it("rejects invalid date format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.addEntry({
        patientId: 100,
        metricName: "Weight",
        value: "185",
        unit: "lbs",
        measuredAt: "Feb 18 2026", // invalid format
      })
    ).rejects.toThrow();
  });

  it("rejects empty value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.addEntry({
        patientId: 100,
        metricName: "Weight",
        value: "",
        unit: "lbs",
        measuredAt: "2026-02-18",
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.addEntry({
        patientId: 100,
        metricName: "Weight",
        value: "185",
        unit: "lbs",
        measuredAt: "2026-02-18",
      })
    ).rejects.toThrow();
  });
});

describe("biomarker.listEntries", () => {
  it("lists entries for a patient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.listEntries({ patientId: 100 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters by metric name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.listEntries({ patientId: 100, metricName: "Weight" });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((entry: any) => {
      expect(entry.metricName).toBe("Weight");
    });
  });
});

describe("biomarker.deleteEntry", () => {
  it("deletes a biomarker entry", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.deleteEntry({ id: 1, patientId: 100 });
    expect(result).toEqual({ success: true });
  });
});

describe("biomarker.addCustomMetric", () => {
  it("creates a custom metric", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.addCustomMetric({
      patientId: 100,
      name: "Waist Circumference",
      unit: "in",
    });
    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Waist Circumference");
    expect(result.unit).toBe("in");
  });

  it("rejects empty name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.addCustomMetric({
        patientId: 100,
        name: "",
        unit: "in",
      })
    ).rejects.toThrow();
  });

  it("rejects empty unit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.addCustomMetric({
        patientId: 100,
        name: "Waist",
        unit: "",
      })
    ).rejects.toThrow();
  });
});

describe("biomarker.listCustomMetrics", () => {
  it("lists custom metrics for a patient", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.listCustomMetrics({ patientId: 100 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("biomarker.deleteCustomMetric", () => {
  it("deletes a custom metric", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.biomarker.deleteCustomMetric({ id: 1, patientId: 100 });
    expect(result).toEqual({ success: true });
  });
});

describe("biomarker.updateEntry", () => {
  it("updates a biomarker entry value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // First create an entry
    const entry = await caller.biomarker.addEntry({
      patientId: 200,
      metricName: "Weight",
      value: "190",
      unit: "lbs",
      measuredAt: "2026-02-18",
    });
    // Update it
    const result = await caller.biomarker.updateEntry({
      id: entry.id,
      patientId: 200,
      value: "188",
      measuredAt: "2026-02-18",
    });
    expect(result).toEqual({ success: true });
  });

  it("updates entry with a note", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entry = await caller.biomarker.addEntry({
      patientId: 200,
      metricName: "Body Fat",
      value: "18",
      unit: "%",
      measuredAt: "2026-02-18",
    });
    const result = await caller.biomarker.updateEntry({
      id: entry.id,
      patientId: 200,
      value: "17.5",
      measuredAt: "2026-02-19",
      note: "After morning workout",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects empty value", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.updateEntry({
        id: 999,
        patientId: 200,
        value: "",
        measuredAt: "2026-02-18",
      })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.biomarker.updateEntry({
        id: 1,
        patientId: 200,
        value: "185",
        measuredAt: "2026-02-18",
      })
    ).rejects.toThrow();
  });
});
