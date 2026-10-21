const STATUS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  clinic_managed: "Clinic-managed",
  completed: "Completed",
  not_started: "Not started",
  in_progress: "In progress",
  new: "New",
  queued: "Queued",
  accepted: "Accepted by mock",
  filled: "Filled in mock",
  cancelled: "Cancelled",
  failed: "Failed",
};

const KIND: Record<string, string> = {
  medication: "Medicine",
  peptide: "Peptide",
  regenerative: "Regenerative protocol",
  note: "Note",
};

const ACTION: Record<string, string> = {
  "plan.publish": "Published the plan",
  "plan.draft": "Updated the draft",
  "message.send": "Sent a message",
  "guidance.request": "Requested guidance drafts",
  "guidance.review": "Reviewed a guidance draft",
  "intake.review": "Reviewed intake",
  "intake.submit": "Patient submitted intake",
  "intake.save": "Patient saved intake",
  "pharmacy.status": "Updated a mock pharmacy order",
};

export function statusLabel(value: string) {
  return STATUS[value] ?? value;
}

export function kindLabel(value: string) {
  return KIND[value] ?? value;
}

export function actionLabel(value: string) {
  return ACTION[value] ?? value;
}

export function formatWhen(value: Date | string | null | undefined) {
  if (!value) return "Not published yet";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatTime(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}

export function doseLine(item: {
  dose: string | null;
  unit: string | null;
  route: string | null;
  frequency: string | null;
}) {
  return [item.dose, item.unit, item.route, item.frequency].filter(Boolean).join(" · ");
}
