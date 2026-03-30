/**
 * ICS (iCalendar) file generator for appointment calendar invites.
 * Produces RFC 5545 compliant .ics content that works with
 * Google Calendar, Apple Calendar, Outlook, etc.
 */

export interface IcsEventParams {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName: string;
  organizerEmail: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format a Date as ICS datetime string in UTC: 20260219T150000Z */
function formatIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Generate a unique UID for the event */
function generateUid(): string {
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${now}-${rand}@blacklabelmedicine.com`;
}

/**
 * Generate an ICS calendar file content string.
 * Returns a valid .ics file that can be attached to emails.
 */
export function generateIcs(params: IcsEventParams): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Black Label Medicine//Patient Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${generateUid()}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(params.startTime)}`,
    `DTEND:${formatIcsDate(params.endTime)}`,
    `SUMMARY:${escapeIcsText(params.summary)}`,
  ];

  if (params.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(params.description)}`);
  }

  if (params.location) {
    lines.push(`LOCATION:${escapeIcsText(params.location)}`);
  }

  lines.push(
    `ORGANIZER;CN=${escapeIcsText(params.organizerName)}:mailto:${params.organizerEmail}`
  );

  if (params.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${escapeIcsText(params.attendeeName || params.attendeeEmail)};RSVP=TRUE:mailto:${params.attendeeEmail}`
    );
  }

  // Set a reminder 30 minutes before
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment reminder",
    "END:VALARM"
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

/** Escape special characters for ICS text fields */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
