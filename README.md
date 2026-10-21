# Egbert Medicine portal

A private practice portal for a concierge functional and regenerative medicine clinic. It has two experiences:

- **Patient** — published treatment plan, lab timeline, messages, and intake status.
- **Clinic** — patient list, draft plan editor, publish, intake review, messaging, guidance drafts, and a mock pharmacy queue.

Patients see a plan only after a clinician publishes it. The patient view updates over a server-sent event, without a manual refresh.

This repository is a focused rebuild of an earlier, much larger app. The database schema, password sessions, roles, and per-patient messaging model were kept. Billing, SMS, calendar sync, file storage, and the old page set were removed.

## Demo

The demo uses fictional people and sample protocol text. It is not medical guidance and it is not a prescription.

| Role | Email | Password | What you see |
| --- | --- | --- | --- |
| Clinician | `clinician@demo.local` | `cedar-grove` | Dr. Avery Lang, both charts |
| Patient | `patient@demo.local` | `harbor-lane` | Morgan Hale only |

A second fictional chart, Quinn Adler, has no login. Morgan cannot open it.

With no `DATABASE_URL`, data lives in process memory and resets when the server stops. Do not type real patient information into that mode.

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. If `JWT_SECRET` is unset outside production, the server uses an insecure development secret and prints a warning.

```bash
pnpm check    # tsc --noEmit
pnpm test     # isolation, publish, pharmacy, guidance, live SSE
pnpm build
pnpm start    # needs JWT_SECRET
```

### Publish walkthrough

1. Sign in as the patient and leave the plan open.
2. In another browser profile, sign in as the clinician, open Morgan Hale, change a draft line, and choose **Publish to patient**.
3. Morgan’s open page shows “Your clinician published an updated plan” and the new published text. No reload.

Medicines and peptides that are new, changed, or removed become mock pharmacy orders. Regenerative protocol lines and notes do not.

## Architecture

```
client/                Vite + React. Patient and clinic screens.
server/app.ts          Express, tRPC, SSE at /api/events
server/routers.ts      Auth and portal procedures
server/portal/         Plan diff, pharmacy adapter, guidance model, stores
drizzle/schema.ts      MySQL schema, including the historical tables
```

**Auth.** Email and password. Session cookie is httpOnly, `SameSite=Lax`, and expires after 12 hours. Roles are `user` (patient), `admin`, and `staff`. Patient procedures ignore any requested chart id and load the chart linked to the session. Clinic procedures require admin or staff.

**Plans.** Each patient has one care plan. Draft lines and the draft summary are clinic-only. Publish copies the draft into published rows, bumps the version, writes an audit entry, and emits a `plan` event to the patient’s user id.

**Pharmacy.** `PharmacyAdapter` is the extension point. `createMockPharmacyAdapter` records an id and never makes a network call. Set `PHARMACY_ADAPTER` only when a future adapter exists; unknown values fall back to mock. See the comment in `server/portal/pharmacy.ts`.

**Guidance.** `GuidanceModel` returns drafts. The default stub does not call a model. `GUIDANCE_PROVIDER=anthropic` plus `ANTHROPIC_API_KEY` uses the hosted adapter. Every suggestion is stored as `pending`. Approving one adds a draft note. Nothing is shown to the patient until a clinician publishes the plan. No key is committed.

**Database.** Without `DATABASE_URL`, the memory store is used. With `DATABASE_URL`, the Drizzle MySQL store is used. Apply schema changes with `pnpm db:push`. New portal tables (`care_plans`, `care_plan_items`, `lab_results`, `pharmacy_orders`, `guidance_drafts`, `hub_destinations`, `hub_sends`, `charm_patient_links`, `charm_resource_links`) have indexes and foreign keys where they point at a patient. Older tables were kept and still do not enforce foreign keys.

**Charm data hub.** Admin only, under Clinic → Data hub. The server pulls Patient, Observation, DiagnosticReport, and MedicationRequest through `CharmFhirClient`. The default client is an in-memory fictional feed. `CHARM_ADAPTER=live` switches on SMART-on-FHIR backend auth using environment variables (`CHARM_PRIVATE_KEY` for a client assertion, or `CHARM_CLIENT_SECRET`). Labs land on the chart. Medications land on the draft plan and stay unpublished. The hub then fans a minimum-necessary record out through Slack, GoHighLevel, Viktor (a second Slack channel), and a webhook. Each destination has `baaCovered` and a kill switch that defaults to off-delivery. A destination that is not BAA-covered is sent only a Safe Harbor payload: names, dates of birth, contact fields, and identifiers are removed in code before the adapter is called. Every attempt is written to the audit log and the send log without copying those identifiers into the log text. `HUB_DELIVERY=live` plus a destination secret is required before any vendor call; tests stay on the mocks.

## What stayed and what was replaced

Kept:

- Drizzle schema and MySQL setup, including users, patients, messages, intake forms, and the audit log
- JWT session cookies, salted password hashes, and `user` / `admin` / `staff` roles
- Message threads scoped by patient
- The rule that a patient session cannot read another chart
- Railway start/build hooks
- tRPC, Vite, and React

Replaced or removed:

- The previous multi-page provider and patient UI
- Billing, SMS, Google Calendar, S3 uploads, and the patient-facing AI chat
- The debug collector, design-preview HTML, and scratch notes
- The monolithic router and database helper

## Production

Read `PRODUCTION_READINESS.md` before putting real patient information in this app. The demo is not a HIPAA-ready deployment.
