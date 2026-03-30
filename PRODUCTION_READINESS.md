# Production Readiness Audit — Provider Dashboard

**Audit Date:** February 19, 2026  
**Application:** Black Label Medicine — Provider Management Portal  
**Codebase:** ~28,000 lines across 26 pages, 23 database tables, 25 test files (262 tests)

---

## Current State Summary

The application is a substantial, feature-rich concierge medicine platform with dual portals (provider + patient), protocol management, messaging, scheduling, biomarkers, AI advisor, resource library, invite system, and database backups. The architecture (tRPC + React + Drizzle ORM + TiDB) is sound. However, several gaps need to be addressed before relying on this for real patient operations at scale.

---

## Priority 1 — CRITICAL (Fix Before Going Live)

These issues could cause data leaks, data loss, or broken workflows with real patients.

### 1.1 Patient-Side Data Isolation (Security)

**Problem:** Most procedures that accept a `patientId` input use `protectedProcedure` (any logged-in user) but do not verify that the requesting user actually owns that patient record. A logged-in patient could call `trpc.assignment.listForPatient({ patientId: 999 })` and access another patient's protocols, messages, appointments, documents, notes, tasks, and biomarkers.

**Affected procedures:** `assignment.listForPatient`, `message.listForPatient`, `message.send`, `appointment.listForPatient`, `document.listForPatient`, `clientNote.list`, `clientTask.list`, `biomarker.listEntries`, `biomarker.addEntry`, `resource.listForPatient`, and others.

**Fix:** Add an ownership check at the start of every patient-facing procedure:
```ts
// For patient users: verify they can only access their own data
if (ctx.user.role !== 'admin') {
  const myPatient = await db.getPatientByUserId(ctx.user.id);
  if (!myPatient || myPatient.id !== input.patientId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}
```

**Effort:** Medium — systematic but straightforward. Affects ~20 procedures.

### 1.2 Missing Database Indexes (Performance)

**Problem:** No indexes exist on frequently queried foreign key columns. With 30+ patients, queries that join on `patientId`, `protocolId`, `assignmentId`, or `userId` will degrade. At 100+ patients with active protocols, this becomes noticeable.

**Key columns needing indexes:**
- `patients.userId`, `patients.providerId`
- `protocol_assignments.patientId`, `protocol_assignments.protocolId`
- `assignment_steps.assignmentId`
- `messages.patientId`, `messages.senderId`
- `appointments.patientId`
- `biomarker_entries.patientId`
- `notifications.userId`
- `documents.patientId`
- `client_notes.patientId`
- `client_tasks.patientId`

**Effort:** Low — add indexes in schema.ts and run `pnpm db:push`.

### 1.3 No Foreign Key Constraints (Data Integrity)

**Problem:** The schema defines relationships through Drizzle's `relations()` but does not enforce actual foreign key constraints at the database level. This means orphaned records can accumulate (e.g., deleting a patient leaves their messages, appointments, and assignments behind with no parent).

**Fix:** Add `.references(() => patients.id)` with appropriate `onDelete` behavior to all foreign key columns. Use `cascade` for child records that should be deleted with the parent, and `set null` for records that should survive.

**Effort:** Medium — requires careful planning of cascade behavior per table.

### 1.4 Backup Restore Procedure (Data Recovery)

**Problem:** The backup system creates JSON exports to S3 but has no restore procedure. If data is lost, you have the backup file but no automated way to reimport it. You would need manual SQL work.

**Fix:** Build a `restoreFromBackup` procedure that reads the JSON, validates the schema version, and re-inserts rows in the correct order (respecting foreign key dependencies).

**Effort:** Medium — the export format is clean, but the restore order matters.

---

## Priority 2 — HIGH (Fix Within First Month)

These issues affect reliability, user experience, and operational confidence.

### 2.1 Admin-Only Gating on Sensitive Procedures

**Problem:** Several procedures that should be admin-only use `protectedProcedure` instead of `adminProcedure`. A patient user could potentially create protocols, manage other patients, or trigger backups.

**Procedures to upgrade to `adminProcedure`:**
- `protocol.create`, `protocol.update`, `protocol.fullUpdate`, `protocol.clone`, `protocol.seedTemplate`
- `patient.create`, `patient.update`, `patient.delete`, `patient.restore`, `patient.permanentDelete`
- `assignment.create`, `assignment.update`, `assignment.updateSteps`
- `appointment.create`, `appointment.update`
- `backup.create`, `backup.list`, `backup.download`
- `clientNote.create`, `clientTask.create`
- `document.upload`

**Effort:** Low — change `protectedProcedure` to `adminProcedure` on each.

### 2.2 Automated Daily Backups

**Problem:** Backups are manual-only (click "Create Backup Now" in Settings). If you forget, there is no safety net.

**Fix:** Add a server-side cron job or scheduled task that triggers `createDatabaseBackup()` daily. Alternatively, I can set up a Manus scheduled task that calls the backup endpoint every 24 hours.

**Effort:** Low.

### 2.3 Input Length Limits on Text Fields

**Problem:** Most string inputs validate `min(1)` but have no maximum length. A malicious or accidental input of millions of characters could bloat the database or crash the UI.

**Fix:** Add `.max()` constraints to all string inputs:
- Names: `.max(100)`
- Email: `.max(255)`
- Notes/content: `.max(10000)`
- Descriptions: `.max(2000)`

**Effort:** Low — systematic find-and-replace across routers.ts.

### 2.4 Soft Deletes for Protocols

**Problem:** Protocols have `isArchived` but no soft delete. If a protocol is deleted, it is hard-deleted. Patients with active assignments referencing that protocol would see broken data.

**Fix:** Add `deletedAt` to protocols (same pattern as patients) and filter them out of list queries.

**Effort:** Low.

### 2.5 Appointment Conflict Detection

**Problem:** The scheduling system does not check for overlapping appointments. Two patients can be booked at the same time without warning.

**Fix:** Before creating an appointment, query for existing appointments that overlap the requested time window and return a warning or error.

**Effort:** Low-Medium.

---

## Priority 3 — MEDIUM (Improve Over Time)

These items improve the professional quality and long-term maintainability.

### 3.1 Audit Log Coverage

**Problem:** The `audit_log` table exists and is used in some places (invite accept, patient create/update/delete) but not consistently. Protocol changes, appointment modifications, message deletions, and backup operations are not logged.

**Fix:** Add `db.logAudit()` calls to all mutation procedures.

**Effort:** Medium — systematic but tedious.

### 3.2 Error Boundary Per Page

**Problem:** There is one global `ErrorBoundary` wrapping the entire app. If a single page component crashes, the entire app shows the error screen. Per-page or per-section error boundaries would keep the rest of the app functional.

**Effort:** Low.

### 3.3 Loading States Consistency

**Problem:** Most pages handle loading states, but the patterns are inconsistent — some show spinners, some show skeletons, some show nothing. A consistent loading pattern across all pages would feel more polished.

**Effort:** Low-Medium.

### 3.4 Mobile Responsiveness

**Problem:** The provider dashboard uses a sidebar layout that may not work well on mobile/tablet. If you or staff need to access the dashboard from a phone, the experience may be poor.

**Fix:** Test and adjust the `DashboardLayout` for mobile breakpoints. The patient portal likely works better on mobile since it uses a simpler layout.

**Effort:** Medium.

### 3.5 Rate Limiting on Public Endpoints

**Problem:** The invite verification endpoint (`invite.verify`) and the OAuth callback are public. Without rate limiting, they could be abused.

**Fix:** Add express-rate-limit middleware for public routes.

**Effort:** Low.

---

## Priority 4 — NICE TO HAVE (Future Enhancements)

| Feature | Benefit | Effort |
|---|---|---|
| Protocol PDF export | Patients get a printable take-home sheet | Medium |
| Biomarker trend charts | Visual lab tracking over time | Medium |
| Email notifications to patients | Appointment reminders, new message alerts | Medium |
| Drag-and-drop step reordering | Better protocol editing UX | Medium |
| Two-factor authentication | Additional security layer | High |
| HIPAA compliance review | Required if handling PHI at scale | High |
| Webhook integrations | Connect to lab services, EHR systems | High |

---

## Recommended Action Plan

| Week | Focus | Items |
|---|---|---|
| **Week 1** | Security hardening | 1.1 (patient data isolation), 2.1 (admin gating), 2.3 (input limits) |
| **Week 2** | Data integrity | 1.2 (indexes), 1.3 (foreign keys), 2.4 (soft delete protocols) |
| **Week 3** | Operational reliability | 1.4 (backup restore), 2.2 (automated backups), 2.5 (appointment conflicts) |
| **Week 4** | Polish | 3.1 (audit logs), 3.2 (error boundaries), 3.3 (loading states) |

---

## What Is Already Solid

To be clear, a lot is already working well:

- **Authentication and role separation** — AdminGuard, protectedProcedure/adminProcedure pattern, invite system
- **Error handling** — Global ErrorBoundary, toast notifications on mutation errors, tRPC typed errors
- **Test coverage** — 262 tests across 25 files covering core procedures
- **Soft deletes for patients** — Already implemented with Trash UI and restore
- **S3 database backups** — Export works, manifest tracking, download links
- **Protocol system** — Full CRUD, cloning, templates, dosage/route fields, assignment steps
- **Dual portal architecture** — Clean separation of provider and patient experiences

The foundation is strong. The items above are about closing gaps that matter when real patients depend on the system daily.
