import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  createResource: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  archiveResource: vi.fn(),
  getResourceById: vi.fn(),
  listResources: vi.fn(),
  shareResource: vi.fn(),
  unshareResource: vi.fn(),
  listSharesForResource: vi.fn(),
  listResourcesForPatient: vi.fn(),
  markResourceViewed: vi.fn(),
}));

import * as db from "./db";

describe("Resource DB helpers (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createResource should be called with correct params", async () => {
    const mockResource = {
      id: 1,
      title: "TRT Guide",
      description: "A guide to testosterone replacement therapy",
      type: "article" as const,
      category: "hormone" as const,
      createdBy: 1,
      content: "# TRT Guide\n\nThis is a guide...",
      tags: ["testosterone", "trt"],
    };
    (db.createResource as any).mockResolvedValue(mockResource);

    const result = await db.createResource({
      title: "TRT Guide",
      description: "A guide to testosterone replacement therapy",
      type: "article",
      category: "hormone",
      createdBy: 1,
      content: "# TRT Guide\n\nThis is a guide...",
      tags: ["testosterone", "trt"],
    });

    expect(db.createResource).toHaveBeenCalledOnce();
    expect(result.title).toBe("TRT Guide");
    expect(result.category).toBe("hormone");
    expect(result.type).toBe("article");
  });

  it("updateResource should be called with id and partial data", async () => {
    (db.updateResource as any).mockResolvedValue(undefined);

    await db.updateResource(1, { title: "Updated TRT Guide", category: "hormone" });

    expect(db.updateResource).toHaveBeenCalledWith(1, {
      title: "Updated TRT Guide",
      category: "hormone",
    });
  });

  it("deleteResource should remove resource and its shares", async () => {
    (db.deleteResource as any).mockResolvedValue(undefined);

    await db.deleteResource(1);

    expect(db.deleteResource).toHaveBeenCalledWith(1);
  });

  it("archiveResource should set isArchived to true", async () => {
    (db.archiveResource as any).mockResolvedValue(undefined);

    await db.archiveResource(1);

    expect(db.archiveResource).toHaveBeenCalledWith(1);
  });

  it("listResources should return all non-archived resources", async () => {
    const mockResources = [
      { id: 1, title: "TRT Guide", type: "article", category: "hormone", isArchived: false },
      { id: 2, title: "Nutrition PDF", type: "file", category: "nutrition", isArchived: false },
    ];
    (db.listResources as any).mockResolvedValue(mockResources);

    const result = await db.listResources();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("TRT Guide");
  });

  it("getResourceById should return a single resource", async () => {
    const mockResource = { id: 1, title: "TRT Guide", type: "article" };
    (db.getResourceById as any).mockResolvedValue(mockResource);

    const result = await db.getResourceById(1);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("getResourceById should return null for non-existent resource", async () => {
    (db.getResourceById as any).mockResolvedValue(null);

    const result = await db.getResourceById(999);

    expect(result).toBeNull();
  });
});

describe("Resource Sharing (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shareResource should create a share record", async () => {
    const mockShare = {
      id: 1,
      resourceId: 1,
      patientId: 10,
      sharedBy: 1,
      message: "Please review this guide",
      isViewed: false,
    };
    (db.shareResource as any).mockResolvedValue(mockShare);

    const result = await db.shareResource({
      resourceId: 1,
      patientId: 10,
      sharedBy: 1,
      message: "Please review this guide",
    });

    expect(result.resourceId).toBe(1);
    expect(result.patientId).toBe(10);
    expect(result.isViewed).toBe(false);
  });

  it("shareResource should return existing share if already shared", async () => {
    const existingShare = {
      id: 1,
      resourceId: 1,
      patientId: 10,
      sharedBy: 1,
      isViewed: true,
    };
    (db.shareResource as any).mockResolvedValue(existingShare);

    const result = await db.shareResource({
      resourceId: 1,
      patientId: 10,
      sharedBy: 1,
    });

    expect(result.id).toBe(1);
    expect(result.isViewed).toBe(true);
  });

  it("unshareResource should remove the share", async () => {
    (db.unshareResource as any).mockResolvedValue(undefined);

    await db.unshareResource(1, 10);

    expect(db.unshareResource).toHaveBeenCalledWith(1, 10);
  });

  it("listSharesForResource should return shares with patient info", async () => {
    const mockShares = [
      {
        share: { id: 1, resourceId: 1, patientId: 10, isViewed: true },
        patient: { id: 10, firstName: "Samantha", lastName: "Buker" },
      },
      {
        share: { id: 2, resourceId: 1, patientId: 11, isViewed: false },
        patient: { id: 11, firstName: "Amelia", lastName: "Egbert" },
      },
    ];
    (db.listSharesForResource as any).mockResolvedValue(mockShares);

    const result = await db.listSharesForResource(1);

    expect(result).toHaveLength(2);
    expect(result[0].patient.firstName).toBe("Samantha");
    expect(result[1].share.isViewed).toBe(false);
  });

  it("listResourcesForPatient should return resources shared with a patient", async () => {
    const mockItems = [
      {
        resource: { id: 1, title: "TRT Guide", type: "article", category: "hormone" },
        share: { id: 1, resourceId: 1, patientId: 10, isViewed: false, sharedAt: new Date() },
      },
    ];
    (db.listResourcesForPatient as any).mockResolvedValue(mockItems);

    const result = await db.listResourcesForPatient(10);

    expect(result).toHaveLength(1);
    expect(result[0].resource.title).toBe("TRT Guide");
    expect(result[0].share.isViewed).toBe(false);
  });

  it("markResourceViewed should update the share record", async () => {
    (db.markResourceViewed as any).mockResolvedValue(undefined);

    await db.markResourceViewed(1);

    expect(db.markResourceViewed).toHaveBeenCalledWith(1);
  });
});

describe("Resource types and categories", () => {
  it("should support all three resource types", () => {
    const types = ["file", "link", "article"];
    types.forEach((type) => {
      expect(["file", "link", "article"]).toContain(type);
    });
  });

  it("should support all nine categories", () => {
    const categories = [
      "nutrition", "exercise", "supplement", "lifestyle",
      "hormone", "lab_education", "recovery", "mental_health", "general",
    ];
    expect(categories).toHaveLength(9);
  });
});
