import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createDrizzleStore } from "./drizzleStore";
import { createMemoryStore } from "./memory";
import { ensureSeed } from "./seed";
import { createPortalService, type PortalService } from "./service";
import type { PortalStore } from "./types";

let store: PortalStore | null = null;
let service: PortalService | null = null;

export function getStore() {
  if (!store) throw new Error("Portal store is not initialized");
  return store;
}

export function getService() {
  if (!service) throw new Error("Portal service is not initialized");
  return service;
}

function bind(next: PortalStore) {
  store = next;
  service = createPortalService(next);
  return next;
}

export async function initStore() {
  if (store && service) return store;
  const url = process.env.DATABASE_URL;
  if (url) {
    const db = drizzle(url);
    await db.execute(sql`select 1`);
    const next = createDrizzleStore(db);
    await ensureSeed(next);
    return bind(next);
  }
  console.warn("[portal] DATABASE_URL is not set. Using the in-memory demo store. Do not enter real patient information.");
  const next = createMemoryStore();
  await ensureSeed(next);
  return bind(next);
}

export async function resetStoreForTests() {
  const next = createMemoryStore();
  await ensureSeed(next);
  bind(next);
  return { store: next, service: getService() };
}
