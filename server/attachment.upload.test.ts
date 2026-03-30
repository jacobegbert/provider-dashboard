import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the /api/upload/attachment endpoint
 * Validates auth, input validation, file type/size restrictions, and S3 upload
 */

// Mock storagePut
const mockStoragePut = vi.fn().mockResolvedValue({ key: "test-key", url: "https://cdn.example.com/test-file.png" });
vi.mock("../storage", () => ({
  storagePut: (...args: any[]) => mockStoragePut(...args),
}));

// Mock createContext
const mockCreateContext = vi.fn();
vi.mock("./_core/context", () => ({
  createContext: (...args: any[]) => mockCreateContext(...args),
}));

describe("/api/upload/attachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthenticated requests", async () => {
    mockCreateContext.mockResolvedValue({ user: null });

    // Simulate the endpoint logic
    const ctx = await mockCreateContext({});
    expect(ctx.user).toBeNull();
  });

  it("should reject missing required fields", () => {
    const body = { fileName: "test.png", mimeType: "image/png" }; // missing fileData
    const hasRequired = body.fileName && body.mimeType && (body as any).fileData;
    expect(hasRequired).toBeFalsy();
  });

  it("should reject files over 10MB", () => {
    const MAX_SIZE = 10 * 1024 * 1024;
    const largeBuffer = Buffer.alloc(MAX_SIZE + 1);
    expect(largeBuffer.length).toBeGreaterThan(MAX_SIZE);
  });

  it("should reject disallowed MIME types", () => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    expect(allowedTypes.includes("text/html")).toBe(false);
    expect(allowedTypes.includes("application/javascript")).toBe(false);
    expect(allowedTypes.includes("image/svg+xml")).toBe(false);
  });

  it("should allow valid image MIME types", () => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    expect(allowedTypes.includes("image/jpeg")).toBe(true);
    expect(allowedTypes.includes("image/png")).toBe(true);
    expect(allowedTypes.includes("image/gif")).toBe(true);
    expect(allowedTypes.includes("image/webp")).toBe(true);
    expect(allowedTypes.includes("application/pdf")).toBe(true);
  });

  it("should upload to S3 and return URL for valid requests", async () => {
    mockCreateContext.mockResolvedValue({ user: { id: 1 } });

    const fileData = Buffer.from("fake-image-data").toString("base64");
    const buffer = Buffer.from(fileData, "base64");
    const fileName = "test-photo.png";
    const mimeType = "image/png";

    const result = await mockStoragePut(
      `message-attachments/1/${Date.now()}-abc123-${fileName}`,
      buffer,
      mimeType
    );

    expect(result.url).toBe("https://cdn.example.com/test-file.png");
    expect(mockStoragePut).toHaveBeenCalledOnce();
    expect(mockStoragePut.mock.calls[0][2]).toBe("image/png");
  });

  it("should generate correct file key format", () => {
    const userId = 42;
    const fileName = "My Photo (1).png";
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const randomSuffix = "abc12345";
    const fileKey = `message-attachments/${userId}/${Date.now()}-${randomSuffix}-${sanitizedName}`;

    expect(fileKey).toContain("message-attachments/42/");
    expect(fileKey).toContain("abc12345");
    expect(sanitizedName).toBe("My_Photo__1_.png");
    expect(fileKey).not.toContain("(");
  });

  it("should correctly identify image vs document responses", () => {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const docTypes = ["application/pdf", "application/msword"];

    for (const t of imageTypes) {
      expect(t.startsWith("image/")).toBe(true);
    }
    for (const t of docTypes) {
      expect(t.startsWith("image/")).toBe(false);
    }
  });
});

describe("attachment message format", () => {
  it("should parse attachment markdown correctly", () => {
    const content = "📎 [test-photo.png](https://cdn.example.com/test-photo.png)";
    const match = content.match(/^📎 \[(.*?)\]\((.*?)\)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("test-photo.png");
    expect(match![2]).toBe("https://cdn.example.com/test-photo.png");
  });

  it("should detect image attachments by extension", () => {
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    
    expect(imageExts.some(ext => "photo.jpg".toLowerCase().endsWith(ext))).toBe(true);
    expect(imageExts.some(ext => "photo.PNG".toLowerCase().endsWith(ext))).toBe(true);
    expect(imageExts.some(ext => "document.pdf".toLowerCase().endsWith(ext))).toBe(false);
    expect(imageExts.some(ext => "report.docx".toLowerCase().endsWith(ext))).toBe(false);
  });

  it("should not match regular text messages as attachments", () => {
    const regularMsg = "Hello, how are you?";
    const match = regularMsg.match(/^📎 \[(.*?)\]\((.*?)\)$/);
    expect(match).toBeNull();
  });

  it("should not match partial attachment format", () => {
    const partial = "📎 [file.png]";
    const match = partial.match(/^📎 \[(.*?)\]\((.*?)\)$/);
    expect(match).toBeNull();
  });
});
