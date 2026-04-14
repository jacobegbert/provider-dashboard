/**
 * Patient Protocol PDF Generator (client-side)
 *
 * Generates a Black Label Medicine branded PDF of one or more protocol
 * assignments. Mirrors the look of server/intakePdfGenerator.ts so the
 * documents share a consistent identity.
 *
 * Usage:
 *   import { downloadProtocolsPdf } from "@/lib/protocolPdfGenerator";
 *   downloadProtocolsPdf({ patientName, assignments });
 */
import { jsPDF } from "jspdf";

// ─── Color palette (matches server/intakePdfGenerator.ts) ───
const COLORS = {
  black: [28, 28, 28] as [number, number, number],
  charcoal: [46, 46, 46] as [number, number, number],
  warmStone: [159, 152, 139] as [number, number, number],
  taupe: [184, 177, 164] as [number, number, number],
  bone: [237, 234, 227] as [number, number, number],
  ivory: [246, 244, 239] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gold: [198, 184, 158] as [number, number, number],
};

// ─── Types — match what trpc.assignment.listForPatient returns ───
export interface ProtocolPdfStep {
  id: number;
  title: string;
  description?: string | null;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "once" | "as_needed" | "custom";
  customDays?: string[] | string | null;
  timeOfDay?: "morning" | "afternoon" | "evening" | "any" | null;
  startDay?: number | null;
  endDay?: number | null;
  dosageAmount?: string | null;
  dosageUnit?: string | null;
  route?: string | null;
  sortOrder?: number;
}

export interface ProtocolPdfAssignment {
  assignment: {
    id: number;
    status: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    createdAt?: string | Date | null;
  };
  protocol: {
    id: number;
    name: string;
    description?: string | null;
    category: string;
    durationDays?: number | null;
  };
  steps: ProtocolPdfStep[];
}

export interface ProtocolPdfOptions {
  patientName: string;
  patientDob?: string | null;
  patientEmail?: string | null;
  providerName?: string | null;
  assignments: ProtocolPdfAssignment[];
}

// ─── Helpers ───
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatFrequency(step: ProtocolPdfStep): string {
  switch (step.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every other week";
    case "monthly":
      return "Monthly";
    case "once":
      return "One time";
    case "as_needed":
      return "As needed";
    case "custom": {
      const raw = step.customDays;
      let days: string[] = [];
      if (Array.isArray(raw)) {
        days = raw;
      } else if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) days = parsed;
        } catch {
          /* ignore */
        }
      }
      if (days.length === 0) return "Custom schedule";
      const labels: Record<string, string> = {
        mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
        monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
      };
      return days.map((d) => labels[d.toLowerCase()] || d).join(" · ");
    }
    default:
      return step.frequency;
  }
}

function formatTimeOfDay(t?: string | null): string {
  if (!t || t === "any") return "Any time";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatDosage(step: ProtocolPdfStep): string | null {
  const parts: string[] = [];
  if (step.dosageAmount) {
    parts.push(step.dosageUnit ? `${step.dosageAmount} ${step.dosageUnit}` : step.dosageAmount);
  }
  if (step.route) parts.push(`via ${step.route}`);
  return parts.length > 0 ? parts.join(" ") : null;
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Main generator ───
export function generateProtocolsPdf(opts: ProtocolPdfOptions): jsPDF {
  const { patientName, patientDob, patientEmail, providerName, assignments } = opts;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 0;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      y = 20;
      // Top accent line on every page
      doc.setFillColor(...COLORS.charcoal);
      doc.rect(0, 0, pageWidth, 2, "F");
    }
  }

  // ─── Cover / Header ───
  doc.setFillColor(...COLORS.charcoal);
  doc.rect(0, 0, pageWidth, 2, "F");

  y = 18;

  // Practice name
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.warmStone);
  doc.setFont("helvetica", "normal");
  doc.text("B L A C K   L A B E L   M E D I C I N E", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.charcoal);
  doc.setFont("helvetica", "bold");
  doc.text("Treatment Protocols", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Patient name
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.charcoal);
  doc.setFont("helvetica", "normal");
  doc.text(patientName, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Metadata line
  const metaParts: string[] = [];
  if (patientDob) metaParts.push(`DOB: ${patientDob}`);
  if (patientEmail) metaParts.push(patientEmail);
  metaParts.push(`Generated: ${formatDate(new Date())}`);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.warmStone);
  doc.text(metaParts.join("  \u2022  "), pageWidth / 2, y, { align: "center" });
  y += 6;

  // Protocol count
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.warmStone);
  const countText =
    assignments.length === 1 ? "1 protocol" : `${assignments.length} protocols`;
  doc.text(countText, pageWidth / 2, y, { align: "center" });
  y += 4;

  // Divider
  doc.setDrawColor(...COLORS.bone);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  // Empty state
  if (assignments.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.warmStone);
    doc.setFont("helvetica", "italic");
    doc.text("No protocols are currently assigned.", pageWidth / 2, y + 10, { align: "center" });
  }

  // ─── Per-protocol sections ───
  for (let pIdx = 0; pIdx < assignments.length; pIdx++) {
    const row = assignments[pIdx];
    const protocol = row.protocol;
    const assignment = row.assignment;
    // Sort steps by sortOrder for deterministic output
    const steps = [...(row.steps || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    checkPageBreak(28);

    // Section header bar
    doc.setFillColor(...COLORS.charcoal);
    doc.roundedRect(marginLeft, y, contentWidth, 9, 1, 1, "F");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(protocol.name.toUpperCase(), marginLeft + 4, y + 6);

    // Status badge on the right of the header bar
    const badgeText = statusLabel(assignment.status).toUpperCase();
    doc.setFontSize(7);
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    const badgeX = pageWidth - marginRight - badgeWidth - 3;
    doc.setFillColor(...COLORS.gold);
    doc.roundedRect(badgeX, y + 2, badgeWidth, 5, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, badgeX + 3, y + 5.5);

    y += 13;

    // Meta row: category, dates, duration
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.setFont("helvetica", "bold");
    doc.text("CATEGORY", marginLeft + 4, y);
    doc.text("STARTED", marginLeft + 4 + contentWidth / 3, y);
    doc.text("DURATION", marginLeft + 4 + (contentWidth / 3) * 2, y);
    y += 4;

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.charcoal);
    doc.setFont("helvetica", "normal");
    doc.text(categoryLabel(protocol.category), marginLeft + 4, y);
    doc.text(formatDate(assignment.startDate || assignment.createdAt), marginLeft + 4 + contentWidth / 3, y);
    const durationText = protocol.durationDays
      ? `${protocol.durationDays} days`
      : "Ongoing";
    doc.text(durationText, marginLeft + 4 + (contentWidth / 3) * 2, y);
    y += 7;

    // Description
    if (protocol.description) {
      checkPageBreak(10);
      doc.setFillColor(...COLORS.ivory);
      const descLines = doc.splitTextToSize(protocol.description, contentWidth - 8);
      const descBoxHeight = Math.max(8, descLines.length * 4 + 4);
      doc.roundedRect(marginLeft, y, contentWidth, descBoxHeight, 1, 1, "F");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.charcoal);
      doc.setFont("helvetica", "italic");
      doc.text(descLines, marginLeft + 4, y + 5);
      y += descBoxHeight + 4;
    }

    // Steps section label
    checkPageBreak(10);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.setFont("helvetica", "bold");
    doc.text(`STEPS (${steps.length})`, marginLeft + 4, y);
    y += 5;

    // Steps list
    if (steps.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.warmStone);
      doc.setFont("helvetica", "italic");
      doc.text("No steps defined.", marginLeft + 4, y);
      y += 6;
    }

    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx];

      // Build the body text first so we can size the row
      const bodyLines: string[] = [];
      if (step.description) {
        const descLines = doc.splitTextToSize(step.description, contentWidth - 16);
        bodyLines.push(...descLines);
      }
      const metaPieces: string[] = [];
      metaPieces.push(formatFrequency(step));
      metaPieces.push(formatTimeOfDay(step.timeOfDay));
      const dosage = formatDosage(step);
      if (dosage) metaPieces.push(dosage);
      if (step.startDay && step.startDay > 1) metaPieces.push(`Begins day ${step.startDay}`);
      if (step.endDay) metaPieces.push(`Ends day ${step.endDay}`);
      const metaText = metaPieces.join("  \u2022  ");
      const metaLines = doc.splitTextToSize(metaText, contentWidth - 16);

      const rowHeight = 8 + bodyLines.length * 4 + metaLines.length * 4;
      checkPageBreak(rowHeight + 4);

      // Alternate row background
      if (sIdx % 2 === 0) {
        doc.setFillColor(...COLORS.ivory);
        doc.rect(marginLeft, y - 1, contentWidth, rowHeight, "F");
      }

      // Step number marker (gold dot)
      doc.setFillColor(...COLORS.gold);
      doc.circle(marginLeft + 5, y + 3.5, 1.3, "F");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.text(String(sIdx + 1), marginLeft + 5, y + 4.5, { align: "center" });

      // Step title
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.charcoal);
      doc.setFont("helvetica", "bold");
      doc.text(step.title, marginLeft + 10, y + 4);

      let lineY = y + 8;

      // Description
      if (bodyLines.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.charcoal);
        doc.setFont("helvetica", "normal");
        doc.text(bodyLines, marginLeft + 10, lineY);
        lineY += bodyLines.length * 4;
      }

      // Meta line (frequency · time · dosage)
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.warmStone);
      doc.setFont("helvetica", "italic");
      doc.text(metaLines, marginLeft + 10, lineY);
      lineY += metaLines.length * 4;

      y = lineY + 2;
    }

    y += 6;
  }

  // ─── Final footer on every page ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.warmStone);
    doc.setFont("helvetica", "normal");
    const footerText = providerName
      ? `BLACK LABEL MEDICINE  \u2022  ${providerName}  \u2022  Page ${i} of ${totalPages}`
      : `BLACK LABEL MEDICINE  \u2022  Confidential Patient Record  \u2022  Page ${i} of ${totalPages}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  return doc;
}

/**
 * Generate a PDF and trigger a browser download.
 * Filename is auto-generated from patient name + date.
 */
export function downloadProtocolsPdf(opts: ProtocolPdfOptions, filename?: string): void {
  const doc = generateProtocolsPdf(opts);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = opts.patientName.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  const finalName = filename || `${safeName}_Protocols_${dateStr}.pdf`;
  doc.save(finalName);
}
