import { describe, it, expect } from "vitest";
import { normalizePhone } from "./sms";

describe("normalizePhone", () => {
  // ─── US 10-digit numbers (most common in the database) ───
  it("should normalize a bare 10-digit US number", () => {
    expect(normalizePhone("8016886538")).toBe("+18016886538");
  });

  it("should normalize a 10-digit number with dashes", () => {
    expect(normalizePhone("801-688-6538")).toBe("+18016886538");
  });

  it("should normalize a 10-digit number with parentheses and spaces", () => {
    expect(normalizePhone("(801) 688-6538")).toBe("+18016886538");
  });

  it("should normalize a 10-digit number with spaces", () => {
    expect(normalizePhone("801 688 6538")).toBe("+18016886538");
  });

  it("should normalize a 10-digit number with dots", () => {
    expect(normalizePhone("801.688.6538")).toBe("+18016886538");
  });

  // ─── US 11-digit numbers (with country code 1) ───
  it("should normalize an 11-digit US number starting with 1", () => {
    expect(normalizePhone("18016886538")).toBe("+18016886538");
  });

  it("should normalize an 11-digit US number with dashes", () => {
    expect(normalizePhone("1-801-688-6538")).toBe("+18016886538");
  });

  // ─── Already E.164 formatted ───
  it("should pass through a valid E.164 number unchanged", () => {
    expect(normalizePhone("+18016886538")).toBe("+18016886538");
  });

  it("should pass through a valid international E.164 number", () => {
    expect(normalizePhone("+447911123456")).toBe("+447911123456");
  });

  // ─── All patient numbers from the database ───
  it("should normalize Amelia Egbert's number: 5094294894", () => {
    expect(normalizePhone("5094294894")).toBe("+15094294894");
  });

  it("should normalize Jacob Egbert's number: 4359388657", () => {
    expect(normalizePhone("4359388657")).toBe("+14359388657");
  });

  it("should normalize David Fajardo's number: 7025750356", () => {
    expect(normalizePhone("7025750356")).toBe("+17025750356");
  });

  it("should normalize Jordan Jones's number: 8016886538", () => {
    expect(normalizePhone("8016886538")).toBe("+18016886538");
  });

  // ─── Edge cases ───
  it("should return null for empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("should return null for too-short number", () => {
    expect(normalizePhone("12345")).toBeNull();
  });

  it("should return null for too-long number", () => {
    expect(normalizePhone("1234567890123456")).toBeNull();
  });

  it("should handle number with leading/trailing whitespace", () => {
    expect(normalizePhone("  8016886538  ")).toBe("+18016886538");
  });
});
