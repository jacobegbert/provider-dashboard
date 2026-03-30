import twilio from "twilio";
import { ENV } from "./_core/env";

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilio(): ReturnType<typeof twilio> | null {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioPhoneNumber) {
    console.warn("[SMS] Twilio credentials not fully configured — SMS will be skipped");
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
  }
  return twilioClient;
}

export interface SendSmsOptions {
  to: string; // Phone number in any common format — will be normalized to E.164
  body: string;
}

/**
 * Normalize a US phone number to E.164 format (+1XXXXXXXXXX).
 * Handles common formats:
 *   - 8016886538        → +18016886538
 *   - 801-688-6538      → +18016886538
 *   - (801) 688-6538    → +18016886538
 *   - 801 688 6538      → +18016886538
 *   - 18016886538       → +18016886538
 *   - +18016886538      → +18016886538 (already valid)
 * Returns null if the number cannot be normalized.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  // Strip everything except digits and leading +
  const stripped = raw.replace(/[^\d+]/g, "");
  // Remove leading + to work with just digits
  const digits = stripped.replace(/^\+/, "");

  if (digits.length === 10) {
    // US 10-digit: prepend +1
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // US 11-digit with country code: prepend +
    return `+${digits}`;
  } else if (digits.length >= 10 && digits.length <= 15) {
    // International number: prepend + if not already there
    return `+${digits}`;
  }

  return null;
}

/**
 * Send an SMS via Twilio.
 * Automatically normalizes phone numbers to E.164 format.
 * Returns true on success, false on failure (logs error but does not throw).
 */
export async function sendSms(opts: SendSmsOptions): Promise<boolean> {
  const client = getTwilio();
  if (!client) return false;

  // Normalize phone number to E.164
  const normalized = normalizePhone(opts.to);
  if (!normalized) {
    console.error("[SMS] Cannot normalize phone number:", opts.to, "— skipping");
    return false;
  }

  if (normalized !== opts.to) {
    console.log("[SMS] Normalized phone:", opts.to, "→", normalized);
  }

  try {
    const message = await client.messages.create({
      body: opts.body,
      from: ENV.twilioPhoneNumber,
      to: normalized,
    });

    console.log("[SMS] Sent to", normalized, "sid:", message.sid);
    return true;
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
    return false;
  }
}

// ─── SMS Templates ────────────────────────────────────────

const BRAND = "Black Label Medicine";
const PORTAL_URL = "https://www.blacklabelmedicine.com";

export function inviteSmsBody(params: {
  providerName: string;
  inviteUrl: string;
}): string {
  return `${BRAND}: ${params.providerName} has invited you to join the patient portal. Accept your invitation here: ${params.inviteUrl}`;
}

export function newMessageSmsBody(params: {
  providerName: string;
  messagePreview: string;
}): string {
  const preview = params.messagePreview.length > 100
    ? params.messagePreview.slice(0, 100) + "…"
    : params.messagePreview;
  return `${BRAND}: New message from ${params.providerName}: "${preview}" — Reply at ${PORTAL_URL}`;
}

export function appointmentReminderSmsBody(params: {
  providerName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}): string {
  return `${BRAND}: Reminder — ${params.appointmentType} with ${params.providerName} on ${params.appointmentDate} at ${params.appointmentTime}.`;
}

export function genericNotificationSmsBody(params: {
  title: string;
  body: string;
}): string {
  const text = params.body.length > 120
    ? params.body.slice(0, 120) + "…"
    : params.body;
  return `${BRAND}: ${params.title} — ${text}`;
}

export function protocolAssignedSmsBody(params: {
  providerName: string;
  protocolName: string;
}): string {
  return `${BRAND}: ${params.providerName} has added a new protocol to your plan: "${params.protocolName}". View at ${PORTAL_URL}`;
}

export function protocolUpdatedSmsBody(params: {
  providerName: string;
  protocolName: string;
}): string {
  return `${BRAND}: Your protocol "${params.protocolName}" has been updated by ${params.providerName}. View at ${PORTAL_URL}`;
}
