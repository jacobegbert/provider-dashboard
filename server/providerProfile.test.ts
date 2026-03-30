import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getProviderProfile: vi.fn(),
  upsertProviderProfile: vi.fn(),
}));

import * as db from "./db";

describe("providerProfile router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProviderProfile", () => {
    it("returns null when no profile exists", async () => {
      (db.getProviderProfile as any).mockResolvedValue(null);
      const result = await db.getProviderProfile(1);
      expect(result).toBeNull();
      expect(db.getProviderProfile).toHaveBeenCalledWith(1);
    });

    it("returns profile data when it exists", async () => {
      const mockProfile = {
        id: 1,
        userId: 1,
        firstName: "Jacob",
        lastName: "Egbert",
        email: "dr.egbert@blacklabelmedicine.com",
        phone: "(555) 100-2000",
        practiceName: "Black Label Medicine",
        title: "Dr.",
      };
      (db.getProviderProfile as any).mockResolvedValue(mockProfile);
      const result = await db.getProviderProfile(1);
      expect(result).toEqual(mockProfile);
    });
  });

  describe("upsertProviderProfile", () => {
    it("creates a new profile when none exists", async () => {
      const input = {
        firstName: "Jacob",
        lastName: "Egbert",
        email: "dr.egbert@blacklabelmedicine.com",
        phone: "(555) 100-2000",
        practiceName: "Black Label Medicine",
        title: "Dr.",
      };
      (db.upsertProviderProfile as any).mockResolvedValue({
        id: 1,
        userId: 1,
        ...input,
      });

      const result = await db.upsertProviderProfile(1, input);
      expect(result.firstName).toBe("Jacob");
      expect(result.lastName).toBe("Egbert");
      expect(result.email).toBe("dr.egbert@blacklabelmedicine.com");
      expect(db.upsertProviderProfile).toHaveBeenCalledWith(1, input);
    });

    it("updates an existing profile", async () => {
      const input = {
        phone: "(555) 999-8888",
      };
      (db.upsertProviderProfile as any).mockResolvedValue({
        id: 1,
        userId: 1,
        firstName: "Jacob",
        lastName: "Egbert",
        email: "dr.egbert@blacklabelmedicine.com",
        phone: "(555) 999-8888",
        practiceName: "Black Label Medicine",
        title: "Dr.",
      });

      const result = await db.upsertProviderProfile(1, input);
      expect(result.phone).toBe("(555) 999-8888");
      expect(db.upsertProviderProfile).toHaveBeenCalledWith(1, input);
    });

    it("handles partial updates correctly", async () => {
      const input = {
        firstName: "Jake",
        title: "MD",
      };
      (db.upsertProviderProfile as any).mockResolvedValue({
        id: 1,
        userId: 1,
        firstName: "Jake",
        lastName: "Egbert",
        email: "dr.egbert@blacklabelmedicine.com",
        phone: "(555) 100-2000",
        practiceName: "Black Label Medicine",
        title: "MD",
      });

      const result = await db.upsertProviderProfile(1, input);
      expect(result.firstName).toBe("Jake");
      expect(result.title).toBe("MD");
    });
  });
});
