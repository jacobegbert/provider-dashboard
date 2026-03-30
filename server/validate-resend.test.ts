import { describe, it, expect } from "vitest";

describe("Resend API key validation", () => {
  it("should have a valid RESEND_API_KEY that can reach the Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — skipping validation");
      return;
    }

    // Use Resend's domains endpoint as a lightweight validation check
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    // 200 = valid key, 401 = invalid key
    expect(res.status).not.toBe(401);
    console.log("Resend API key is valid. Status:", res.status);
  });

  it("should have a valid TWILIO_ACCOUNT_SID format if set", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    if (!sid) {
      console.warn("TWILIO_ACCOUNT_SID not set — skipping validation");
      return;
    }
    // Twilio Account SIDs start with "AC"
    expect(sid.startsWith("AC")).toBe(true);
    expect(sid.length).toBe(34);
  });
});
