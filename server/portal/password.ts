import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Salted SHA-256. 32 hex chars of salt + 64 hex chars of digest. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(salt + password).digest("hex");
  return salt + digest;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  let inputHash: string;
  if (stored.length > 64) {
    const salt = stored.slice(0, 32);
    inputHash = salt + createHash("sha256").update(salt + password).digest("hex");
  } else {
    inputHash = createHash("sha256").update(password).digest("hex");
  }
  const storedBuf = Buffer.from(stored, "hex");
  const inputBuf = Buffer.from(inputHash, "hex");
  if (storedBuf.length === 0 || storedBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(storedBuf, inputBuf);
}
