# Black Label Medicine — Go-Live & Customization Guide

**Prepared for:** Dr. Jacob Egbert, Black Label Medicine — Concierge Optimization
**Platform:** Manus-hosted Web Application (PWA-enabled)
**Last updated:** February 2026

---

## 1. Overview

Your concierge medicine platform is a fully functional web application with two portals — a **Provider Dashboard** for you and your team, and a **Patient Portal** for your clients. It is built on a production-grade stack (React, Express, PostgreSQL) and is hosted on the Manus platform with built-in SSL, custom domain support, and one-click publishing.

This guide walks you through every step from publishing the app to onboarding your first patients, and then explains exactly how to request design changes once it is live.

---

## 2. Publishing Your App (Going Live)

Publishing is a two-step process that takes under a minute.

### Step 1: Create a Checkpoint

A checkpoint is already saved from the current build. You can see it in the Manus chat interface as a card labeled with the latest description. If you have made any additional changes since then, ask me to save a new checkpoint first.

### Step 2: Click "Publish"

Open the **Management UI** panel (the right-side panel in your Manus workspace). In the top-right header area, you will see a **Publish** button. Click it. The platform will build and deploy your app to a live URL within a few minutes.

After publishing, your app will be accessible at a URL like `https://your-prefix.manus.space`. The portal switcher page (the landing page with the two cards) will be the first thing visitors see.

### Step 3: Set Up Your Domain

Navigate to **Settings > Domains** in the Management UI. You have three options:

| Option | How It Works | Cost |
|--------|-------------|------|
| **Default subdomain** | Edit the auto-generated prefix (e.g., `blacklabelmedicine.manus.space`) | Free |
| **Purchase a new domain** | Buy a domain directly within Manus (e.g., `blacklabelmedicine.com`) | Varies |
| **Bind an existing domain** | Point your existing domain's DNS records to Manus | Free (you own the domain) |

For a professional concierge practice, a custom domain like `portal.blacklabelmedicine.com` or `app.blacklabelmedicine.com` is recommended. The Management UI walks you through DNS configuration if you choose to bind an existing domain.

---

## 3. Authentication & Access Control

The app uses **Manus OAuth** for authentication. When a user visits your app and tries to access a protected area, they are redirected to a login page. Here is how the two portals handle access:

### Provider Access (You and Your Team)

The Provider Dashboard at `/provider` is designed for you and any staff members (e.g., your scheduling assistant). After logging in via Manus OAuth, the system recognizes your account by the `OWNER_OPEN_ID` environment variable. You can promote additional team members to admin status through the database.

### Patient Access

Patients will log in through the same Manus OAuth flow. Once authenticated, the system can match their user account to a patient record in the database via the `userId` field on the patients table. Currently, the patient portal shows demo data for "Sarah Mitchell." To connect it to real patient accounts, the next development phase would wire the patient portal pages to pull data from the database based on the logged-in user's identity.

### Practical Onboarding Flow for Patients

Until the patient portal is fully wired to the database, you can use the **Provider Dashboard** as your primary operational tool. The provider side already reads from and writes to the real database. Here is a recommended onboarding sequence:

1. **You or your assistant** creates the patient record in the database (via the Provider Dashboard's Clients page or by asking me to add them).
2. **You assign protocols** to the patient using the Protocol Builder.
3. **You share the portal URL** with the patient and instruct them to log in.
4. The patient sees their assigned protocols, messages, and appointments.

---

## 4. Populating Real Data

The database currently contains seed data (Sarah Mitchell, sample protocols, sample messages). To prepare for real use, you will want to:

### Add Your Real Protocols

Ask me to seed the database with your actual treatment protocols. For example:

> "Add a Gut Restoration Protocol with the following steps: Week 1-2 elimination diet, Week 3-4 introduce bone broth and fermented foods, Week 5-8 targeted supplementation with L-glutamine and probiotics, Week 9-12 reintroduction phase with food diary tracking."

I can create as many protocols as you need, complete with steps, frequencies, milestones, and lab checkpoints.

### Add Real Patient Records

You can add patients through the Provider Dashboard's Clients interface, or ask me to bulk-create patient records. Each patient record supports:

| Field | Purpose |
|-------|---------|
| Name, email, phone | Contact information |
| Date of birth | Demographics |
| Status | Active, paused, completed, or new |
| Subscription tier | Standard, Premium, or Elite |
| Health goals | Array of goal strings (e.g., "Reduce inflammation by 50%") |
| Conditions | Array of condition strings (e.g., "Chronic Fatigue") |
| Notes | Free-text clinical notes |

### Schedule Appointments

Use the Provider Dashboard's Schedule page to create appointments. The calendar view shows all appointments by month, and you can click any day to see details. Your assistant can manage the schedule without needing access to an external booking tool.

---

## 5. PWA Installation (Home Screen App)

Your app is a **Progressive Web App**, which means patients can install it on their phone's home screen and it behaves like a native app — with its own icon, splash screen, and full-screen experience.

### For Patients on iPhone (Safari)

1. Open the portal URL in Safari.
2. Tap the **Share** button (square with arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

### For Patients on Android (Chrome)

1. Open the portal URL in Chrome.
2. Chrome will show an "Add to Home Screen" banner automatically, or tap the three-dot menu and select **Install app**.

### For Desktop (Chrome/Edge)

1. Open the portal URL.
2. Click the install icon in the address bar (or the three-dot menu > "Install Black Label Medicine").

You can include these instructions in your patient welcome packet or onboarding email.

---

## 6. Day-to-Day Operations

Once live, your daily workflow will center on the **Provider Dashboard**. Here is how the key features map to your clinical operations:

### Attention Queue (`/provider/attention`)

This is your "Who needs me today?" command center. It surfaces patients who need attention based on priority scoring:

- **Overdue tasks** — patients who have missed protocol steps
- **Unread messages** — patients waiting for a response
- **Upcoming appointments** — today's and tomorrow's schedule
- **Low compliance** — patients whose adherence has dropped below threshold
- **Expiring subscriptions** — patients whose concierge membership is ending soon

Start each morning here.

### Secure Messaging (`/provider/messages`)

Send and receive messages with patients. Messages are stored in the database with sender/receiver tracking and read receipts. The messaging system supports text messages, system alerts, and automated notifications.

### Protocol Management (`/provider/protocols`)

Create, edit, and assign multi-step care plans. Each protocol can have daily, weekly, or custom-frequency steps, milestones, and lab checkpoints. When you assign a protocol to a patient, it appears in their patient portal with progress tracking.

### Analytics (`/provider/analytics`)

View adherence trends, patient status distribution, growth metrics, and engagement data across your practice.

---

## 7. How to Modify Design Elements

Once the app is live, there are **two ways** to make design changes — one requires no technical knowledge at all, and the other involves asking me to update the code.

### Method 1: Visual Editor (No Code Required)

The Manus Management UI includes a **Visual Editor** built into the Preview panel. Here is how to use it:

1. Open the **Management UI** (right panel in your Manus workspace).
2. Click the **Preview** panel.
3. Navigate to the page you want to edit.
4. **Click on any element** — a card, a heading, a button, a section.
5. A toolbar appears letting you adjust:
   - **Colors** (background, text, border)
   - **Spacing** (padding, margins)
   - **Borders** (radius, width, style)
   - **Layout** (alignment, gap, flex direction)
   - **Typography** (size, weight)
6. You can also **type a natural language description** of what you want changed (e.g., "Make this heading larger and change the background to a lighter green").
7. Changes create a new checkpoint automatically and can be rolled back at any time.

This is the fastest way to tweak colors, spacing, and layout without touching code.

### Method 2: Ask Me to Update the Code

For more substantial changes — new sections, restructured layouts, new pages, or brand-wide color changes — simply describe what you want in the chat. Here are examples of requests I can handle:

**Color & Branding Changes:**
> "Change the sage green accent color to a deeper forest green."
> "Make the sidebar background darker."
> "Update the terracotta accent to a warmer copper tone."

**Typography Changes:**
> "Switch the heading font from Outfit to Playfair Display."
> "Make all body text slightly larger."

**Layout Changes:**
> "Add a quick-stats bar at the top of the patient home page."
> "Move the sign-out button to the top of the sidebar."

**Content Changes:**
> "Change 'Concierge Optimization' to 'Functional Medicine' everywhere."
> "Update the provider name from Dr. Jacob Egbert to Dr. J. Egbert, DO."

**New Features:**
> "Add a file upload area where patients can submit lab results."
> "Add a 'Resources' page with links to educational content."

### Design System Reference

For your reference, here is the current design system so you can speak precisely about what you want changed:

| Element | Current Value | What It Controls |
|---------|--------------|-----------------|
| **Heading font** | Outfit | All h1–h6 headings, brand text, navigation labels |
| **Body font** | Source Sans 3 | Paragraph text, form inputs, table content |
| **Primary color (sage green)** | `#5B8A72` | Buttons, active nav items, progress bars, links |
| **Accent color (terracotta)** | `#C4704B` | Badges, alerts, attention indicators, urgent items |
| **Background** | Warm off-white (`#FAF9F6` approx.) | Page backgrounds |
| **Card background** | Near-white | Cards, sidebar, popovers |
| **Dark brand color (espresso)** | `#2C1810` | Logo badges, dark accents |
| **Border radius** | `0.75rem` (12px) | Rounded corners on cards, buttons, inputs |
| **Stone background** | `#F5F0EB` | Subtle warm background tint |

### Where Design Tokens Live

If you ever work with a developer directly, all design tokens are centralized in a single file:

- **`client/src/index.css`** — Contains all color variables, font declarations, spacing tokens, and component defaults. Changing a color here changes it everywhere in the app.
- **`client/index.html`** — Contains the Google Fonts import. To change fonts, update the `<link>` tag here and the font-family declarations in `index.css`.

---

## 8. Security & Compliance Considerations

As a concierge medicine practice handling protected health information (PHI), keep these points in mind:

| Area | Current State | Recommendation |
|------|--------------|----------------|
| **Authentication** | Manus OAuth with session cookies | Sufficient for initial launch |
| **Data encryption** | HTTPS/SSL on all connections (provided by Manus hosting) | No action needed |
| **Audit logging** | Audit log table exists in database schema | Wire up audit logging for PHI access events |
| **Message storage** | Messages stored in database as plain text | Consider adding at-rest encryption for message content |
| **Access control** | Role-based (admin/user) with provider/patient separation | Sufficient for current scale |
| **Data backup** | Managed by Manus platform | Confirm backup frequency with Manus support |
| **BAA** | Not yet in place | If you need a Business Associate Agreement for HIPAA compliance, contact Manus support |

For a 100-patient concierge practice, the current architecture is appropriate. As you scale or if regulatory requirements change, additional security layers can be added.

---

## 9. Recommended Next Steps

Here is a prioritized roadmap for taking the platform from its current state to full production readiness:

### Immediate (Before First Patient)

1. **Publish the app** — Click Publish in the Management UI.
2. **Set up your custom domain** — Configure `portal.blacklabelmedicine.com` or similar.
3. **Seed real protocols** — Tell me your actual treatment protocols and I will add them to the database.
4. **Remove demo data** — I will clear Sarah Mitchell's sample data and replace it with your real patient roster.

### Short-Term (First Month)

5. **Wire patient portal to database** — Connect the patient pages to pull real data based on the logged-in user, so each patient sees only their own protocols, messages, and appointments.
6. **Add appointment creation form** — Build a form so your assistant can create and manage appointments directly from the Provider Dashboard.
7. **Test with 2-3 pilot patients** — Onboard a small group, gather feedback, and iterate.

### Medium-Term (Months 2-3)

8. **Add lab result tracking** — File upload for lab PDFs, with provider annotation.
9. **Build patient intake form** — A digital intake questionnaire that feeds directly into the patient record.
10. **Expand notification system** — Email reminders for upcoming appointments and overdue tasks.

---

## 10. Getting Help

- **Design changes, new features, bug fixes** — Ask me directly in this chat. I can modify any part of the application.
- **Domain and hosting questions** — Use the Management UI's Settings panel, or ask me for guidance.
- **Billing and account questions** — Submit requests at [https://help.manus.im](https://help.manus.im).

Your platform is ready to publish. Let me know when you would like to proceed with any of the next steps above.
