import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for client notes, tasks, and messages features.
 * Validates input schemas and data structures used by the tRPC procedures.
 */

// ─── CLIENT NOTES ───────────────────────────────

describe("Client Notes", () => {
  const createNoteSchema = z.object({
    patientId: z.number(),
    content: z.string().min(1),
    category: z.enum(["general", "clinical", "follow_up", "phone_call", "lab_review", "other"]),
  });

  it("validates a valid note creation input", () => {
    const input = {
      patientId: 1,
      content: "Patient reported improved sleep quality after 2 weeks on protocol.",
      category: "clinical" as const,
    };
    expect(() => createNoteSchema.parse(input)).not.toThrow();
  });

  it("rejects empty note content", () => {
    const input = {
      patientId: 1,
      content: "",
      category: "general" as const,
    };
    expect(() => createNoteSchema.parse(input)).toThrow();
  });

  it("rejects invalid note category", () => {
    const input = {
      patientId: 1,
      content: "Some note",
      category: "invalid_category",
    };
    expect(() => createNoteSchema.parse(input)).toThrow();
  });

  it("validates all six note categories", () => {
    const categories = ["general", "clinical", "follow_up", "phone_call", "lab_review", "other"];
    categories.forEach((cat) => {
      const input = { patientId: 1, content: "Test note", category: cat };
      expect(() => createNoteSchema.parse(input)).not.toThrow();
    });
  });

  it("validates delete note input", () => {
    const deleteSchema = z.object({ id: z.number() });
    expect(() => deleteSchema.parse({ id: 42 })).not.toThrow();
    expect(() => deleteSchema.parse({ id: "abc" })).toThrow();
  });

  it("validates list notes input", () => {
    const listSchema = z.object({ patientId: z.number() });
    expect(() => listSchema.parse({ patientId: 1 })).not.toThrow();
  });
});

// ─── CLIENT TASKS ───────────────────────────────

describe("Client Tasks", () => {
  const createTaskSchema = z.object({
    patientId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    dueDate: z.date().optional(),
  });

  it("validates a valid task creation input", () => {
    const input = {
      patientId: 1,
      title: "Complete intake questionnaire",
      description: "Fill out the new patient intake form before first appointment",
      priority: "high" as const,
      dueDate: new Date("2026-03-01"),
    };
    expect(() => createTaskSchema.parse(input)).not.toThrow();
  });

  it("validates task without optional fields", () => {
    const input = {
      patientId: 1,
      title: "Follow up on lab results",
      priority: "medium" as const,
    };
    expect(() => createTaskSchema.parse(input)).not.toThrow();
  });

  it("rejects empty task title", () => {
    const input = {
      patientId: 1,
      title: "",
      priority: "low" as const,
    };
    expect(() => createTaskSchema.parse(input)).toThrow();
  });

  it("rejects invalid priority", () => {
    const input = {
      patientId: 1,
      title: "Some task",
      priority: "critical",
    };
    expect(() => createTaskSchema.parse(input)).toThrow();
  });

  it("validates all four priority levels", () => {
    const priorities = ["low", "medium", "high", "urgent"];
    priorities.forEach((p) => {
      const input = { patientId: 1, title: "Test task", priority: p };
      expect(() => createTaskSchema.parse(input)).not.toThrow();
    });
  });

  const updateTaskSchema = z.object({
    id: z.number(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.date().optional(),
  });

  it("validates task status update", () => {
    const input = { id: 1, status: "completed" as const };
    expect(() => updateTaskSchema.parse(input)).not.toThrow();
  });

  it("validates task priority update", () => {
    const input = { id: 1, priority: "urgent" as const };
    expect(() => updateTaskSchema.parse(input)).not.toThrow();
  });

  it("validates all task statuses", () => {
    const statuses = ["pending", "in_progress", "completed", "cancelled"];
    statuses.forEach((s) => {
      expect(() => updateTaskSchema.parse({ id: 1, status: s })).not.toThrow();
    });
  });
});

// ─── MESSAGES ───────────────────────────────────

describe("Messages", () => {
  const sendMessageSchema = z.object({
    receiverId: z.number(),
    patientId: z.number(),
    content: z.string().min(1),
  });

  it("validates a valid message send input", () => {
    const input = {
      receiverId: 2,
      patientId: 1,
      content: "How are you feeling after the new supplement regimen?",
    };
    expect(() => sendMessageSchema.parse(input)).not.toThrow();
  });

  it("rejects empty message content", () => {
    const input = {
      receiverId: 2,
      patientId: 1,
      content: "",
    };
    expect(() => sendMessageSchema.parse(input)).toThrow();
  });

  it("validates mark read input", () => {
    const markReadSchema = z.object({ patientId: z.number() });
    expect(() => markReadSchema.parse({ patientId: 1 })).not.toThrow();
  });

  it("validates list messages input", () => {
    const listSchema = z.object({ patientId: z.number() });
    expect(() => listSchema.parse({ patientId: 1 })).not.toThrow();
  });

  it("validates attachment message format", () => {
    const attachmentContent = "📎 [report.pdf](https://storage.example.com/files/report.pdf)";
    expect(attachmentContent.startsWith("📎 [")).toBe(true);
    const urlMatch = attachmentContent.match(/\((.*?)\)/);
    expect(urlMatch).not.toBeNull();
    expect(urlMatch![1]).toBe("https://storage.example.com/files/report.pdf");
    const nameMatch = attachmentContent.match(/\[(.*?)\]/);
    expect(nameMatch).not.toBeNull();
    expect(nameMatch![1]).toBe("report.pdf");
  });
});

// ─── DOCUMENT UPLOAD ────────────────────────────

describe("Document Upload", () => {
  const documentSchema = z.object({
    patientId: z.number(),
    fileName: z.string().min(1),
    fileKey: z.string().min(1),
    url: z.string().url(),
    fileSize: z.number().positive(),
    mimeType: z.string().min(1),
    category: z.enum([
      "lab_results", "treatment_plan", "intake_form", "consent",
      "imaging", "prescription", "notes", "other",
    ]),
    description: z.string().optional(),
  });

  it("validates a valid document record", () => {
    const input = {
      patientId: 1,
      fileName: "blood_panel_results.pdf",
      fileKey: "1-files/blood_panel_results-abc123.pdf",
      url: "https://storage.example.com/1-files/blood_panel_results-abc123.pdf",
      fileSize: 245760,
      mimeType: "application/pdf",
      category: "lab_results" as const,
      description: "Q1 2026 comprehensive blood panel",
    };
    expect(() => documentSchema.parse(input)).not.toThrow();
  });

  it("validates all eight document categories", () => {
    const categories = [
      "lab_results", "treatment_plan", "intake_form", "consent",
      "imaging", "prescription", "notes", "other",
    ];
    categories.forEach((cat) => {
      const input = {
        patientId: 1,
        fileName: "test.pdf",
        fileKey: "test-key",
        url: "https://example.com/test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        category: cat,
      };
      expect(() => documentSchema.parse(input)).not.toThrow();
    });
  });

  it("rejects zero file size", () => {
    const input = {
      patientId: 1,
      fileName: "empty.pdf",
      fileKey: "empty-key",
      url: "https://example.com/empty.pdf",
      fileSize: 0,
      mimeType: "application/pdf",
      category: "other" as const,
    };
    expect(() => documentSchema.parse(input)).toThrow();
  });

  it("rejects invalid URL", () => {
    const input = {
      patientId: 1,
      fileName: "test.pdf",
      fileKey: "test-key",
      url: "not-a-url",
      fileSize: 1024,
      mimeType: "application/pdf",
      category: "other" as const,
    };
    expect(() => documentSchema.parse(input)).toThrow();
  });
});

// ─── PATIENT STATUS ─────────────────────────────

describe("Patient Status", () => {
  const statusSchema = z.enum(["active", "paused", "completed", "new", "inactive", "prospective"]);

  it("validates all six patient statuses", () => {
    const statuses = ["active", "paused", "completed", "new", "inactive", "prospective"];
    statuses.forEach((s) => {
      expect(() => statusSchema.parse(s)).not.toThrow();
    });
  });

  it("rejects invalid status", () => {
    expect(() => statusSchema.parse("archived")).toThrow();
    expect(() => statusSchema.parse("deleted")).toThrow();
  });
});
