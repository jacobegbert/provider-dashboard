/**
 * seed-admin-password.mjs
 *
 * One-time script to create or update the admin (provider) account password.
 * Run with:
 *   node seed-admin-password.mjs
 *
 * You'll be prompted for an email and password. The script:
 *   1. Creates the user if they don't exist
 *   2. Sets their password hash
 *   3. Assigns the admin role
 */

import "dotenv/config";
import { createHash } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { createInterface } from "readline";
import { nanoid } from "nanoid";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set. Create a .env file first.");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("\n🔐  Black Label Medicine — Admin Account Setup\n");

  const email = await ask("Email: ");
  const password = await ask("Password (min 8 chars): ");
  const name = await ask("Name (e.g. Dr. Jacob Egbert): ");

  rl.close();

  if (password.length < 8) {
    console.error("❌  Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = createHash("sha256").update(password).digest("hex");
  const openId = nanoid();

  // Upsert user by email
  await db.execute(sql`
    INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, lastSignedIn)
    VALUES (${openId}, ${name.trim()}, ${email.trim().toLowerCase()}, ${passwordHash}, 'email', 'admin', NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      passwordHash = VALUES(passwordHash),
      role = 'admin',
      lastSignedIn = NOW()
  `);

  console.log(`\n✅  Admin account set for ${email}`);
  console.log("   You can now log in at /login with these credentials.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
