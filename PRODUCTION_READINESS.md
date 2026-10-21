# Production readiness

Updated for the portal rebuild. The demo is safe to click through with fictional data. It is not ready for real protected health information.

## In place

- Patient routes resolve the chart from the session. A patient cannot pass another chart id.
- Clinic routes require the `admin` or `staff` role. Tests cover cross-chart edits, the pharmacy queue, and guidance drafts.
- Published plan text is the only plan text a patient query returns. Guidance drafts stay on the clinic chart until a clinician approves one into a draft note and then publishes.
- The mock pharmacy adapter does not call a network API. Regenerative lines are clinic-managed protocol entries and do not enter the queue.
- New portal tables define indexes and foreign keys to patients. Plan, message, guidance, intake, and pharmacy mutations write audit rows (actor, action, entity, time, chart id). Message bodies are not copied into the audit payload.
- String inputs have length limits. Sign-in allows 8 failures per email per 10 minutes in this process. The session cookie is httpOnly, `SameSite=Lax`, and lasts 12 hours.
- `.env.example` has placeholders only. Demo passwords are fictional and documented on purpose. No API keys are committed.
- Seeded protocol and peptide text is labeled as a sample template, not medical guidance.

## Remaining gaps

Do not treat this list as optional polish if the app will hold real charts.

1. **No business associate agreement.** Hosting, the database, logging, and any future model or pharmacy vendor need a BAA and a reviewed subprocessor list before real PHI.
2. **Encryption at rest is not applied by the app.** It depends entirely on the MySQL host. There is no field-level encryption for notes, messages, or intake answers.
3. **The audit log is not a compliance archive.** Rows can be updated or deleted by anyone with database access. There is no tamper evidence, retention policy, or export to a separate store. The in-memory demo discards the log when the process exits. Audit queries scan recent rows in application code instead of indexing a chart id column.
4. **Sessions are not revocable.** A 12-hour JWT cannot be invalidated early. There is no idle timeout, device list, or rotation on privilege change. Production needs a server-side session record.
5. **Login throttling and the live-event bus are process-local.** A second server instance will not share either. Live publish updates need a shared bus (for example Redis) before horizontal scaling.
6. **Legacy tables still have no foreign keys.** The historical protocol, appointment, document, and billing tables were kept so the Drizzle schema stayed intact. They are unused by this portal and can accumulate orphans.
7. **Memory mode must never receive real PHI.** It is the default when `DATABASE_URL` is unset.
8. **Transport security, backups, and restore are operational, not in this repo.** Terminate TLS at the host. Backups and a tested restore are not implemented in this slice (the old S3 backup path was removed with the unused code).
9. **No e-prescribing.** The queue is an adapter boundary plus a mock. Do not point it at a live pharmacy from this codebase without a separate review.
10. **Guidance is not a medical device and must not auto-act.** The stub is deterministic demo copy. A hosted model, if configured later, still only creates drafts a clinician can dismiss. There is no automatic prescribing.
11. **CSRF protection is the `SameSite` cookie plus same-origin fetches.** There is no extra CSRF token.
12. **Security headers are minimal** (`nosniff`, `no-referrer`, `X-Frame-Options`). A production host should add a content security policy and HSTS.
13. **Access control is application-level.** A leaked database credential bypasses it. Database users should be least-privilege, and production logs should not include chart text.

## Before a real clinic uses it

- Sign hosting and vendor agreements, then turn memory mode off.
- Set a long `JWT_SECRET`, require TLS, and replace the JWT with revocable sessions.
- Run `pnpm db:push` against the practice database and confirm the new tables exist.
- Add foreign keys or archive the unused legacy tables.
- Move audit storage off the application database, or make it append-only with retention.
- Confirm backups and a restore drill.
- Keep the pharmacy adapter mocked until a real integration has its own security review.
- Keep model output in the clinician draft column. Do not add a path that shows unreviewed guidance to a patient.
