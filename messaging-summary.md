# Black Label Medicine — Portal Messaging & Notification Summary

**Prepared for:** Dr. Jacob Egbert  
**Date:** February 21, 2026

---

## Overview

The Black Label Medicine portal has a comprehensive multi-channel communication system that spans three delivery channels: **in-app messaging**, **email** (via Resend), and **SMS** (via Twilio). These channels work together to ensure patients and providers stay connected. Below is a complete audit of every messaging and notification capability currently built into the portal.

---

## 1. Direct Messaging (Provider ↔ Patient)

The portal includes a full real-time messaging system between providers and patients, accessible from both the provider dashboard and the patient portal.

| Feature | Status | Details |
|---|---|---|
| Send text messages | **Active** | Both provider and patient can send messages within a conversation thread |
| File attachments | **Active** | Users can attach files (images, documents) to messages via S3 upload |
| Delete attachments | **Active** | Senders can delete their own attachments from messages |
| Conversation list | **Active** | Provider sees all patient conversations; patients see their provider thread |
| Search conversations | **Active** | Provider can search across conversations by patient name |
| New conversation | **Active** | Provider can start a new conversation with any patient from the client list |
| Read receipts | **Active** | Messages are marked as read when the recipient opens the conversation |
| Message types | **Active** | Supports `text`, `system`, and `alert` message types for audit purposes |
| Mobile layout | **Active** | Responsive list/detail pattern — shows conversation list OR chat on mobile |
| Unlinked patients | **Active** | Provider can message patients who haven't created accounts yet (messages wait for them) |

**Provider access:** `/provider/messages`  
**Patient access:** `/patient/messages`

---

## 2. Email Notifications (via Resend)

Emails are sent automatically through the Resend API when specific events occur. Each email uses a branded HTML template with Black Label Medicine styling.

| Trigger Event | Email Sent To | Subject Line | Includes |
|---|---|---|---|
| Patient invite generated | Patient | "You're invited to [provider]'s patient portal" | Invite link, provider name |
| New message from provider | Patient | "New message from [provider]" | Message preview, portal link |
| Appointment created | Patient | "New Appointment: [type] on [date]" | Date, time, type, notes, Google Calendar link, `.ics` calendar attachment |
| Protocol assigned | Patient | "New Protocol: [name]" | Protocol name, description, step count, portal link |
| Protocol updated | Patient | "Protocol Updated: [name]" | Protocol name, change description, portal link |
| Generic notification | Patient | Custom title | Custom body, portal link |

All email templates are defined in `server/email.ts` and sent via the `sendEmail()` helper. Emails gracefully degrade — if Resend is not configured or the patient has no email address, the system logs a warning and continues without failing.

---

## 3. SMS Notifications (via Twilio)

SMS messages are sent alongside emails through the unified `patientNotify` module. Each SMS uses a concise template prefixed with "Black Label Medicine:".

| Trigger Event | SMS Body Example | Status |
|---|---|---|
| Patient invite | "Black Label Medicine: Dr. Egbert has invited you to join the patient portal. Accept your invitation here: [url]" | **Pending** (toll-free verification in progress) |
| New message from provider | "Black Label Medicine: New message from Dr. Egbert: '[preview]' — Open your portal to reply." | **Pending** |
| Appointment reminder | "Black Label Medicine: Reminder — Follow-Up Consultation with Dr. Egbert on March 5, 2026 at 2:00 PM." | **Pending** |
| Protocol assigned | "Black Label Medicine: Dr. Egbert has added a new protocol to your plan: '[name]'. Open your portal to review." | **Pending** |
| Protocol updated | "Black Label Medicine: Your protocol '[name]' has been updated by Dr. Egbert. Open your portal to review changes." | **Pending** |
| Generic notification | "Black Label Medicine: [title] — [body]" | **Pending** |

All SMS functionality is fully coded and tested. The `normalizePhone()` helper automatically converts stored phone numbers (e.g., `8016886538`) to E.164 format (`+18016886538`). SMS delivery is blocked only because the toll-free number (+1 833-712-4936) is awaiting Twilio verification. Once approved, all SMS will begin delivering immediately with no code changes required.

---

## 4. In-App Notifications

The portal has a full in-app notification system with a bell icon in the header, notification center pages, and badge counts.

| Feature | Status | Details |
|---|---|---|
| Notification bell (unread count) | **Active** | Shows unread count badge in the header for both provider and patient |
| Notification list (paginated) | **Active** | Full notification center with filtering and pagination |
| Mark as read (single) | **Active** | Click a notification to mark it as read |
| Mark all as read | **Active** | Bulk action to clear all unread notifications |
| Delete notification | **Active** | Remove individual notifications |
| Deep linking | **Active** | Notifications link to related entities (messages, appointments, etc.) |

Notification types supported: `message`, `task_overdue`, `task_reminder`, `appointment_reminder`, `compliance_alert`, `subscription_expiring`, `milestone_reached`, and `system`.

**Provider access:** `/provider/notifications`  
**Patient access:** `/patient/notifications`

---

## 5. Patient Invite System

The portal includes a complete invite workflow for onboarding new patients.

| Feature | Status | Details |
|---|---|---|
| Generate invite link | **Active** | Creates a unique token-based invite URL for a patient |
| Send invite via email | **Active** | Branded email with invite link sent to patient's email |
| Send invite via SMS | **Pending** | SMS invite sent to patient's phone (awaiting Twilio verification) |
| Invite landing page | **Active** | Public `/invite` page where patients accept their invitation |
| Accept invite & link account | **Active** | Patient creates account and is linked to their patient record |
| Re-send existing invite | **Active** | If an invite already exists, re-sends without creating a duplicate |

---

## 6. Staff Invite System

The practice owner can invite additional staff members (e.g., nurses, office managers) to the provider portal.

| Feature | Status | Details |
|---|---|---|
| Generate staff invite | **Active** | Owner-only action to invite staff via email |
| Staff invite landing page | **Active** | Public `/staff-invite` page for staff to accept invitations |
| Role assignment | **Active** | Invited staff receive the `staff` role with appropriate permissions |

---

## 7. Appointment Calendar Integration

When appointments are created, the email notification includes calendar integration.

| Feature | Status | Details |
|---|---|---|
| `.ics` file attachment | **Active** | RFC 5545 compliant calendar file attached to appointment emails; works with Apple Calendar, Google Calendar, and Outlook |
| Google Calendar link | **Active** | Direct "Add to Google Calendar" URL included in the email body |

---

## 8. Owner Notifications (Manus Platform)

The portal can send push notifications to the practice owner through the Manus platform notification system.

| Feature | Status | Details |
|---|---|---|
| `notifyOwner()` helper | **Active** | Server-side function to push alerts to the owner's Manus dashboard |
| `system.notifyOwner` tRPC mutation | **Active** | Can be called from client or server for operational alerts |

---

## Channel Status Summary

| Channel | Provider | Technology | Current Status |
|---|---|---|---|
| In-app messaging | Direct messages | tRPC + MySQL | **Fully operational** |
| In-app notifications | Bell + notification center | tRPC + MySQL | **Fully operational** |
| Email | Transactional emails | Resend API | **Fully operational** |
| SMS | Text message alerts | Twilio | **Code complete — awaiting toll-free verification** |
| Calendar | `.ics` + Google Calendar | RFC 5545 / URL | **Fully operational** |
| Owner alerts | Platform notifications | Manus Notification API | **Fully operational** |

---

## Consent & Compliance

The portal includes an SMS consent page at `/sms-consent` that documents opt-in procedures, message types, frequency, opt-out instructions (STOP/HELP), and HIPAA privacy practices. This page was created specifically for the Twilio toll-free verification process.
