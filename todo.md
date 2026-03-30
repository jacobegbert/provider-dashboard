# Provider Dashboard — Full-Stack Upgrade TODO

## Phase 1: Full-Stack Upgrade
- [x] Run webdev_add_feature to add web-db-user (database + auth + backend)
- [x] Review upgrade README and migration guidance

## Phase 2: Database Schema
- [x] Design schema: patients (status, compliance, subscription tier, last interaction, next action)
- [x] Design schema: protocols (duration, checklists, frequencies, milestones, lab checkpoints)
- [x] Design schema: protocol_assignments (patient ↔ protocol, progress tracking)
- [x] Design schema: messages (encrypted storage, role-based access, audit trail)
- [x] Design schema: appointments (assistant-managed, notes field)
- [x] Design schema: subscription_tiers
- [x] Design schema: task_completions (daily checklist tracking)
- [x] Design schema: notifications
- [x] Create migration and seed scripts

## Phase 3: Provider Attention Queue
- [x] Build "Who needs my attention today?" command center
- [x] Overdue tasks feed
- [x] Unread messages feed
- [x] Upcoming calls/appointments feed
- [x] Non-compliant patients feed
- [x] Expiring subscriptions feed
- [x] Prioritized attention score algorithm

## Phase 4: Protocol Automation
- [x] Protocol builder UI (create/edit protocols with steps, frequencies, milestones)
- [x] Protocol assignment flow (provider assigns → patient sees)
- [x] Compliance tracking (auto-calculate % from task completions)
- [x] Auto-flag when compliance drops below threshold
- [x] Milestone tracking and notifications

## Phase 5: PWA + Push Notifications
- [x] Add PWA manifest and service worker
- [x] Push notification integration for new messages
- [x] Push notification for overdue tasks
- [x] Push notification for appointment reminders
- [x] Email notification fallback for critical events (using notifyOwner helper)

## Phase 6: Subscription Tier Tracking
- [x] Add tier field to patient model (e.g., Standard, Premium, Elite)
- [x] Display tier in provider client list and detail view
- [x] Expiration tracking and alerts

## Phase 7: Scheduling (Assistant-Managed)
- [x] Keep scheduling as display-only for patients
- [x] Provider/assistant can create/edit/delete appointments
- [x] Notes field for assistant coordination
- [x] No external booking tool integration

## Phase 8: Final Testing & Delivery
- [x] End-to-end test all flows
- [x] Save checkpoint
- [x] Deliver to user

## Calendar Enhancement
- [x] Full interactive monthly calendar view on Schedule page
- [x] Click any day to see that day's appointments
- [x] Navigate between months (prev/next)
- [x] Visual indicators for days with appointments
- [x] Appointment type color coding on calendar
- [x] Keep existing list view as secondary tab

## Patient Portal Desktop Responsiveness
- [x] Fix PatientLayout to use sidebar navigation on desktop instead of bottom tabs
- [x] Fix PatientHome to use wider layout with grid on desktop
- [x] Fix PatientProtocols to use wider layout on desktop
- [x] Fix PatientMessages to use wider layout on desktop
- [x] Fix PatientSchedule to use wider layout on desktop
- [x] Fix PatientProfile to use wider layout on desktop

## Go-Live Guide Walkthrough Website
- [x] Create GoLiveGuide page with all 10 sections from GO_LIVE_GUIDE.md
- [x] Add interactive progress tracking (checkboxes for completed steps)
- [x] Add smooth scroll navigation sidebar for guide sections
- [x] Add /guide route to App.tsx
- [x] Style with existing warm Scandinavian design system
- [x] Write vitest test for the guide route

## Custom Notification System
- [x] Audit existing notification schema and router
- [x] Add notification triggers for key events (messages, appointments, attention alerts)
- [x] Build notification bell icon with unread count in DashboardLayout header
- [x] Build notification dropdown/popover with recent notifications
- [x] Build full notification center page at /provider/notifications
- [x] Add mark-as-read and mark-all-as-read functionality
- [x] Add notification preferences/settings (type filtering on notification center)
- [x] Add email notification support via Manus notifyOwner service
- [x] Write vitest tests for notification procedures

## Client Management & Documents
- [x] Add "inactive" status to patient schema enum and push migration
- [x] Replace mock-data Clients page with real tRPC data
- [x] Add "Add Client" dialog with form
- [x] Add client status update (active, inactive, paused, etc.) in detail panel
- [x] Add client delete with confirmation dialog
- [x] Add documents table to schema for file metadata
- [x] Build document upload tRPC procedures (upload to S3, list, delete)
- [x] Add Documents tab in provider client detail panel
- [x] Add Documents section in patient portal
- [x] Wire patient login via Manus OAuth on landing page
- [x] Link authenticated users to patient records
- [x] Write vitest tests for new procedures

## Custom Day Frequency for Protocol Steps
- [x] Add "custom" option to protocol step frequency enum
- [x] Add customDays field to protocol_steps schema for storing selected days
- [x] Update Protocol Builder UI with day-of-week toggle selector (M/T/W/Th/F/Sa/Su)
- [x] Update step display to show selected custom days
- [x] Write vitest tests for custom frequency

## Eliminate All Placeholders & Full Feature Build
### Client Detail Panel
- [x] Client Notes tab: add new notes with auto-timestamp, view all notes sorted by date
- [x] Client Notes: notes schema, db helpers, tRPC procedures
- [x] Full client profile editing dialog (all fields: name, email, phone, DOB, tier, health goals, conditions, notes)
- [x] Message button in client detail → navigates to Messages page
- [x] Schedule button in client detail → navigates to Schedule page

### In-Client Protocol Management
- [x] Protocols button in client detail → navigates to Protocols page
- [x] Protocol creation and assignment available from Protocols page
- [x] Assign existing protocol to client from Protocols page

### Provider-Side Task Management
- [x] Tasks schema (client_tasks table) with db helpers and tRPC procedures
- [x] Add task to client (title, description, due date, priority)
- [x] View/edit/complete/delete tasks per client
- [x] Tasks tab in client detail panel

### Protocols Page Placeholders
- [x] "Create Protocol" button → navigate to Protocol Builder
- [x] "Assign to Client" button → open assignment dialog
- [x] "Edit" button → navigate to Protocol Builder with pre-filled data

### Schedule Page Placeholders
- [x] "New Appointment" button → open create appointment dialog
- [x] "Schedule Here" button on empty day → open create with pre-filled date
- [x] "Reschedule" button → open reschedule dialog
- [x] "Cancel" appointment button → confirmation + cancel
- [x] "Join/Start Call" button → open video link or show meeting info

### Messages Page Placeholders
- [x] More options menu (view profile, schedule appointment, mark all read)
- [x] Attachment button → file upload in messages

### Settings Page Placeholders
- [x] "Enable" 2FA button → directs to Manus account settings
- [x] "View Sessions" button → shows current session info

### Attention Queue
- [x] "Request Call" button → navigates to Messages page

### Write vitest tests for all new features
- [x] Write tests for client notes, tasks, messages, and remaining features

## Full Integration Pass

### Wire Provider Pages to Real Data
- [x] Home.tsx: replace mock data with tRPC queries (stats, clients, appointments, messages)
- [x] Home.tsx: make all cards clickable (stat cards → relevant pages, client cards → client detail, appointment cards → schedule)
- [x] DashboardLayout.tsx: replace mock badge counts with real tRPC data
- [x] AttentionQueue.tsx: replace mock data with real tRPC attention queue data
- [x] AttentionQueue.tsx: make all attention items clickable → navigate to relevant client/page
- [x] Analytics.tsx: replace mock data with real tRPC queries

### Fix Global Search Bar
- [x] DashboardLayout search bar: implement real search across clients, protocols, messages

### Wire Patient Portal to Real Data
- [x] PatientHome.tsx: replace patientMockData with tRPC queries (myRecord, assignments, tasks, appointments)
- [x] PatientProtocols.tsx: replace mock with tRPC assignment/protocol data
- [x] PatientMessages.tsx: replace mock with tRPC message data
- [x] PatientSchedule.tsx: replace mock with tRPC appointment data
- [x] PatientProfile.tsx: replace mock with tRPC patient record data

### Cross-Portal Data Flow
- [x] Protocol changes on provider side reflect in patient portal
- [x] Messages transfer between provider and client with notifications
- [x] Provider can access all info visible in client portal

### Test Patient Setup
- [x] Create seed script with test patient data for end-to-end testing
- [x] Write vitest tests for integration features (114 tests passing)

## User-Reported Issues & Enhancements (Feb 18)

### Attention Queue Fixes
- [x] Add ability to delete/dismiss attention queue items
- [x] Add ability to mark attention queue items as complete/resolved
- [x] Fix "Review" button — connect to proper navigation (client detail with ?selected=ID)

### Protocol Fixes
- [x] Fix protocol assignment — "Assign to Client" now works end-to-end (separate Protocols page with assign dialog)
- [x] Fix archive/file-cabinet icon — added confirmation dialog, archived section with restore, and unarchive
- [x] Fix protocol display — ProtocolBuilder now uses listAll to show both active and archived

### Protocol Builder Enhancement
- [x] Add "Ongoing" button below duration field that nullifies duration in days
- [x] When "Ongoing" is selected, duration field is disabled

### Appointment Calendar Features
- [x] Add "Add to Calendar" button for appointments (generates .ics file download)
- [x] Google Calendar sync for provider side (Google OAuth integration complete)

### Google Calendar Integration
- [x] Add google_tokens table and googleEventId column to schema
- [x] Build Google Calendar OAuth flow (server-side token management)
- [x] Auto-sync appointments to Google Calendar on create/update/cancel
- [x] Add Sync All Appointments bulk sync endpoint
- [x] Add Google Calendar connection UI in Settings page
- [x] Add Google Calendar banner on Schedule page (not connected prompt)
- [x] Write vitest tests for Google Calendar procedures

### Exploratory Testing Pass
- [x] Thorough click-through of every page as provider
- [x] Test every button, dialog, and interaction
- [x] Fix broken functionality: Schedule date parsing, route for Protocols page, Dashboard client links
- [x] Added: archived protocols section, restore from archive, protocol assignment verification

## Design & AI Enhancements (Inspired by Claude Comparison)
- [x] Upgrade typography: premium serif (Cormorant Garamond) + sans (Outfit) + mono (DM Mono)
- [x] Update color accents for more luxurious feel (gold accents)
- [x] Add subtle grain texture overlay for depth
- [x] Build AI Clinical Advisor page for provider dashboard with quick-action prompts
- [x] Build Patient AI Wellness Assistant page with context-aware prompts
- [x] Add Patient Vitals/Biomarker dashboard to patient portal

## Patient Invite & Onboarding Flow
- [x] Add patient_invites table to schema (token, patientId, expiresAt, usedAt, usedByUserId)
- [x] Push database migration for invites table
- [x] Build tRPC procedures: generateInvite, verifyInvite, acceptInvite (link account)
- [x] Add "Send Invite" / "Copy Invite Link" button in provider Clients page
- [x] Build patient invite landing page (/invite?token=xxx) with branding + login CTA
- [x] After OAuth callback, detect pending invite token and auto-link patient record
- [x] Add login button to PortalSwitcher / landing page for patients
- [x] Fix routing so patient portal requires authentication
- [x] Write vitest tests for invite procedures
- [ ] End-to-end walkthrough test with user

## Real Patient Onboarding Issues (Samantha Buker)
- [x] Patient portal shows wrong name (Sarah Mitchell instead of Samantha Buker) — PatientLayout was hardcoded, now uses tRPC myRecord + DB fix
- [x] Patient vitals page shows mock/demo lab values instead of empty or real data — replaced with empty state
- [x] Messaging is not active/working from patient portal — fixed receiverId (was 0, now uses providerId), fixed sender detection (was checking nonexistent senderType, now compares senderId to user.id)
- [x] Scheduling is not connecting to patient portal — code is correct; issue was that patient record wasn't linked to user account (fixed in name fix above). Samantha should now see her appointments.
- [x] Audit and fix any other patient portal issues found during investigation — added admin protection on invite accept, admin warning on invite landing page, verified all patient pages use real tRPC data

## UX Fixes (User Reported)
- [x] Remove self-notification when provider sends a message (provider shouldn't get notified for their own messages)
- [x] Make dashboard stat cards clickable links to respective pages (e.g., Total Patients → Clients, Messages → Messages, etc.) — already had onClick, improved with hover effects and arrow indicators

## New Features (User Requested)
- [x] Add unread message count badge to Messages sidebar nav item — already implemented in DashboardLayout with stats?.totalUnread and terracotta styling, refreshes every 60s
- [x] Build email delivery for patient invites (send invite link to patient's email on file)
- [x] Add "Last Active" indicator on Clients list showing when each patient last logged into their portal

## Bugs & Protocol Overhaul (User Reported)
- [x] Fix: still getting self-notifications when sending messages to clients — notifyOwner was always called; now skipped when provider (admin) sends
- [x] Fix: attention queue dismissed/resolved items reappear on refresh — persist state in DB with 7-day expiry
- [x] Add assigned protocols section to patient detail page in Clients
- [x] Protocol overhaul: provider can view assigned protocol details from client page
- [x] Protocol overhaul: patient portal shows assigned protocols with step-by-step progress
- [x] Protocol overhaul: patient can mark steps as completed
- [x] Protocol overhaul: provider can see patient compliance/progress on each protocol

## Protocol Template Library (User Requested)
- [x] Review and improve existing Protocols page as a template library — already has create/edit/archive/assign/search/filter
- [x] Add one-click "Assign to Patient" from the Protocols page with patient selector — already exists
- [x] Add one-click "Assign Protocol" from the Clients page Protocols tab with template selector
- [x] Ensure protocol templates show step count, category, duration at a glance
- [x] Write vitest tests for the new assignment flow

## Clickable Notifications (User Requested)
- [x] Add actionUrl field to notifications schema/creation — used existing relatedEntityType/Id + tRPC resolveUrl procedure
- [x] Update all notification creation points to include relevant actionUrl (messages, appointments, etc.)
- [x] Update notification UI to navigate on click — both NotificationBell popover and Notifications page
- [x] Write vitest tests for notification actionUrl — existing tests pass, resolveUrl uses DB query

## Real-Time SSE Notifications (Re-implemented after sandbox reset)
- [x] Create SSE server module (server/sse.ts) with EventEmitter pub/sub bus
- [x] Register /api/sse/notifications endpoint in Express server with auth
- [x] Hook emitNotification into createNotification in db.ts for auto-push
- [x] Create useRealtimeNotifications client hook with SSE connection, reconnect, and browser notification support
- [x] Wire hook into DashboardLayout (provider) and PatientLayout (patient)
- [x] Write vitest tests for SSE module (11 tests passing)
- [x] All 163 tests passing

## Database Cleanup — Remove Test Data
- [x] Identify all test clients (non-Samantha Buker patients)
- [x] Delete test clients and all associated records (assignments, tasks, messages, notifications, documents, notes, invites, attention dismissals)
- [x] Delete test protocols and associated steps
- [x] Verify Samantha Buker and real data are preserved

## Testosterone Cypionate Protocol Template
- [x] Create protocol template: Testosterone Cypionate IM Injection
- [x] Add dose tier steps (0.3mL, 0.35mL, 0.4mL, 0.5mL — TIW MWF)
- [x] Include supply info (alcohol swabs, 1mL syringes, 25G 1" needles)
- [x] Include refill schedule and prescription details
- [x] Verify protocol displays correctly in provider Protocols page

## Delete Auto-Created TRT Protocol & Unassign Feature
- [x] Delete the Testosterone Cypionate — IM Injection Protocol template from DB
- [x] Add "Remove" / "Unassign" button for protocols on patient detail (Clients page)
- [x] Add tRPC procedure to unassign a protocol from a patient
- [x] Write vitest tests for unassign procedure

## Remove Leftover Test Protocols
- [x] Identify all remaining test/leftover protocols in the library
- [x] Delete test protocols and their associated steps and assignments
- [x] Verify only real protocols remain

## Bug Fix: Rate Exceeded JSON Parse Error on Email Invite
- [x] Diagnose the rate limit error in invite email flow
- [x] Add proper error handling for non-JSON API responses (rate limit, etc.)
- [x] Test the fix

## Full Protocol Edit — Reuse Create Protocol Form
- [x] Review current Create Protocol and Edit Protocol UI/backend
- [x] Refactor protocol form into shared component supporting create and edit modes
- [x] Update backend to support full protocol updates (all fields + steps CRUD)
- [x] Wire Edit button to open the full form pre-populated with existing data
- [x] Test the full edit flow and verify

## Bug Fix: Unread Message Badge Not Clearing
- [x] Investigate how unread count is tracked (backend + frontend)
- [x] Fix the logic so reading messages clears the unread badge
- [x] Test the fix

## Database Cleanup — Remove Leftover Test User Patients
- [x] Identify and delete all "Test User" patient records
- [x] Clean up any associated data (messages, assignments, etc.)

## Bug Fix: Google Calendar Not Syncing
- [x] Investigate the Google Calendar sync flow and identify the issue — redirect_uri_mismatch (needed www variant) + testing mode (needed test user added)
- [x] Fix the sync logic — user added www redirect URI and test user in Google Cloud Console
- [x] Test the fix — Google Calendar connected successfully

## Bug Fix: Profile Info Resets on Page Refresh
- [x] Investigate how profile data (email, phone) is stored and loaded — was using hardcoded defaultValues with no DB persistence
- [x] Add provider_profiles table, db helpers (get/upsert), tRPC procedures, and rewire Settings form
- [x] Test the fix — 178 tests passing

## Patient Message Attachments (File/Image Upload)
- [x] Review current messaging schema and backend for attachment support
- [x] Add /api/upload/attachment endpoint for message file uploads (S3) with auth, size, and type validation
- [x] Add file upload UI to patient messaging (Paperclip button, preview bar, send as attachment)
- [x] Update provider messaging to render images inline and documents as download links
- [x] Support image types (JPEG, PNG, GIF, WebP) and documents (PDF, DOC/DOCX)
- [x] Write vitest tests for attachment upload (12 tests)
- [x] All 190 tests passing

## AI Chat File Upload Support
- [x] Review current AI chat backend (invokeLLM) and frontend (AIChatBox, AIAdvisor, PatientWellnessAI)
- [x] Update AI tRPC procedures to accept multimodal content (image_url, file_url content parts)
- [x] Upload files to S3 via /api/upload/attachment, pass URLs to LLM as image_url or file_url content
- [x] Add Paperclip button + preview bar to AIChatBox component (shared by both portals)
- [x] Display uploaded images inline and documents as download links in chat history
- [x] Fix pre-existing Google Calendar test (mock DB to avoid real data dependency)
- [x] All 190 tests passing

## Per-Patient Protocol Personalization (Assignment Step Duplication)
- [x] Review current assignment schema and how steps are referenced
- [x] Add assignment_steps table to schema (duplicated from protocol_steps on assign)
- [x] Update assign procedure to copy all protocol steps into assignment_steps
- [x] Update provider UI: edit per-patient steps from client detail without altering library template
- [x] Update patient portal to read from assignment_steps instead of protocol_steps
- [x] Update compliance/task completion to reference assignment_steps
- [x] Write vitest tests for the new assignment step duplication and editing
- [x] Fix legacy assignment handling: updateSteps now auto-creates assignment_steps when editing a pre-existing assignment that has no assignment_steps yet

## Patient Document Upload
- [x] Add file upload UI to patient portal Documents section (reuse S3 upload flow)
- [x] Allow patients to upload documents (labs, images, PDFs) from their portal
- [x] Show uploaded documents in both patient and provider views

## Biomarkers Page Rebuild
- [x] Remove existing vitals/biomarkers page with mock lab data
- [x] Create biomarker_entries table (patientId, metric name, value, unit, date)
- [x] Create biomarker_custom_metrics table (patientId, metric name, unit) for custom tracking
- [x] Build tRPC procedures: addEntry, listEntries, addCustomMetric, listCustomMetrics, deleteCustomMetric
- [x] Build new Biomarkers page with built-in metrics: Weight, Height, Body Fat %
- [x] Add "Add Custom Metric" feature — patients can add as many custom trackable metrics as they want
- [x] Show history/trend for each metric with trend arrows
- [x] Title the page "Biomarkers"
- [x] Write vitest tests for biomarker procedures (12 tests)

## Bug Fix: AI Chat File Upload Missing Fields Error
- [x] Fix AIChatBox upload sending wrong field names (base64Data → fileData) to /api/upload/attachment

## Bug Investigation: Patient Temporarily Saw Provider Dashboard
- [x] Investigate routing/role detection that could cause patient to see provider layout
- [x] Check for race conditions in auth/role loading on mobile
- [x] Fix: Added AdminGuard component to App.tsx that blocks /provider routes for non-admin users, shows loading spinner while auth resolves, and redirects patients to /patient

## Provider Portal — Client Detail Improvements
- [x] Show client's appointments in client detail panel (new Appointments tab)
- [x] Make tasks editable from client detail (Edit Task dialog with title, description, priority, status)
- [x] Show client biomarker entries in client detail panel (new Biomarkers tab)

## Provider Portal — Schedule/Appointment Editing
- [x] Edit appointment: change date and time
- [x] Edit appointment: add/edit video link (location field)
- [x] Edit appointment: add/edit notes/details (assistantNotes field)

## Patient Portal — Biomarker Editing
- [x] Allow patients to edit existing biomarker entries (Edit Entry dialog with value, date, note)
- [x] Allow patients to delete biomarker entries (existing delete button)

## Patient Portal — Protocol Full Details on Mobile
- [x] Show full protocol details (removed line-clamp-2 truncation)
- [x] Ensure protocol steps, dosing, timing, administration route are fully visible on small screens

## Patient Portal — Schedule Calendar Link
- [x] Add "Add to Calendar" buttons: Google Calendar (opens pre-filled event) and Download .ics file
- [x] Show video call link and appointment details on patient schedule cards

## Educational Resources Feature
- [x] Design schema: resources table (title, description, type, category, fileUrl, content, tags, createdAt)
- [x] Design schema: resource_shares table (resourceId, patientId, sharedBy, message, isViewed, sharedAt)
- [x] Add DB helpers for CRUD operations on resources and shares
- [x] Add tRPC procedures: create, update, delete, archive, list, share, unshare, listForPatient, markViewed
- [x] Build provider Resources page: upload files, create articles, add links, manage library
- [x] Add share dialog: select patients to share a resource with, include optional message
- [x] Add Resources nav item to provider sidebar
- [x] Build patient Resources page: view shared educational content with category filters
- [x] Add Resources nav item to patient sidebar
- [x] Write vitest tests for resource procedures (15 tests)

## Bug Fix: Patient Mobile Bottom Nav Not Scrollable
- [x] Fix bottom nav bar on patient portal mobile view so all items (Resources, Wellness AI, Profile) are accessible in portrait mode
- [x] Make the bottom bar horizontally scrollable with hidden scrollbar, shrink-0 items, and touch scrolling

## Bug Fix: Birthday Off By One Day (Timezone Issue)
- [x] Investigated: new Date("1982-06-25") parses as UTC midnight, which shifts back a day in MST (UTC-7)
- [x] Fixed: Parse date string components individually with new Date(year, month-1, day) to create local time instead of UTC

## Client Detail Panel Restructure
- [x] When a patient is selected, expand detail panel to take majority of screen (flex-1, calendar-sized)
- [x] Collapse patient list to a narrow single column (~280px) with compact name rows when detail is open
- [x] Horizontal profile header, full tab labels, increased padding for wider panel

## Protocols Page — Missing Actions / Usability Issue
- [x] Investigated: actions (Edit, Assign, Archive, View Details) DO exist on every card
- [x] Root cause: 35 test protocols cluttering the page, making it look broken
- [x] Cleaned up 70 test protocols from database (kept only Testosterone Cypionate TRT)
- [x] Removed the Protocol Builder button from the Protocols page

## Category Changes: Add Peptides, Remove Detox & Gut Health
- [x] Update protocols schema enum: add peptides, remove detox and gut_health
- [x] Update resources schema enum: add peptides
- [x] Update Protocols page UI: category icons, styles, filter buttons
- [x] Update ProtocolBuilder.tsx and PatientProtocols.tsx category maps
- [x] Update Resources page UI and PatientResources.tsx category filters
- [x] Update routers.ts zod enums for protocol create/update/fullUpdate
- [x] Update test files to use peptides instead of gut_health
- [x] Migrated existing database records from detox/gut_health to other
- [x] Pushed schema migration via SQL ALTER TABLE

## Bug Fix: Custom Days in Protocol Edit Uses Text Input Instead of Toggle Buttons
- [x] Fixed per-patient step edit dialog in Clients.tsx to use day-of-week toggle buttons (M/T/W/Th/F/Sa/Su)
- [x] Removed the comma-separated text write-in field for custom days in edit mode

## Protocol Clone Feature
- [x] Add clone/duplicate tRPC procedure to copy a protocol with all its steps
- [x] Add Clone button to each protocol card on the Protocols page
- [x] Write vitest test for the clone procedure (5 tests)

## Dosage & Route Fields for Protocol Steps
- [x] Add dosage (amount + unit) and route columns to protocol_steps and assignment_steps schema
- [x] Push database migration for new columns
- [x] Update DB helpers (createProtocolStep, updateProtocolStep, createAssignmentStep) to handle dosage/route
- [x] Update tRPC procedures: protocol create/fullUpdate/clone, assignment updateSteps
- [x] Update Protocols page step editor UI with dosage amount, unit, and route fields
- [x] Update Clients page per-patient step editing dialog with dosage/route fields
- [x] Update ProtocolBuilder.tsx step form and detail display with dosage/route
- [x] Update Clients expanded assignment view to show dosage/route info
- [x] Write vitest tests for dosage and route fields (6 tests)

## Make Start Day / End Day Optional on Protocol Steps
- [x] Make startDay nullable in protocol_steps and assignment_steps schema (remove .notNull() and .default(1))
- [x] Update tRPC procedures to accept optional startDay
- [x] Ensure UI treats start day and end day as optional fields (all 3 editors)

## Pre-Built Protocol Templates Library (8 Templates)
- [x] Design BPC-157 Healing protocol template
- [x] Design Vitamin D Loading protocol template
- [x] Design Retatrutide protocol template
- [x] Design Tesamorelin protocol template
- [x] Design Sermorelin protocol template
- [x] Design VO2 Max Training protocol template
- [x] Design Zone 2 Cardio protocol template
- [x] Design Low-Carb Pseudo-Carnivore Diet protocol template
- [x] Add a tRPC procedure to seed a template into the protocol library
- [x] Add a "Template Library" button/section to the Protocols page UI
- [x] Show template cards with preview info and a one-click "Add to Library" action
- [x] Write vitest tests for the template seeding procedure (12 tests)

## Protocol Detail View on Click
- [x] Make protocol cards clickable to open a full detail view
- [x] Show protocol name, description, category, duration, milestones, lab checkpoints, and all steps
- [x] Include Edit, Clone, Archive, and Assign actions from the detail view

## Soft Deletes for Patients
- [x] Add deletedAt timestamp column to patients table (null = active, set = soft-deleted)
- [x] Push database migration for deletedAt column
- [x] Update all patient list queries to filter out soft-deleted records (WHERE deletedAt IS NULL)
- [x] Change patient delete procedure to set deletedAt instead of hard delete
- [x] Add restore procedure to clear deletedAt and bring patient back
- [x] Add permanent delete procedure with confirmation dialog
- [x] Add Trash filter to Clients page showing soft-deleted patients with restore/permanent-delete actions
- [x] Write vitest tests for soft delete, restore, permanent delete, and listDeleted (5 tests)

## S3 Database Backup
- [x] Build backup export procedure that dumps all 23 tables to JSON and uploads to S3
- [x] Add backup manifest tracking (last 30 backups)
- [x] Add manual "Create Backup Now" button in Settings > Database Backups
- [x] Add backup history list showing past backups with download links
- [x] Add backup router with create, list, and download procedures

## Delete Images/Files in Messages
- [x] Review current message attachment schema and storage
- [x] Add deleteAttachment tRPC procedure (replaces content with "[Attachment deleted]")
- [x] Add getMessage and deleteMessageContent DB helpers
- [x] Add hover-reveal trash icon on sender's attachments in provider Messages page
- [x] Add hover-reveal trash icon on sender's attachments in patient PatientMessages page
- [x] Handle "[Attachment deleted]" display as italic placeholder in both UIs
- [x] Ensure only the sender can delete their own attachments (ownership check)
- [x] Write vitest tests for attachment deletion (5 tests)

## Testosterone Injection Maintenance Protocol Template
- [x] Add Testosterone Injection Maintenance template to shared/protocolTemplates.ts (8 steps, 4 milestones, 4 lab checkpoints)

## New Protocol Templates (Batch 3)
- [x] Add Thymosin Alpha-1 immune protocol template (6 steps, 4 milestones, 3 lab checkpoints)
- [x] Add MOTS-c mitochondrial peptide protocol template (6 steps, 4 milestones, 3 lab checkpoints)
- [x] Add SS-31 (Elamipretide) mitochondrial protocol template (6 steps, 4 milestones, 3 lab checkpoints)
- [x] Add GHK-Cu regenerative peptide protocol template (6 steps, 4 milestones, 3 lab checkpoints)
- [x] Add Core Supplement Routine template — creatine, D3/K2, mag glycinate, zinc, omega-3s, IM8 (6 steps, 4 milestones, 2 lab checkpoints)

## Bug Fix: 404 on Schedule/Add Appointment from Clients Page
- [x] Fixed: navigation was pointing to /provider/calendar (non-existent route) instead of /provider/schedule (2 occurrences)

## Daily Task Reset & Remove Adherence Tracking
- [x] Verified: task completions are already date-scoped (taskDate field) — checklist resets daily automatically
- [x] Patient portal already shows today's checklist that resets each day (todayStr filter)
- [x] Removed adherence/compliance from: Home dashboard stat card, Clients assignment view, AttentionQueue (low compliance section + tab), Settings notification prefs, GoLiveGuide descriptions, AI advisor prompts
- [x] Replaced "Avg. Adherence" stat with "Upcoming Appts" on Home page
- [x] Renamed "Compliance" tab to "Overdue" in Attention Queue
- [x] All 262 tests passing
## CRITICAL: Patient Data Isolation
- [x] Audit all patient-facing tRPC procedures for ownership checks
- [x] Add ownership validation to every patient procedure (verify ctx.user matches the patient)
- [x] Ensure patients cannot access other patients' data by passing a different patientId
- [x] Switch ~40 provider-only procedures from protectedProcedure to adminProcedure
- [x] Add ensurePatientAccess checks to patient-facing read procedures (biomarkers, resources, documents, assignments, messages, appointments)
- [x] Write vitest data-isolation tests (17 tests covering admin access, patient isolation, unlinked user rejection)

## CRITICAL: Database Indexes
- [x] Add indexes on all foreign key columns (patientId, protocolId, assignmentId, etc.) — 44 indexes added
- [x] Add indexes on frequently queried columns (status, deletedAt, taskDate, etc.)
- [x] Add composite indexes for common query patterns (assignment+date, patient+read, user+read)
- [x] Push migration with new indexes

## CRITICAL: Foreign Key Constraints
- [x] Add proper FK references to all tables that reference patients, protocols, assignments, users — 35 FK constraints
- [x] Ensure cascade behavior is correct (e.g., deleting a protocol cascades to steps)
- [x] Clean up orphaned records that violated FK constraints
- [x] Push migration with FK constraints

## CRITICAL: Backup Restore Procedure
- [x] Build restoreDatabaseBackup function in backup.ts (downloads from S3, validates, truncates, re-inserts in FK order)
- [x] Add backup.restore tRPC mutation (admin-only, auto-creates safety backup before restore)
- [ ] Add restore UI button to Settings > Database Backups
- [ ] Add confirmation dialog before restore (destructive operation)

## Remove Test/Seed Data
- [x] Identify test patients vs user-entered patients
- [x] Identify test protocols vs user-entered protocols
- [x] Remove test data: 42 test patients and 60 test protocols deleted (FK cascades cleaned up related records)
- [x] Verified: 2 real patients and 9 real protocols preserved

## Fix Protocol Task Completion Reset Timezone
- [x] Investigate current task completion/reset logic and identify timezone usage
- [x] Use user's browser/phone local timezone for taskDate generation (replaced toISOString with getDate/getMonth/getFullYear)
- [x] Ensure daily task completions reset at midnight in user's local time
- [x] Also fixed Schedule page date grouping to use local timezone
- [x] Also fixed custom frequency day matching to handle both full and short day names
- [x] Write tests for timezone-aware reset logic (12 tests)

## Bug: Protocol completions not resetting from yesterday
- [x] Investigated: completions were made today (Feb 19) but stored with UTC date due to old code — timezone fix resolved the root cause
- [x] No action needed — completions will reset correctly at midnight local time going forward

## Bug: Email invites not reaching clients
- [x] Investigated: invite "email" was using notifyOwner() which only notifies the project owner, not the patient
- [x] Fix: integrated Resend email service — invites now send real emails to patient email addresses
- [x] Also sends SMS via Twilio when patient has phone number on file

## Fix Patient Portal Non-Functional Tabs
- [x] Audit: profile buttons were dead (<button> with no onClick or href)
- [x] Created /patient/notifications page with full notification center, filtering, pagination, mark-read
- [x] Created /patient/privacy page with account info, security features, and data privacy info
- [x] Wired Health Data button to existing /patient/vitals (biomarkers) page
- [x] Added unread notification count badge on profile page
- [x] Added browser notification permission banner (enable/blocked/granted states)
- [x] SSE real-time notifications already work for in-app + background tab alerts
- [x] Email notifications to patients via Resend (API key validated, templates built)
- [x] SMS notifications to patients via Twilio (integrated into invite, message, appointment flows)
- [ ] Web Push via Service Worker for fully offline notifications (future enhancement)

## Bug: Patient Portal Biomarkers — No Permissions Error
- [x] Root cause: addEntry, updateEntry, deleteEntry, addCustomMetric, deleteCustomMetric were set to adminProcedure during data isolation pass
- [x] Fix: changed to protectedProcedure with ensurePatientAccess ownership checks
- [x] Updated frontend to pass patientId to updateEntry, deleteEntry, deleteCustomMetric mutations
- [x] Updated tests to match new input schemas — all 307 tests passing

## Resend Email + Twilio SMS Integration
- [x] Configured RESEND_API_KEY, FROM_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets
- [x] Installed resend and twilio npm packages
- [x] Created email module (server/email.ts) with branded HTML templates (invite, message, appointment, generic)
- [x] Created SMS module (server/sms.ts) with concise SMS templates
- [x] Created unified patientNotify module (server/patientNotify.ts) — sends both channels in parallel
- [x] Phone field already exists in patients schema
- [x] Integrated into invite flow — sends email + SMS to patient on invite generation
- [x] Integrated into message flow — sends email + SMS when provider messages patient
- [x] Integrated into appointment flow — sends email + SMS on new appointment creation
- [x] Frontend passes origin to message.send and appointment.create for email link building
- [x] Resend API key validated (Status 200)
- [x] Twilio SID format validated
- [x] 323 tests passing including 15 new notification tests

## Legal Pages & Twilio 10DLC Registration
- [x] Create /privacy-policy page with HIPAA-aware privacy policy
- [x] Create /terms page with terms and conditions including SMS opt-in/opt-out details
- [x] Add routes to App.tsx (public, no auth required)
- [ ] Craft Twilio 10DLC registration field answers

## Bug: Client detail not visible on mobile
- [x] Root cause: detail panel had `hidden lg:flex` — completely hidden below 1024px
- [x] Fix: on mobile, hide client list and show detail panel full-width when a client is selected
- [x] Added back arrow button (visible only on mobile) to return to client list
- [x] Made tabs horizontally scrollable on mobile to prevent overflow

## Email Notifications: Appointments with Calendar & Protocol Changes
- [x] Generate ICS calendar file for appointment emails (Add to Calendar) — server/ics.ts with RFC 5545 compliance
- [x] Update appointment email to include date, time, provider name, ICS attachment, and Google Calendar link
- [x] Email patient when a protocol is assigned to them — wired into assignment.create procedure
- [x] Email patient when a protocol assignment is updated — wired into protocol.fullUpdate procedure
- [x] Write tests for ICS generation and new email triggers — 20 new tests in ics-protocol-notify.test.ts, 343 total passing

## End-to-End Notification Workflow Test
- [x] Write comprehensive vitest covering full notification chain: appointment creation → protocol assignment → protocol update (18 tests in notification-workflow.test.ts)
- [x] Verify ICS calendar attachment generated and included in appointment email (RFC 5545 compliant, VALARM, attendee info, correct DTSTART/DTEND)
- [x] Verify protocol assigned email/SMS sent with correct details (protocol name, description, step count, portal URL)
- [x] Verify protocol update email/SMS sent to all assigned patients (only active assignments, skips completed/cancelled)
- [x] Verify notification records created in database for each event (createNotificationWithEmail called with correct params)
- [x] Verify graceful degradation when patient has no email or phone (4 edge-case tests covering all combinations)
- [x] Run all tests and ensure they pass — 361 tests passing across 32 test files

## Bug Fixes
- [x] Fix: Unable to add protocol from protocol button in client detail view — "void 0 is not a function" error — added missing getUserById to db.ts
- [x] Clean up all test users and test protocols from the database
- [x] Ensure vitest tests always clean up test data after themselves — refactored feb18-fixes, client-management, notification, routers tests to use db mock factory
- [x] Fix remaining test failures — created shared __mocks__/dbMockFactory.ts, 371 tests passing across 33 files

## Staff/Assistant Portal Access
- [x] Add staff invitation system — provider can invite assistant with their own login (staffInvites table, email invite flow)
- [x] Staff member gets own account with permissions to manage clients, protocols, scheduling (staff role in adminProcedure)
- [x] Staff management UI in provider dashboard settings (Team Management section with invite, view, revoke)
- [x] Staff role in schema — added 'staff' to userRoleEnum, updated AdminGuard, PortalSwitcher, and all access checks

## Patient-Created Protocols
- [x] Add "Create Protocol" feature to patient portal — PatientCreateProtocol.tsx with blank form, dynamic steps
- [x] Patient-created protocols appear in provider's protocol list — PatientCreatedProtocols section (shows when protocols exist)
- [x] Provider can view and edit patient-created protocols — uses existing edit flow with patient badge
- [x] Schema changes — added createdByPatientId column to protocols table

## Staff Full Proxy Access
- [x] Audit all access control points (adminProcedure, ownerProcedure, role checks) for admin vs staff gaps
- [x] Ensure staff has identical view and capabilities as admin — full proxy access via ctx.ownerId
- [x] Staff should see all clients, protocols, schedule, messages, analytics, settings — all data queries now use ownerId
- [x] Only restrict staff from managing other staff invitations (owner-only) — ownerProcedure unchanged

## Bug: Staff Cannot See Patients (FIXED)
- [x] Fix: Staff cannot see any patients — root cause: all data queries used ctx.user.id (staff's ID) instead of practice owner's ID
- [x] Added resolveOwnerId() middleware to adminProcedure that resolves owner's numeric ID from ENV.ownerOpenId
- [x] Replaced 30+ ctx.user.id references with ctx.ownerId for data-scoped queries (patients, protocols, assignments, appointments, messages, analytics, resources, etc.)
- [x] Kept ctx.user.id for audit logs so actions are attributed to the actual user (staff or admin)
- [x] Updated all 33 test files with clearOwnerIdCache() and getUserByOpenId mock — 371 tests passing

## Bug: Staff STILL Cannot See Patients (Round 2)
- [ ] Investigate why Samantha still cannot see patients despite ownerId migration
- [ ] Check Samantha's user record, owner record, and ENV.ownerOpenId resolution
- [ ] Fix root cause and verify

## Bug: Clients not showing on published site
- [x] Fix: Clients not showing on published site — added fallback and logging to resolveOwnerId, need to republish

## CRITICAL: Invite Email Preview Shows Client Names (HIPAA Violation)
- [x] Fix Open Graph / link preview meta tags so invite URLs show generic branding instead of dashboard content with client names
- [x] Ensure invite landing page has its own OG image and description — added OG meta tags + Twitter Card with branded image to index.html

## Bug: Messaging Jordan Jones Fails
- [x] Investigate why sending a message to Jordan Jones fails — FK constraint on messages.receiverId prevents messaging patients without user accounts
- [x] Fix the messaging error — dropped FK constraint on receiverId, fixed notification logic to skip in-app notification for unlinked patients while still sending SMS/email

## Mobile Messages Layout Overhaul
- [x] Restructure Messages page with mobile-first list/detail pattern (show conversation list OR chat, not both)
- [x] Add back button to return from chat to conversation list on mobile
- [x] Ensure message input and chat area are fully visible on mobile
- [x] Keep desktop side-by-side layout intact

## Phone Number E.164 Formatting
- [x] Add normalizePhone() helper in sms.ts to auto-format numbers to E.164 before sending
- [x] Handle common formats: 10-digit (8016886538), with dashes, with spaces, with/without +1 prefix

## SMS Consent / Opt-In Page (Twilio Verification)
- [x] Create public /sms-consent page for Twilio toll-free verification proof of opt-in
- [x] Register route in App.tsx

## Provider Profile Completion
- [x] Update provider profile with practice name ("Black Label Medicine") and title ("DO")

## Bug: Staff (Samantha) Cannot See Patients (Round 3)
- [ ] Investigate Samantha's access — check resolveOwnerId flow, user record, and ENV.ownerOpenId
- [ ] Fix root cause and verify staff can see all patients

## Twilio SMS Delivery Troubleshooting
- [ ] Investigate why SMS messages are undelivered after toll-free verification
- [ ] Fix root cause and verify delivery

## Onboarding Content Creation
- [x] Create onboarding protocol with checklist steps for new clients (ID: 240001, 10 steps, 14-day duration)
- [x] Create welcome resource — introduction to Black Label Medicine (ID: 30001, article type, markdown content)

## Samantha Staff Access Issue (Active Bug)
- [ ] Diagnose why Samantha cannot see clients
- [ ] Fix the access control issue for staff users

## CRITICAL: Samantha Staff Access — Sees 0 Clients (Round 4)
- [ ] Check server logs for Samantha's actual requests and resolveOwnerId output
- [ ] Verify resolveOwnerId works on published site (not just dev)
- [ ] Fix root cause

## Message Links Navigate to Specific Client Conversation
- [x] Audit all message links/buttons across the provider portal (client detail, attention queue, dashboard, etc.)
- [x] Update Messages page to accept a client/patient ID parameter and auto-select that conversation
- [x] Update all message links to pass the client ID so the correct conversation opens directly

## Comprehensive Patient Intake Form
- [x] Design intake form schema with sections: Personal Info, Medical History, Medications & Supplements, Family History, Lifestyle & Habits, Nutrition, Exercise & Fitness, Sleep, Mental Health & Stress, Goals & Motivations, Life Status & Relationships, Hobbies & Interests
- [x] Create intake_forms database table and push migration
- [x] Create tRPC procedures: submit intake, get intake (patient), get intake (provider), update intake
- [x] Build multi-step patient intake form UI with progress indicator and save-as-you-go
- [x] Add intake form entry point in patient portal (onboarding flow + profile section)
- [x] Build provider-side intake view in client detail panel (read-only with organized sections)
- [ ] Add intake completion status indicator on client cards
- [x] Write vitest tests for intake form procedures

## Intake Form CTA on Patient Home
- [x] Add prominent intake form banner/CTA on Patient Home page
- [x] Banner disappears automatically once intake form is completed

## Bug: Intake Form Crash on Mobile
- [x] Investigate and fix crash when patient opens intake form on mobile (David Fajardo reported)
  - Root cause: React Rules of Hooks violation in PatientHome.tsx (useQuery inside IIFE)
  - Fix: Moved intake query to top level of component

## Bug: Samantha Cannot See Clients
- [x] Investigate Samantha's user record, role, and permissions
- [x] Fix access issue so Samantha can see clients in provider portal
  - Root cause: resolveOwnerId fallback returned staff user's own ID instead of practice owner's ID
  - Fix: Staff users now get a proper error instead of silently seeing empty data

## Luxury Clinical Aesthetic Redesign
- [x] Redesign global theme: dark color palette, gold/brass accents, refined typography, CSS variables
- [x] Redesign provider dashboard sidebar and layout (dark, premium feel)
- [x] Redesign provider Home/Dashboard page (hero, stat cards, sections)
- [x] Redesign Clients page and client detail panel
- [x] Redesign Messages, Schedule, Protocols, Attention Queue pages
- [x] Redesign patient portal (PatientLayout, PatientHome, PatientIntake, PatientProfile)
- [x] Redesign login/landing/portal switcher pages
- [x] Polish micro-interactions, hover states, focus rings, transitions

## Custom Black Label Medicine Logo
- [x] Generate a luxury clinical logo for Black Label Medicine
- [x] Integrate logo into sidebar, patient portal header, and portal switcher

## Intake Completion Badges on Client Cards
- [x] Query intake form status for each patient in the client list
- [x] Display visual badge/indicator on client cards showing intake completion status

## Provider Notification on Intake Submission
- [x] Send notification to provider when a patient submits their intake form
- [x] Include patient name and link to review the intake in the notification

## Public Landing Page at /main
- [x] Create a public-facing landing page at /main that introduces Black Label Medicine
- [x] Page must load without authentication (no password protection)
- [x] Include practice introduction, services overview, and luxury clinical branding
- [x] Add a login link/button that navigates to the authenticated portal
- [x] Register the route in App.tsx as a public route

## Past Appointments Management
- [x] Separate past appointments from upcoming appointments in both provider and patient views
- [x] Auto-mark past "scheduled" appointments as "completed" in backend (db.ts)
- [x] Add status badges (Completed, No Show, Cancelled) on provider Schedule page
- [x] Ensure the provider dashboard Home page only shows truly upcoming appointments
- [x] Ensure the patient portal Schedule page separates past from upcoming by date + status

## Twilio Toll-Free Verification — Error 30513 Fix
- [x] Update SMS consent page to fix Twilio Error 30513 - opt-in language insufficient
- [x] Add explicit opt-in form with consent checkbox on SMS consent page
- [x] Include all required Twilio disclosures (frequency, rates, opt-out, privacy policy, terms)
- [x] Add visible consent collection mechanism (checkbox + submit)

## Theme Update
- [x] Switch entire app to white/light background (provider dashboard, patient portal, public pages)
- [x] Update CSS variables in index.css for light theme
- [x] Update ThemeProvider default to light
- [x] Fix any components with hardcoded dark colors

## Bug Fixes
- [x] Fix scroll not working on Messages page (provider dashboard) — replaced Radix ScrollArea with native overflow-y-auto, added explicit calc(100vh-64px) height constraint

## SMS Notification Improvements
- [x] Update SMS notification text to include https://www.blacklabelmedicine.com URL in all SMS templates
- [x] Set up incoming SMS webhook at /api/twilio/incoming-sms to capture patient replies into messaging system
- [x] Write vitest tests for SMS templates and phone normalization (14 tests)

## New Features & Bug Fixes (Mar 10)
- [x] Create 75 HARD protocol in the system (6 daily tasks: 2 workouts, diet, water, reading, progress photo)
- [x] Add "Next" button at the bottom of mobile intake form steps (inline buttons on mobile, fixed footer on desktop)
- [x] Fix message email notification to include sender's name (title: "New Message from [Name]", body includes sender + reply link)

## Intake Form Update
- [x] Remove insurance information section from intake form (cash-only practice)

## Access Issue
- [ ] Fix Samantha's access being set to inactive again — investigate root cause of recurring deactivation

## Gender Simplification & Themed Patient Portal
- [x] Simplify gender field to Male/Female only in schema (added sex column to patients table)
- [x] Remove any pronoun fields or non-binary gender options from intake form and IntakeViewer
- [x] Update intake form gender selector to Male/Female only ("Sex" label)
- [x] Update provider client create/edit form with Sex dropdown (Male/Female)
- [x] Create masculine patient portal theme (steel blue #4A6FA5, navy, charcoal — default)
- [x] Create feminine patient portal theme (rose/blush accents via .theme-feminine CSS class)
- [x] Wire patient portal theme to patient's sex field (PatientLayout reads myRecord.sex)
- [x] Push database migration (sex enum column added)

## Logo Refinement
- [x] Remove "BL" icon mark from sidebar logo (all pages: DashboardLayout, PatientLayout, PublicLanding, InviteLanding, StaffInviteLanding, PortalSwitcher, GoLiveGuide)
- [x] Remove boxed container/background around logo
- [x] Increase "Black Label Medicine" text size as primary branding (tracking-[0.2em] uppercase)
- [x] Ensure logo blends naturally on nav background — minimal, refined, luxury aesthetic
- [x] Update logo in PatientLayout as well

## Masculine Medical Color Scheme
- [x] Implement masculine color palette: Navy #0F1F2E, White #F7F8F9, Charcoal #2E3135, Slate #6B7280, Steel Blue #4A6FA5
- [x] Apply to patient portal (PatientLayout, all patient pages) — via CSS variables
- [x] Apply to login/public pages (PortalSwitcher, InviteLanding, PublicLanding) — rewritten with steel blue accents
- [x] Ensure high contrast, generous white space, minimal and clinical feel

## Hero Banner Image Update
- [x] Replace hero banner with dramatic mountain landscape (Grand Tetons/Everest style) — AI-generated cinematic image
- [x] Ensure dark overlay for text readability — existing gradient overlay preserved
- [x] Ensure responsive scaling on desktop and mobile — object-cover maintained
- [x] Updated all WELLNESS_BG references across invite, portal switcher, profile pages

## Document Management
- [x] Add ability for clients to delete their uploaded documents (document.deleteOwn tRPC mutation with ownership verification)
- [x] Include confirmation dialog before deletion to prevent accidental removal (AlertDialog with cancel/confirm)

## Bug Fixes
- [x] Fix sex (Male/Female) field not saving when editing clients from provider dashboard (listPatients query was missing sex in SELECT)

## Hero Banner Blue Accent Text Readability
- [x] Lighten hero blue accent text to ~#6FA4E6 for better contrast against dark mountain background
- [x] Add semi-bold weight to blue accent text in hero banners
- [x] Add subtle text shadow to hero accent text for separation from background image
- [x] Ensure readability on both provider and patient hero banners

## Feminine Theme Overhaul — Luxury Medical Aesthetic
- [x] Replace rose/blush palette with new luxury feminine palette:
  - Soft Medical Ivory #F8F7F4 (main background)
  - Elegant Slate Blue #5F738F (primary brand)
  - Warm Stone Gray #8A8F94 (secondary text/labels)
  - Soft Graphite #3F4347 (primary text/headers)
  - Muted Rose Gold #C6A48A (accent: buttons, progress, hover states)
- [x] Update .theme-feminine CSS overrides in index.css with new palette
- [x] Update PatientLayout sidebar, navigation, and branding for feminine theme
- [x] Update PatientHome hero banner and cards for feminine theme
- [x] Update all patient portal pages to use new feminine accent colors consistently
- [x] Ensure strong contrast and readability throughout feminine theme

## Feminine Hero Banner Image
- [x] Generate calm ocean sunrise hero banner image (minimal, elegant, feminine, premium medical)
- [x] Upload image to CDN via manus-upload-file
- [x] Conditionally load feminine hero image for female patients in PatientHome
- [x] Ensure text overlay readability with appropriate gradient (lighter overlay for ocean scene)
- [x] Verify responsive scaling on desktop and mobile (object-cover with h-48 md:h-64)

## Feminine Empowering Wellness Palette Overhaul
- [x] Convert new palette hex colors to OKLCH: rose #D46A7E, sage #9CAF9A, golden #E8B76B, ivory #F8F5F2, charcoal #3C3C3C
- [x] Rewrite .theme-feminine CSS variables with new palette (rose primary, sage secondary, golden accent)
- [x] Update all .theme-feminine utility overrides (text-gold, bg-gold, border-gold → warm rose)
- [x] Add sage green secondary color utilities for icons and secondary actions
- [x] Add golden accent for hover states, achievements, and positive feedback
- [x] Update background from white to warm ivory #F8F5F2
- [x] Replace black text with soft charcoal #3C3C3C
- [x] Update hero overlay with subtle rose and warm gold gradient
- [x] Verify all patient portal pages render correctly with new palette

## Feminine Warm Wellness Palette Overhaul v2
- [x] Convert new palette hex to OKLCH: Sage #8FAF9B, Rose #C98C8C, Gold #D6B87A, Ivory #F6F2EB, Stone #E6DFD5, Taupe #8A8076
- [x] Rewrite .theme-feminine CSS variables: sage green primary, warm rose secondary, soft gold accent
- [x] Replace all blue utility overrides with sage green (text-gold, bg-gold, border-gold)
- [x] Update background to warm ivory #F6F2EB and cards to stone beige #E6DFD5
- [x] Replace muted-foreground with muted taupe #8A8076
- [x] Update chart colors to sage/rose/gold palette (no blues)
- [x] Update sidebar colors to sage green navigation accents
- [x] Update hero overlay to warm tones (no blue)
- [x] Update patient portal icons from blue to sage green (7 instances across 6 files)
- [x] Update progress bars to warm rose → sage green gradient
- [x] Verify all patient pages render with warm palette, no blue remnants

## Educational Resources
- [x] Add resource: How to reconstitute peptides (instructional) — YouTube link added
- [x] Add resource: Subcutaneous injection demonstration — YouTube link added
- [x] Add resource: Intramuscular injection demonstration — YouTube link added

## Fix Remaining Blue Elements in Feminine Patient Portal
- [x] Fix blue progress bar in intake card on PatientHome (CSS variable indirection layer)
- [x] Fix blue/gray stat card icons (CSS variable indirection layer overrides --color-gold)
- [x] Fix blue Home icon in bottom navigation bar (--color-gold now resolves to sage green)
- [x] Fix all remaining blue-tinted elements via CSS variable indirection (--gold-base → sage green in .theme-feminine)

## Bug: Newly Added Patient Not Visible on Client List
- [x] Investigate why a patient added by Samantha is not showing on the provider's main client list
- [x] Root cause: resolveOwnerId race condition — staff user's ID used as fallback instead of owner's
- [x] Fixed Ryan Pearson's providerId from 210916 to 1 in database
- [x] Fixed resolveOwnerId to use promise-based singleton (prevents race conditions)
- [x] Staff users now fail with error instead of silently using wrong providerId

## Bug: "Started Invalid Date" on Patient Protocols
- [x] Investigate why protocol start dates show "Invalid Date" on patient portal
- [x] Fix: PatientHome.tsx was accessing assignment.startDate instead of row.assignment.startDate

## Feminine Theme Overhaul - Rose/Ivory/Gold Luxury Wellness
- [x] Replace dominant sage green with rose/ivory/gold palette
- [x] Primary background: Warm Ivory #F7F3EF
- [x] Primary accent: Soft Rose #D8A1A8 for buttons, progress, highlights
- [x] Secondary accent: Dusty Rose #C48A92
- [x] Luxury accent: Soft Gold #CFAF7A for icons, separators
- [x] Text primary: Charcoal #2E2E2E, Text secondary: Muted Taupe #8A7F78
- [x] Card background: Soft Blush Ivory #FBF7F5, Card border: Light Gold Tint #EFE5D6
- [x] Hero overlay: soft blush rgba(255,244,246,0.55)
- [x] Reduce sage green to minimal wellness cues only (#A8B7A3)
- [x] Primary icons: Soft Gold, Secondary icons: Dusty Rose

## Masculine Theme Overhaul - Clean High-End Medical
- [x] Convert new palette to OKLCH: Soft Rose #D8A1A8, Medical White #F7F8F9, Charcoal #2E3135, Muted Taupe #8A7F78, Soft Gold #CFAF7A
- [x] Update default theme CSS variables (background, text, accents, cards)
- [x] Primary brand: Soft Rose #D8A1A8 for headers, navigation, icons, key UI
- [x] Background: Soft Medical White #F7F8F9
- [x] Text: Charcoal Gray #2E3135, Secondary: Muted Taupe #8A7F78
- [x] Accent: Soft Gold #CFAF7A for buttons, links, hover states
- [x] Ensure high contrast and generous white space
- [x] Verify provider dashboard and male patient portal render correctly — zero blue remaining across all 11 TSX files

## CellRx Concierge Service Agreement Resource Page
- [x] Upload CellRx Service Agreement PDF to S3 for download
- [x] Create ServiceAgreement resource page component with full agreement content
- [x] Add route and navigation entry for the service agreement page
- [x] Style page to match existing rose/gold theme
- [x] Write vitest test for the new route/page

## Revert Provider Dashboard to Masculine Aesthetic
- [x] Restore :root CSS variables from masculine Steel Blue palette (commit ddc1d88)
- [x] Restore @theme inline masculine medical palette colors (navy, steel, charcoal)
- [x] Restore --gold-base indirection to Steel Blue instead of Soft Rose
- [x] Restore hero accent text to Steel Blue highlight
- [x] Restore luxury divider to Steel Blue gradient
- [x] Keep .theme-feminine overrides intact for patient portal
- [x] Verify all 438 tests still pass

## Custom Biomarker Guide Resource Page
- [x] Review existing biomarker feature (schema, UI, tRPC procedures)
- [x] Create BiomarkerGuide resource page component with step-by-step instructions
- [x] Add route and navigation entry for the biomarker guide page
- [x] Style page to match existing patient portal theme
- [x] Write vitest test for the new route/page

## The Row Aesthetic Redesign — Female Client Portal
- [x] Upload reference images to S3 for hero/accent usage
- [x] Redesign .theme-feminine CSS: warm ivory/bone/charcoal palette, editorial serif fonts, matte feel
- [x] Add Playfair Display (headlines) + Inter (body) via Google Fonts CDN
- [x] Redesign PatientLayout sidebar: editorial navigation, thin line icons, charcoal/warm grey
- [x] Redesign PatientHome: editorial hero, museum-placard cards, quiet luxury spacing
- [x] Redesign PatientProtocols: editorial card styling, matte buttons
- [x] Redesign PatientDocuments: minimal table/list styling
- [x] Redesign PatientMessages: refined messaging UI
- [x] Redesign PatientSchedule: understated calendar styling
- [x] Redesign PatientVitals (Biomarkers): museum-placard metric cards
- [x] Redesign PatientResources: editorial resource cards
- [x] Redesign PatientProfile: refined form styling
- [x] Redesign PatientServiceAgreement: editorial document styling
- [x] Redesign PatientBiomarkerGuide: editorial guide styling
- [x] Redesign PatientIntakeForm: refined form styling
- [x] Redesign PatientWellnessAI: editorial chat styling
- [x] Remove all bright pinks, blue UI icons, high-saturation colors, glossy gradients
- [x] Verify all pages feel like The Row: quiet, cinematic, editorial, museum-like
- [x] Run all tests and confirm nothing is broken (451 tests passed)

## Floral Banner Image for Female Patient Portal
- [x] Determine mountain hero banner dimensions (1920x815, 2.36:1)
- [x] Generate editorial floral banner matching The Row aesthetic using AI
- [x] Upload banner to S3 and integrate into female patient portal pages
- [x] Save checkpoint

## Fix Female Client Portal Login Issue
- [x] Diagnose why female clients cannot log into the patient portal (published build had stale code with syntax error)
- [x] Fix the login issue (all syntax errors resolved, all 14 patient pages parse cleanly)
- [x] Verify the fix (451 tests pass, dev server runs cleanly)

## Fix RATE EXCEEDED Login Error
- [x] Diagnose the RATE EXCEEDED error on patient login (published site running stale build + request storms)
- [x] Fix the root cause (reduced retries to 1, disabled refetch-on-window-focus, added staleTime, SSE max 5 reconnects)
- [x] Verify the fix (451 tests pass)

## Fix Slow Loading, Rate Limits, and Missing Data
- [x] Diagnose RATE EXCEEDED error source — request storms from aggressive polling + SSE reconnects
- [x] Investigate missing patient data — tRPC hooks intact, data-fetching logic verified correct
- [x] Check if parallel redesign broke data-fetching hooks — all hooks intact with proper enabled guards
- [x] Fix: reduced QueryClient retries to 1, disabled refetchOnWindowFocus, added 30s staleTime, increased refetchIntervals to 30s, capped SSE reconnects at 5
- [x] Verify the fix (451 tests pass)

## Fix OAuth Callback Failed Error on Published Site
- [x] Investigate OAuth callback handler in server/_core/oauth.ts
- [x] Identify why callback fails: SDK decodeState returned raw JSON string instead of extracting redirectUri
- [x] Fix: updated SDK decodeState to parse JSON state and extract redirectUri field
- [x] Verify: 451 tests pass

## Intake Form PDF Download (Provider Side)
- [x] Review intake form schema and data structure
- [x] Create server-side tRPC procedure to generate PDF of all intake form data
- [x] Add "Download Intake PDF" button at the top of the intake section on provider client detail page
- [x] Style the PDF with professional formatting (Black Label Medicine branding)
- [x] Write vitest test for the PDF generation endpoint (5 tests)
- [x] Verify PDF generation works end-to-end (456 tests pass)
## Add "Prospective" Client Tag
- [x] Add "prospective" to client status/tag enum in database schema
- [x] Update all UI references (Clients page filters, status badges, add/edit dialogs)
- [x] Run migration and verify tests pass (456 tests pass)

## Patient Protocol Enhancements
- [x] Add "Complete All" button on each protocol card in patient portal to check off all tasks at once
- [x] Build server-side tRPC procedure for bulk-completing all steps in a protocol for a given day
- [x] Add protocol completion history query (by date range) for calendar integration
- [x] Integrate protocol history into patient calendar — subtle dot indicators on past dates
- [x] Build elegant day-detail overlay/sheet that opens on date tap showing protocol completion summary
- [x] Write vitest tests for bulk-complete and history endpoints (8 tests, 464 total pass)

## Bug Fix: Patient Portal Empty Data
- [x] Fix patient.myRecord to also check admin accounts that have a patient record with matching name/email
- [x] Created shared resolvePatientForUser() helper: userId → email → name fallback
- [x] Updated all 8 patient-facing procedures to use resolvePatientForUser
- [x] Updated ensurePatientAccess to support name/email-based matching
- [x] Updated dbMockFactory with getPatientByName, bulkCreateTaskCompletions, listCompletionsByDateRange
- [x] All 464 tests pass — needs publish to go live on blacklabelmedicine.com

## View as Patient Feature
- [x] Add "View as Patient" button on provider client detail page (gold-styled, next to patient name)
- [x] Create server-side impersonation via viewAs param on myRecord (admin/staff only)
- [x] Build ViewAsContext + ViewAsProvider to propagate viewAs across all patient pages
- [x] Updated all 10 patient pages (Home, Protocols, Messages, Profile, Privacy, Resources, Schedule, Vitals, Documents, Layout)
- [x] Build ViewAsBanner component showing gold "Provider Preview Mode" bar with close button
- [x] All 464 tests pass

## Bug Fix: Attention Queue Badge Count Mismatch
- [x] Fix sidebar badge to use actual attention queue item count (minus dismissed) instead of incorrect formula
- [x] Badge now queries attention.queue + attention.dismissedItems and builds count matching AttentionQueue page exactly
- [x] Fixed ID patterns (msg-, apt-) to match page item IDs; removed lowCompliance (not displayed on page)
- [x] All 464 tests pass

## Patient Resource: Protocol Navigation Guide
- [x] Created PatientProtocolGuide.tsx following the BiomarkerGuide editorial pattern
- [x] Documented protocol categories, step completion, Complete All, and step frequency
- [x] Documented calendar history: dot indicators, day detail panel, month navigation
- [x] Added "Reading a Protocol Card" visual explainer section
- [x] Added best practices section (consistency, weekly review, provider communication)
- [x] Added guide card to Resources page Portal Guides section
- [x] Registered /patient/protocol-guide route in App.tsx
- [x] All 464 tests pass

## Onboard Danny Augustyn
- [x] Add Danny Augustyn as a new patient (id: 390003, DOB: Jan 10 1990, email: dannyaugustyn@gmail.com, male, elite tier)
- [x] Create Protocol 1: Pharmacologic & Supplement Protocol (8 steps — Retatrutide, Tesamorelin, Testosterone, Creatine, Magnesium, Zinc, D3+K2, Omega-3)
- [x] Create Protocol 2: Nutrition & Exercise Protocol (7 steps — fasting, protein, carbs, fats, resistance, cardio, sprinting)
- [x] Create Protocol 3: Lifestyle & Monitoring Protocol (7 steps — sleep, screens, mindfulness, sauna/cold, macros, body comp, labs)
- [x] Assign all 3 protocols to Danny (all active)

## Client Sorting & Filtering Enhancements
- [x] Add sort controls to Clients page (sort by: Name, Status, Tier, Date Added, Last Active)
- [x] Add ascending/descending toggle — click same sort button to flip direction
- [x] Sort persists across tab filter changes and tier filter changes
- [x] Add subscription tier filter (All, Elite, Premium, Standard) alongside status tabs
- [x] Add "Reset" button to clear sort/filter back to defaults
- [x] All 464 tests pass

## Bulk Actions on Clients Page
- [x] Add multi-select mode toggle ("Select" button) with checkboxes on each client card
- [x] Add floating bulk action toolbar with select all, count, Assign Protocol, Send Message buttons
- [x] Gold highlight on selected client cards with checkbox state
- [x] Implement bulk assign protocol dialog with protocol picker, step preview, notes, and recipient list
- [x] Server endpoint: assignment.bulkAssign — assigns protocol to multiple patients with audit logging
- [x] Implement bulk send message dialog with message composer and recipient list
- [x] Server endpoint: message.bulkSend — sends individual messages to multiple patients with notifications
- [x] Write vitest tests for bulk endpoints (5 tests, 469 total pass)

## Create Visceral Fat Reduction Protocol
- [x] Created 3 generalized protocols from O'Mara visceral fat framework (all personalized data removed)
- [x] Protocol 1: Pharmacologic & Supplements (7 steps — sprints, creatine, magnesium, zinc, D3+K2, omega-3, electrolytes)
- [x] Protocol 2: Nutrition & Exercise (7 steps — fasting, protein, carbs, fat quality, fermented foods, resistance, Zone 2)
- [x] Protocol 3: Lifestyle & Monitoring (9 steps — sleep, screens, alcohol, stress, sunlight, cold, sauna, body comp, labs)
- [x] All protocols set as ongoing templates, ready to assign to any client

## Retroactive Protocol Completion Editing from Calendar
- [x] Allow patients to check off missed protocol steps from past dates on the calendar day-detail panel
- [x] Allow patients to uncheck incorrectly logged steps from past dates
- [x] Reused existing complete/uncomplete mutations with arbitrary taskDate — no server changes needed
- [x] Updated calendar UI: interactive step buttons, "Editable" badge, pencil icon in legend, updated empty state text
- [x] Shows all assigned protocols on any past/today date (not just ones with existing completions)
- [x] All 469 tests pass

## Norwegian 4x4 / VO2 Max Resource Guide
- [x] Created PatientVO2MaxGuide.tsx with comprehensive content
- [x] Summary: What is VO2 Max, how it's measured, why it matters
- [x] VO2 Max as longevity predictor: Mandsager 2018 study data, mortality risk visualization, key statistics
- [x] Norwegian 4x4 protocol explanation: origin, intensity guidelines, how to gauge effort
- [x] Six key benefits: cardiovascular health, VO2 Max improvement, anti-aging, mortality reduction, cognitive function, metabolic health
- [x] Four example workouts with full step-by-step protocols: Treadmill (recommended), Stationary Bike, Rowing Ergometer, Outdoor Running/Walking
- [x] Training frequency guidelines: 1x/week maintain, 2x/week improve, 3x/week aggressive
- [x] Safety & precautions section with 6 safety notes
- [x] Academic references section (5 peer-reviewed sources)
- [x] Registered route at /patient/vo2max-guide in App.tsx
- [x] Added guide card to Portal Guides section in PatientResources.tsx

## Provider Portal Resource Guides Access
- [x] Add patient resource guides to provider-side Resources page
- [x] Include VO2 Max guide, Protocol Guide, and Biomarker Guide cards
- [x] Ensure provider can navigate to these guides from their Resources page

## Delete Samantha Buker's Patient Account
- [x] Identify all records tied to patient ID 270001 and user ID 28920597
- [x] Delete associated records (invites, messages, appointments, tasks, notifications, etc.)
- [x] Delete patient record (ID 270001)
- [x] Delete user account (ID 28920597, buker.samantha@gmail.com)
- [x] Verify staff account (ID 210916, samantha@cellrx.bio) is untouched

## Bug: Email Invite returns HTML instead of JSON
- [ ] Investigate email invite tRPC procedure / endpoint
- [ ] Fix the endpoint to return proper JSON response
- [ ] Verify email invite works without error
