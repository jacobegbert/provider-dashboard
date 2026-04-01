/**
 * Unified patient notification module.
 * Sends both email (Resend) and SMS (Twilio) when patient has contact info.
 * Gracefully degrades — if one channel fails, the other still sends.
 */

import { sendEmail, inviteEmailHtml, newMessageEmailHtml, appointmentEmailHtml, notificationEmailHtml, protocolAssignedEmailHtml, protocolUpdatedEmailHtml } from "./email";
import { generateIcs } from "./ics";
import { sendSms, inviteSmsBody, newMessageSmsBody, appointmentReminderSmsBody, genericNotificationSmsBody, protocolAssignedSmsBody, protocolUpdatedSmsBody } from "./sms";

export interface NotifyResult {
  emailSent: boolean;
  smsSent: boolean;
}

/**
 * Returns the phone number only if the patient has explicitly opted in to SMS.
 * Invites are exempt — they're the initial outreach to get consent.
 */
function consentedPhone(phone: string | null | undefined, smsOptIn: boolean | null | undefined): string | null {
  if (!phone) return null;
  if (smsOptIn !== true) return null;
  return phone;
}

/**
 * Notify a patient about a new invite.
 * Invites are exempt from SMS consent — this IS the initial outreach.
 */
export async function notifyPatientInvite(params: {
  email: string;
  phone?: string | null;
  providerName: string;
  inviteUrl: string;
}): Promise<NotifyResult> {
  const [emailSent, smsSent] = await Promise.all([
    sendEmail({
      to: params.email,
      subject: `You're invited to ${params.providerName}'s patient portal`,
      html: inviteEmailHtml({
        providerName: params.providerName,
        inviteUrl: params.inviteUrl,
      }),
    }),
    params.phone
      ? sendSms({
          to: params.phone,
          body: inviteSmsBody({
            providerName: params.providerName,
            inviteUrl: params.inviteUrl,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

/**
 * Notify a patient about a new message from their provider.
 */
export async function notifyPatientNewMessage(params: {
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean | null;
  providerName: string;
  messagePreview: string;
  portalUrl: string;
}): Promise<NotifyResult> {
  const smsPhone = consentedPhone(params.phone, params.smsOptIn);
  const [emailSent, smsSent] = await Promise.all([
    params.email
      ? sendEmail({
          to: params.email,
          subject: `New message from ${params.providerName}`,
          html: newMessageEmailHtml({
            providerName: params.providerName,
            messagePreview: params.messagePreview,
            portalUrl: params.portalUrl,
          }),
        })
      : Promise.resolve(false),
    smsPhone
      ? sendSms({
          to: smsPhone,
          body: newMessageSmsBody({
            providerName: params.providerName,
            messagePreview: params.messagePreview,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

/**
 * Notify a patient about a new/upcoming appointment with ICS calendar attachment.
 */
export async function notifyPatientAppointment(params: {
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean | null;
  providerName: string;
  providerEmail?: string;
  patientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  appointmentNotes?: string;
  startTime: Date;
  endTime: Date;
  portalUrl: string;
}): Promise<NotifyResult> {
  // Generate ICS calendar file
  const icsContent = generateIcs({
    summary: `${params.appointmentType} — ${params.providerName}`,
    description: `Appointment with ${params.providerName} at Black Label Medicine.${params.appointmentNotes ? " Notes: " + params.appointmentNotes : ""}`,
    startTime: params.startTime,
    endTime: params.endTime,
    organizerName: params.providerName,
    organizerEmail: params.providerEmail || "notifications@blacklabelmedicine.com",
    attendeeName: params.patientName,
    attendeeEmail: params.email || undefined,
  });

  // Build Google Calendar URL
  const gcalStart = formatGcalDate(params.startTime);
  const gcalEnd = formatGcalDate(params.endTime);
  const gcalTitle = encodeURIComponent(`${params.appointmentType} — ${params.providerName}`);
  const gcalDetails = encodeURIComponent(`Appointment with ${params.providerName} at Black Label Medicine.`);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalStart}/${gcalEnd}&details=${gcalDetails}`;

  const smsPhone = consentedPhone(params.phone, params.smsOptIn);
  const [emailSent, smsSent] = await Promise.all([
    params.email
      ? sendEmail({
          to: params.email,
          subject: `New Appointment: ${params.appointmentType} on ${params.appointmentDate}`,
          html: appointmentEmailHtml({
            providerName: params.providerName,
            appointmentDate: params.appointmentDate,
            appointmentTime: params.appointmentTime,
            appointmentType: params.appointmentType,
            portalUrl: params.portalUrl,
            notes: params.appointmentNotes,
            googleCalUrl,
          }),
          attachments: [
            {
              filename: "appointment.ics",
              content: icsContent,
              contentType: "text/calendar",
            },
          ],
        })
      : Promise.resolve(false),
    smsPhone
      ? sendSms({
          to: smsPhone,
          body: appointmentReminderSmsBody({
            providerName: params.providerName,
            appointmentDate: params.appointmentDate,
            appointmentTime: params.appointmentTime,
            appointmentType: params.appointmentType,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

/** Format Date for Google Calendar URL: 20260219T150000Z */
function formatGcalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Send a generic notification to a patient via email and/or SMS.
 */
export async function notifyPatientGeneric(params: {
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean | null;
  title: string;
  body: string;
  portalUrl: string;
}): Promise<NotifyResult> {
  const smsPhone = consentedPhone(params.phone, params.smsOptIn);
  const [emailSent, smsSent] = await Promise.all([
    params.email
      ? sendEmail({
          to: params.email,
          subject: params.title,
          html: notificationEmailHtml({
            title: params.title,
            body: params.body,
            portalUrl: params.portalUrl,
          }),
        })
      : Promise.resolve(false),
    smsPhone
      ? sendSms({
          to: smsPhone,
          body: genericNotificationSmsBody({
            title: params.title,
            body: params.body,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

/**
 * Notify a patient when a protocol is assigned to them.
 */
export async function notifyPatientProtocolAssigned(params: {
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean | null;
  providerName: string;
  protocolName: string;
  protocolDescription?: string;
  stepCount: number;
  portalUrl: string;
}): Promise<NotifyResult> {
  const smsPhone = consentedPhone(params.phone, params.smsOptIn);
  const [emailSent, smsSent] = await Promise.all([
    params.email
      ? sendEmail({
          to: params.email,
          subject: `New Protocol: ${params.protocolName}`,
          html: protocolAssignedEmailHtml({
            providerName: params.providerName,
            protocolName: params.protocolName,
            protocolDescription: params.protocolDescription,
            stepCount: params.stepCount,
            portalUrl: params.portalUrl,
          }),
        })
      : Promise.resolve(false),
    smsPhone
      ? sendSms({
          to: smsPhone,
          body: protocolAssignedSmsBody({
            providerName: params.providerName,
            protocolName: params.protocolName,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}

/**
 * Notify a patient when one of their assigned protocols is updated.
 */
export async function notifyPatientProtocolUpdated(params: {
  email?: string | null;
  phone?: string | null;
  smsOptIn?: boolean | null;
  providerName: string;
  protocolName: string;
  changeDescription: string;
  portalUrl: string;
}): Promise<NotifyResult> {
  const smsPhone = consentedPhone(params.phone, params.smsOptIn);
  const [emailSent, smsSent] = await Promise.all([
    params.email
      ? sendEmail({
          to: params.email,
          subject: `Protocol Updated: ${params.protocolName}`,
          html: protocolUpdatedEmailHtml({
            providerName: params.providerName,
            protocolName: params.protocolName,
            changeDescription: params.changeDescription,
            portalUrl: params.portalUrl,
          }),
        })
      : Promise.resolve(false),
    smsPhone
      ? sendSms({
          to: smsPhone,
          body: protocolUpdatedSmsBody({
            providerName: params.providerName,
            protocolName: params.protocolName,
          }),
        })
      : Promise.resolve(false),
  ]);

  return { emailSent, smsSent };
}
