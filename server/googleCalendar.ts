/**
 * Google Calendar Integration
 * Handles OAuth token management and calendar event CRUD
 */
import { google } from "googleapis";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { googleTokens, appointments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function createOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri,
  );
}

/** Generate the Google OAuth consent URL */
export function getGoogleAuthUrl(redirectUri: string, userId: number) {
  const client = createOAuth2Client(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: JSON.stringify({ userId, redirectUri }),
  });
}

/** Exchange authorization code for tokens and store them */
export async function handleGoogleCallback(code: string, state: string) {
  const { userId, redirectUri } = JSON.parse(state);
  const client = createOAuth2Client(redirectUri);

  const { tokens } = await client.getToken(code);
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user email from Google
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  let googleEmail: string | null = null;
  try {
    const userInfo = await oauth2.userinfo.get();
    googleEmail = userInfo.data.email ?? null;
  } catch {
    // Non-critical, continue without email
  }

  // Upsert tokens
  const existing = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(googleTokens)
      .set({
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? existing[0].refreshToken,
        expiresAt: tokens.expiry_date ?? null,
        googleEmail,
      })
      .where(eq(googleTokens.userId, userId));
  } else {
    await db.insert(googleTokens).values({
      userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expiry_date ?? null,
      googleEmail,
    });
  }

  return { success: true, googleEmail };
}

/** Get an authenticated Google Calendar client for a user */
async function getCalendarClient(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (rows.length === 0) return null;

  const token = rows[0];
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiresAt,
  });

  // Auto-refresh handler
  client.on("tokens", async (newTokens) => {
    try {
      await db
        .update(googleTokens)
        .set({
          accessToken: newTokens.access_token ?? token.accessToken,
          expiresAt: newTokens.expiry_date ?? token.expiresAt,
        })
        .where(eq(googleTokens.userId, userId));
    } catch (e) {
      console.error("[GoogleCalendar] Failed to save refreshed tokens:", e);
    }
  });

  return google.calendar({ version: "v3", auth: client });
}

/** Check if a user has Google Calendar connected */
export async function getConnectionStatus(userId: number) {
  const db = await getDb();
  if (!db) return { connected: false, googleEmail: null };

  const rows = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (rows.length === 0) return { connected: false, googleEmail: null };
  return { connected: true, googleEmail: rows[0].googleEmail };
}

/** Disconnect Google Calendar (delete tokens) */
export async function disconnectGoogle(userId: number) {
  const db = await getDb();
  if (!db) return;

  const rows = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (rows.length > 0) {
    try {
      const client = createOAuth2Client();
      client.setCredentials({ access_token: rows[0].accessToken });
      await client.revokeCredentials();
    } catch {
      // Non-critical if revoke fails
    }
    await db.delete(googleTokens).where(eq(googleTokens.userId, userId));
  }
}

/** Create or update a Google Calendar event from an appointment */
export async function syncAppointmentToGoogle(
  userId: number,
  appointmentId: number,
  patientName: string,
) {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return null;

  const db = await getDb();
  if (!db) return null;

  const apt = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (apt.length === 0) return null;
  const a = apt[0];

  const start = new Date(a.scheduledAt);
  const end = new Date(start.getTime() + (a.durationMinutes || 30) * 60 * 1000);

  const eventBody = {
    summary: `${a.title || "Appointment"} — ${patientName}`,
    description: [
      a.assistantNotes ? `Provider Notes: ${a.assistantNotes}` : "",
      a.patientNotes ? `Patient Notes: ${a.patientNotes}` : "",
      `Type: ${a.type}`,
    ]
      .filter(Boolean)
      .join("\n"),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    location: a.location || undefined,
    reminders: { useDefault: true },
  };

  try {
    if (a.googleEventId) {
      const event = await calendar.events.update({
        calendarId: "primary",
        eventId: a.googleEventId,
        requestBody: eventBody,
      });
      return event.data.id;
    } else {
      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventBody,
      });
      if (event.data.id) {
        await db
          .update(appointments)
          .set({ googleEventId: event.data.id })
          .where(eq(appointments.id, appointmentId));
      }
      return event.data.id;
    }
  } catch (e: any) {
    console.error("[GoogleCalendar] Sync failed:", e.message);
    return null;
  }
}

/** Delete a Google Calendar event when appointment is cancelled */
export async function deleteGoogleEvent(userId: number, appointmentId: number) {
  const calendar = await getCalendarClient(userId);
  if (!calendar) return;

  const db = await getDb();
  if (!db) return;

  const apt = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (apt.length === 0 || !apt[0].googleEventId) return;

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: apt[0].googleEventId,
    });
    await db
      .update(appointments)
      .set({ googleEventId: null })
      .where(eq(appointments.id, appointmentId));
  } catch (e: any) {
    console.error("[GoogleCalendar] Delete failed:", e.message);
  }
}

/** Sync all existing appointments to Google Calendar */
export async function syncAllAppointments(userId: number, providerId: number) {
  const calendar = await getCalendarClient(userId);
  if (!calendar) throw new Error("Google Calendar not connected");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allApts = await db
    .select()
    .from(appointments)
    .where(eq(appointments.providerId, providerId));

  let synced = 0;
  let failed = 0;

  for (const a of allApts) {
    if (a.status === "cancelled") continue;
    try {
      const start = new Date(a.scheduledAt);
      const end = new Date(start.getTime() + (a.durationMinutes || 30) * 60 * 1000);

      const eventBody = {
        summary: a.title || "Appointment",
        description: `Type: ${a.type}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        location: a.location || undefined,
      };

      if (a.googleEventId) {
        await calendar.events.update({
          calendarId: "primary",
          eventId: a.googleEventId,
          requestBody: eventBody,
        });
      } else {
        const event = await calendar.events.insert({
          calendarId: "primary",
          requestBody: eventBody,
        });
        if (event.data.id) {
          await db
            .update(appointments)
            .set({ googleEventId: event.data.id })
            .where(eq(appointments.id, a.id));
        }
      }
      synced++;
    } catch (e: any) {
      console.error(`[GoogleCalendar] Sync failed for apt ${a.id}:`, e.message);
      failed++;
    }
  }

  return { synced, failed, total: allApts.filter((a) => a.status !== "cancelled").length };
}
