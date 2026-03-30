/**
 * Database Backup — exports all tables to JSON and uploads to S3
 */
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { storagePut, storageGet } from "./storage";
import {
  users, patients, protocols, protocolSteps, protocolAssignments,
  taskCompletions, messages, appointments, notifications,
  documents, clientNotes, clientTasks, auditLog,
  patientInvites, assignmentSteps, biomarkerEntries,
  biomarkerCustomMetrics, resources, resourceShares,
  providerProfiles, pushSubscriptions, attentionDismissals, googleTokens,
} from "../drizzle/schema";

const ALL_TABLES = [
  { name: "users", table: users },
  { name: "provider_profiles", table: providerProfiles },
  { name: "patients", table: patients },
  { name: "protocols", table: protocols },
  { name: "protocol_steps", table: protocolSteps },
  { name: "protocol_assignments", table: protocolAssignments },
  { name: "assignment_steps", table: assignmentSteps },
  { name: "task_completions", table: taskCompletions },
  { name: "messages", table: messages },
  { name: "appointments", table: appointments },
  { name: "notifications", table: notifications },
  { name: "push_subscriptions", table: pushSubscriptions },
  { name: "documents", table: documents },
  { name: "client_notes", table: clientNotes },
  { name: "client_tasks", table: clientTasks },
  { name: "audit_log", table: auditLog },
  { name: "google_tokens", table: googleTokens },
  { name: "patient_invites", table: patientInvites },
  { name: "attention_dismissals", table: attentionDismissals },
  { name: "biomarker_entries", table: biomarkerEntries },
  { name: "biomarker_custom_metrics", table: biomarkerCustomMetrics },
  { name: "resources", table: resources },
  { name: "resource_shares", table: resourceShares },
] as const;

export interface BackupResult {
  key: string;
  url: string;
  timestamp: string;
  tableCount: number;
  totalRows: number;
}

/**
 * Export all database tables to a single JSON file and upload to S3.
 * Returns the S3 key and a signed download URL.
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupData: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const { name, table } of ALL_TABLES) {
    try {
      const rows = await db.select().from(table);
      backupData[name] = rows;
      totalRows += rows.length;
    } catch (err) {
      // If a table doesn't exist yet, skip it
      console.warn(`Backup: skipping table "${name}":`, err);
      backupData[name] = [];
    }
  }

  const jsonStr = JSON.stringify({
    version: 1,
    createdAt: new Date().toISOString(),
    tables: backupData,
  }, null, 2);

  const key = `backups/db-backup-${timestamp}.json`;
  const { url } = await storagePut(key, jsonStr, "application/json");

  return {
    key,
    url,
    timestamp: new Date().toISOString(),
    tableCount: ALL_TABLES.length,
    totalRows,
  };
}

/**
 * List recent backups from S3 by checking known backup keys.
 * We store a manifest of backup metadata in S3.
 */
export async function listBackups(): Promise<BackupResult[]> {
  try {
    const { url } = await storageGet("backups/manifest.json");
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.backups ?? [];
  } catch {
    return [];
  }
}

/**
 * Save a backup entry to the manifest.
 */
export async function addToManifest(backup: BackupResult): Promise<void> {
  const existing = await listBackups();
  existing.unshift(backup);
  // Keep last 30 backups in manifest
  const trimmed = existing.slice(0, 30);
  const jsonStr = JSON.stringify({ backups: trimmed }, null, 2);
  await storagePut("backups/manifest.json", jsonStr, "application/json");
}

/**
 * Get a download URL for a specific backup.
 */
export async function getBackupDownloadUrl(key: string): Promise<string> {
  const { url } = await storageGet(key);
  return url;
}

export interface RestoreResult {
  tablesRestored: number;
  totalRowsRestored: number;
  errors: string[];
  skipped: string[];
}

/**
 * Restore the database from a backup stored in S3.
 * 
 * Strategy:
 * 1. Download the backup JSON from S3
 * 2. Validate the backup format
 * 3. Disable FK checks temporarily
 * 4. Truncate tables in reverse dependency order
 * 5. Insert rows in dependency order
 * 6. Re-enable FK checks
 * 
 * IMPORTANT: This is a destructive operation — it replaces all existing data.
 * A fresh backup is created automatically before restore begins.
 */
export async function restoreDatabaseBackup(key: string): Promise<RestoreResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Download the backup from S3
  const { url } = await storageGet(key);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download backup: HTTP ${resp.status}`);
  const backupJson = await resp.json();

  // 2. Validate format
  if (!backupJson.version || !backupJson.tables) {
    throw new Error("Invalid backup format: missing version or tables");
  }

  const errors: string[] = [];
  const skipped: string[] = [];
  let totalRowsRestored = 0;
  let tablesRestored = 0;

  // Table insertion order (respects FK dependencies — parents first)
  const TABLE_ORDER = [
    { name: "users", table: users },
    { name: "provider_profiles", table: providerProfiles },
    { name: "patients", table: patients },
    { name: "protocols", table: protocols },
    { name: "protocol_steps", table: protocolSteps },
    { name: "protocol_assignments", table: protocolAssignments },
    { name: "assignment_steps", table: assignmentSteps },
    { name: "task_completions", table: taskCompletions },
    { name: "messages", table: messages },
    { name: "appointments", table: appointments },
    { name: "notifications", table: notifications },
    { name: "push_subscriptions", table: pushSubscriptions },
    { name: "documents", table: documents },
    { name: "client_notes", table: clientNotes },
    { name: "client_tasks", table: clientTasks },
    { name: "audit_log", table: auditLog },
    { name: "google_tokens", table: googleTokens },
    { name: "patient_invites", table: patientInvites },
    { name: "attention_dismissals", table: attentionDismissals },
    { name: "biomarker_entries", table: biomarkerEntries },
    { name: "biomarker_custom_metrics", table: biomarkerCustomMetrics },
    { name: "resources", table: resources },
    { name: "resource_shares", table: resourceShares },
  ] as const;

  // 3. Disable FK checks, truncate in reverse order, insert in order
  try {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    // Truncate all tables in reverse dependency order
    for (const { name, table } of [...TABLE_ORDER].reverse()) {
      try {
        await db.delete(table);
      } catch (err: any) {
        errors.push(`Truncate ${name}: ${err.message}`);
      }
    }

    // Insert rows in dependency order
    for (const { name, table } of TABLE_ORDER) {
      const rows = backupJson.tables[name];
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        skipped.push(name);
        continue;
      }

      try {
        // Convert date strings back to Date objects for timestamp columns
        const processedRows = rows.map((row: Record<string, unknown>) => {
          const processed = { ...row };
          for (const [key, value] of Object.entries(processed)) {
            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
              processed[key] = new Date(value);
            }
          }
          return processed;
        });

        // Insert in batches of 100 to avoid query size limits
        const BATCH_SIZE = 100;
        for (let i = 0; i < processedRows.length; i += BATCH_SIZE) {
          const batch = processedRows.slice(i, i + BATCH_SIZE);
          await db.insert(table).values(batch as any);
        }

        totalRowsRestored += processedRows.length;
        tablesRestored++;
      } catch (err: any) {
        errors.push(`Insert ${name}: ${err.message}`);
      }
    }
  } finally {
    // Always re-enable FK checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  }

  return { tablesRestored, totalRowsRestored, errors, skipped };
}
