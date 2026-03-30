/**
 * Migration: Add database indexes on foreign key columns and FK constraints
 * 
 * This migration adds:
 * 1. Indexes on all foreign key columns for query performance
 * 2. Foreign key constraints for referential integrity
 * 
 * Run with: node server/migrations/add-indexes-and-fks.mjs
 */

import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Parse DATABASE_URL for mysql2
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port) || 4000,
    user: u.username,
    password: decodeURIComponent(u.password),
    database: u.pathname.replace("/", ""),
    ssl: { rejectUnauthorized: true },
  };
}

async function main() {
  const mysql = await import("mysql2/promise");
  const config = parseDbUrl(DATABASE_URL);
  const conn = await mysql.createConnection(config);

  console.log("Connected to database. Running migration...\n");

  // ─── INDEXES ────────────────────────────────────
  // Each entry: [table, column(s), indexName]
  const indexes = [
    // patients
    ["patients", "providerId", "idx_patients_providerId"],
    ["patients", "userId", "idx_patients_userId"],
    ["patients", "deletedAt", "idx_patients_deletedAt"],
    ["patients", "status", "idx_patients_status"],
    
    // provider_profiles
    // userId already has UNIQUE index
    
    // protocols
    ["protocols", "createdBy", "idx_protocols_createdBy"],
    
    // protocol_steps
    ["protocol_steps", "protocolId", "idx_protocol_steps_protocolId"],
    
    // protocol_assignments
    ["protocol_assignments", "patientId", "idx_assignments_patientId"],
    ["protocol_assignments", "protocolId", "idx_assignments_protocolId"],
    ["protocol_assignments", "assignedBy", "idx_assignments_assignedBy"],
    ["protocol_assignments", "status", "idx_assignments_status"],
    
    // task_completions
    ["task_completions", "assignmentId", "idx_completions_assignmentId"],
    ["task_completions", "stepId", "idx_completions_stepId"],
    ["task_completions", "patientId", "idx_completions_patientId"],
    ["task_completions", "taskDate", "idx_completions_taskDate"],
    
    // messages
    ["messages", "senderId", "idx_messages_senderId"],
    ["messages", "receiverId", "idx_messages_receiverId"],
    ["messages", "patientId", "idx_messages_patientId"],
    
    // appointments
    ["appointments", "patientId", "idx_appointments_patientId"],
    ["appointments", "providerId", "idx_appointments_providerId"],
    ["appointments", "scheduledAt", "idx_appointments_scheduledAt"],
    ["appointments", "status", "idx_appointments_status"],
    
    // notifications
    ["notifications", "userId", "idx_notifications_userId"],
    ["notifications", "isRead", "idx_notifications_isRead"],
    
    // push_subscriptions
    ["push_subscriptions", "userId", "idx_push_subscriptions_userId"],
    
    // documents
    ["documents", "patientId", "idx_documents_patientId"],
    ["documents", "uploadedBy", "idx_documents_uploadedBy"],
    
    // client_notes
    ["client_notes", "patientId", "idx_client_notes_patientId"],
    ["client_notes", "authorId", "idx_client_notes_authorId"],
    
    // client_tasks
    ["client_tasks", "patientId", "idx_client_tasks_patientId"],
    ["client_tasks", "assignedBy", "idx_client_tasks_assignedBy"],
    
    // audit_log
    ["audit_log", "userId", "idx_audit_log_userId"],
    ["audit_log", "entityType", "idx_audit_log_entityType"],
    ["audit_log", "createdAt", "idx_audit_log_createdAt"],
    
    // google_tokens
    // userId already has UNIQUE index
    
    // patient_invites
    ["patient_invites", "patientId", "idx_invites_patientId"],
    ["patient_invites", "createdByUserId", "idx_invites_createdByUserId"],
    
    // attention_dismissals
    ["attention_dismissals", "userId", "idx_attn_dismiss_userId"],
    
    // assignment_steps
    ["assignment_steps", "assignmentId", "idx_assignment_steps_assignmentId"],
    ["assignment_steps", "sourceStepId", "idx_assignment_steps_sourceStepId"],
    
    // biomarker_entries
    ["biomarker_entries", "patientId", "idx_biomarker_entries_patientId"],
    
    // biomarker_custom_metrics
    ["biomarker_custom_metrics", "patientId", "idx_biomarker_custom_metrics_patientId"],
    
    // resources
    ["resources", "createdBy", "idx_resources_createdBy"],
    
    // resource_shares
    ["resource_shares", "resourceId", "idx_resource_shares_resourceId"],
    ["resource_shares", "patientId", "idx_resource_shares_patientId"],
    ["resource_shares", "sharedBy", "idx_resource_shares_sharedBy"],
  ];

  console.log("=== Adding Indexes ===\n");
  for (const [table, column, indexName] of indexes) {
    try {
      // Check if index already exists
      const [existing] = await conn.query(
        `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
        [indexName]
      );
      if (existing.length > 0) {
        console.log(`  [SKIP] ${indexName} already exists`);
        continue;
      }
      await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (\`${column}\`)`);
      console.log(`  [OK]   ${indexName} on ${table}(${column})`);
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME" || err.message?.includes("Duplicate")) {
        console.log(`  [SKIP] ${indexName} already exists`);
      } else {
        console.error(`  [ERR]  ${indexName}: ${err.message}`);
      }
    }
  }

  // ─── FOREIGN KEY CONSTRAINTS ────────────────────
  // Each entry: [table, column, refTable, refColumn, fkName, onDelete]
  const foreignKeys = [
    // patients
    ["patients", "providerId", "users", "id", "fk_patients_providerId", "CASCADE"],
    ["patients", "userId", "users", "id", "fk_patients_userId", "SET NULL"],
    
    // provider_profiles
    ["provider_profiles", "userId", "users", "id", "fk_provider_profiles_userId", "CASCADE"],
    
    // protocols
    ["protocols", "createdBy", "users", "id", "fk_protocols_createdBy", "CASCADE"],
    
    // protocol_steps
    ["protocol_steps", "protocolId", "protocols", "id", "fk_protocol_steps_protocolId", "CASCADE"],
    
    // protocol_assignments
    ["protocol_assignments", "patientId", "patients", "id", "fk_assignments_patientId", "CASCADE"],
    ["protocol_assignments", "protocolId", "protocols", "id", "fk_assignments_protocolId", "CASCADE"],
    ["protocol_assignments", "assignedBy", "users", "id", "fk_assignments_assignedBy", "CASCADE"],
    
    // task_completions
    ["task_completions", "assignmentId", "protocol_assignments", "id", "fk_completions_assignmentId", "CASCADE"],
    ["task_completions", "patientId", "patients", "id", "fk_completions_patientId", "CASCADE"],
    
    // messages
    ["messages", "senderId", "users", "id", "fk_messages_senderId", "CASCADE"],
    ["messages", "receiverId", "users", "id", "fk_messages_receiverId", "CASCADE"],
    ["messages", "patientId", "patients", "id", "fk_messages_patientId", "CASCADE"],
    
    // appointments
    ["appointments", "patientId", "patients", "id", "fk_appointments_patientId", "CASCADE"],
    ["appointments", "providerId", "users", "id", "fk_appointments_providerId", "CASCADE"],
    ["appointments", "createdBy", "users", "id", "fk_appointments_createdBy", "CASCADE"],
    
    // notifications
    ["notifications", "userId", "users", "id", "fk_notifications_userId", "CASCADE"],
    
    // push_subscriptions
    ["push_subscriptions", "userId", "users", "id", "fk_push_subscriptions_userId", "CASCADE"],
    
    // documents
    ["documents", "patientId", "patients", "id", "fk_documents_patientId", "CASCADE"],
    ["documents", "uploadedBy", "users", "id", "fk_documents_uploadedBy", "CASCADE"],
    
    // client_notes
    ["client_notes", "patientId", "patients", "id", "fk_client_notes_patientId", "CASCADE"],
    ["client_notes", "authorId", "users", "id", "fk_client_notes_authorId", "CASCADE"],
    
    // client_tasks
    ["client_tasks", "patientId", "patients", "id", "fk_client_tasks_patientId", "CASCADE"],
    ["client_tasks", "assignedBy", "users", "id", "fk_client_tasks_assignedBy", "CASCADE"],
    
    // audit_log
    ["audit_log", "userId", "users", "id", "fk_audit_log_userId", "CASCADE"],
    
    // google_tokens
    ["google_tokens", "userId", "users", "id", "fk_google_tokens_userId", "CASCADE"],
    
    // patient_invites
    ["patient_invites", "patientId", "patients", "id", "fk_invites_patientId", "CASCADE"],
    ["patient_invites", "createdByUserId", "users", "id", "fk_invites_createdByUserId", "CASCADE"],
    
    // attention_dismissals
    ["attention_dismissals", "userId", "users", "id", "fk_attn_dismiss_userId", "CASCADE"],
    
    // assignment_steps
    ["assignment_steps", "assignmentId", "protocol_assignments", "id", "fk_assignment_steps_assignmentId", "CASCADE"],
    
    // biomarker_entries
    ["biomarker_entries", "patientId", "patients", "id", "fk_biomarker_entries_patientId", "CASCADE"],
    
    // biomarker_custom_metrics
    ["biomarker_custom_metrics", "patientId", "patients", "id", "fk_biomarker_custom_metrics_patientId", "CASCADE"],
    
    // resources
    ["resources", "createdBy", "users", "id", "fk_resources_createdBy", "CASCADE"],
    
    // resource_shares
    ["resource_shares", "resourceId", "resources", "id", "fk_resource_shares_resourceId", "CASCADE"],
    ["resource_shares", "patientId", "patients", "id", "fk_resource_shares_patientId", "CASCADE"],
    ["resource_shares", "sharedBy", "users", "id", "fk_resource_shares_sharedBy", "CASCADE"],
  ];

  console.log("\n=== Adding Foreign Key Constraints ===\n");
  for (const [table, column, refTable, refColumn, fkName, onDelete] of foreignKeys) {
    try {
      // Check if FK already exists
      const [existing] = await conn.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [table, fkName]
      );
      if (existing.length > 0) {
        console.log(`  [SKIP] ${fkName} already exists`);
        continue;
      }
      await conn.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` 
         FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\`(\`${refColumn}\`) 
         ON DELETE ${onDelete}`
      );
      console.log(`  [OK]   ${fkName}: ${table}(${column}) -> ${refTable}(${refColumn}) ON DELETE ${onDelete}`);
    } catch (err) {
      if (err.message?.includes("Duplicate") || err.message?.includes("already exists")) {
        console.log(`  [SKIP] ${fkName} already exists`);
      } else {
        console.error(`  [ERR]  ${fkName}: ${err.message}`);
      }
    }
  }

  // ─── COMPOSITE INDEXES for common queries ──────
  console.log("\n=== Adding Composite Indexes ===\n");
  const compositeIndexes = [
    // Fast lookup: task completions by assignment + date
    ["task_completions", "assignmentId, taskDate", "idx_completions_assignment_date"],
    // Fast lookup: messages by patient + read status
    ["messages", "patientId, isRead", "idx_messages_patient_read"],
    // Fast lookup: notifications by user + read status
    ["notifications", "userId, isRead", "idx_notifications_user_read"],
    // Fast lookup: attention dismissals by user + itemKey
    ["attention_dismissals", "userId, itemKey", "idx_attn_dismiss_user_item"],
    // Fast lookup: resource shares by patient
    ["resource_shares", "patientId, resourceId", "idx_resource_shares_patient_resource"],
  ];

  for (const [table, columns, indexName] of compositeIndexes) {
    try {
      const [existing] = await conn.query(
        `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
        [indexName]
      );
      if (existing.length > 0) {
        console.log(`  [SKIP] ${indexName} already exists`);
        continue;
      }
      await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
      console.log(`  [OK]   ${indexName} on ${table}(${columns})`);
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME" || err.message?.includes("Duplicate")) {
        console.log(`  [SKIP] ${indexName} already exists`);
      } else {
        console.error(`  [ERR]  ${indexName}: ${err.message}`);
      }
    }
  }

  console.log("\n✅ Migration complete!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
