import { Resend } from "resend";
import { ENV } from "./_core/env";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured — emails will be skipped");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(ENV.resendApiKey);
  }
  return resendClient;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 or raw string
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send a transactional email via Resend.
 * Returns true on success, false on failure (logs error but does not throw).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const sendPayload: any = {
      from: ENV.fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    };

    if (opts.attachments && opts.attachments.length > 0) {
      sendPayload.attachments = opts.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, "utf-8"),
        content_type: a.contentType || "application/octet-stream",
      }));
    }

    const { data, error } = await resend.emails.send(sendPayload);

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log("[Email] Sent to", opts.to, "id:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

// ─── Email Templates ────────────────────────────────────────

const BRAND_COLOR = "#7c8c6e"; // sage
const BRAND_NAME = "Black Label Medicine";

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f5f2ed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 20px; font-weight: 600; color: ${BRAND_COLOR}; letter-spacing: 0.5px; }
    .content { color: #333; font-size: 15px; line-height: 1.6; }
    .content p { margin: 0 0 16px; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; font-size: 15px; margin: 8px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">${BRAND_NAME}</div>
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>${BRAND_NAME} &mdash; Concierge Optimization</p>
    </div>
  </div>
</body>
</html>`;
}

export function inviteEmailHtml(params: {
  providerName: string;
  inviteUrl: string;
}): string {
  return baseTemplate(`
    <p>You've been invited by <strong>${params.providerName}</strong> to join ${BRAND_NAME}'s patient portal.</p>
    <p>Access your personalized health protocols, track biomarkers, message your provider, and manage appointments — all in one place.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.inviteUrl}" class="btn">Accept Invitation</a>
    </p>
    <p style="font-size: 13px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br>
    <a href="${params.inviteUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">${params.inviteUrl}</a></p>
  `);
}

export function newMessageEmailHtml(params: {
  providerName: string;
  messagePreview: string;
  portalUrl: string;
}): string {
  return baseTemplate(`
    <p>You have a new message from <strong>${params.providerName}</strong>:</p>
    <div style="background: #f5f2ed; border-radius: 8px; padding: 16px; margin: 16px 0; font-style: italic; color: #555;">
      "${params.messagePreview.length > 200 ? params.messagePreview.slice(0, 200) + "…" : params.messagePreview}"
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">View Message</a>
    </p>
  `);
}

export function appointmentEmailHtml(params: {
  providerName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  portalUrl: string;
  notes?: string;
  googleCalUrl?: string;
}): string {
  const notesSection = params.notes
    ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${params.notes}</p>`
    : "";

  const calendarLinks = params.googleCalUrl
    ? `
    <p style="text-align: center; margin: 8px 0; font-size: 13px; color: #666;">
      <a href="${params.googleCalUrl}" style="color: ${BRAND_COLOR}; text-decoration: underline;">Add to Google Calendar</a>
      &nbsp;&middot;&nbsp;
      A calendar file (.ics) is attached to this email for Apple Calendar, Outlook, and others.
    </p>`
    : "";

  return baseTemplate(`
    <p>You have a new appointment scheduled with <strong>${params.providerName}</strong>:</p>
    <div style="background: #f5f2ed; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Date:</strong> ${params.appointmentDate}</p>
      <p style="margin: 4px 0;"><strong>Time:</strong> ${params.appointmentTime}</p>
      <p style="margin: 4px 0;"><strong>Type:</strong> ${params.appointmentType}</p>
      <p style="margin: 4px 0;"><strong>Provider:</strong> ${params.providerName}</p>
      ${notesSection}
    </div>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">View in Portal</a>
    </p>
    ${calendarLinks}
  `);
}

export function notificationEmailHtml(params: {
  title: string;
  body: string;
  portalUrl: string;
}): string {
  return baseTemplate(`
    <p><strong>${params.title}</strong></p>
    <p>${params.body}</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">Open Portal</a>
    </p>
  `);
}

export function protocolAssignedEmailHtml(params: {
  providerName: string;
  protocolName: string;
  protocolDescription?: string;
  stepCount: number;
  portalUrl: string;
}): string {
  const descSection = params.protocolDescription
    ? `<p style="margin: 4px 0; color: #555;">${params.protocolDescription}</p>`
    : "";

  return baseTemplate(`
    <p><strong>${params.providerName}</strong> has added a new protocol to your care plan:</p>
    <div style="background: #f5f2ed; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0; font-size: 17px; font-weight: 600; color: #333;">${params.protocolName}</p>
      ${descSection}
      <p style="margin: 8px 0 0; font-size: 13px; color: #888;">${params.stepCount} step${params.stepCount !== 1 ? "s" : ""} in this protocol</p>
    </div>
    <p>Open your portal to review the full details and start tracking your progress.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">View Protocol</a>
    </p>
  `);
}

export function protocolUpdatedEmailHtml(params: {
  providerName: string;
  protocolName: string;
  changeDescription: string;
  portalUrl: string;
}): string {
  return baseTemplate(`
    <p><strong>${params.providerName}</strong> has updated one of your protocols:</p>
    <div style="background: #f5f2ed; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0; font-size: 17px; font-weight: 600; color: #333;">${params.protocolName}</p>
      <p style="margin: 8px 0 0; color: #555;">${params.changeDescription}</p>
    </div>
    <p>Open your portal to review the updated protocol.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.portalUrl}" class="btn">View Protocol</a>
    </p>
  `);
}
