import type { DestinationKey } from "../types";

/**
 * Outbound chart snapshot. This is the only shape the hub will hand to a
 * destination, and only after the BAA policy below runs.
 * Identifiers live on named fields so they can be removed as fields,
 * not hunted out of a raw FHIR document.
 */
export type HubPatientRecord = {
  portalPatientId: number;
  charmPatientId: string;
  mrn: string | null;
  accountNumber: string | null;
  deviceId: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  labs: ClinicalLab[];
  reports: ClinicalReport[];
  medications: ClinicalMedication[];
};

export type ClinicalLab = {
  name: string;
  value: string;
  unit: string;
  collectedOn: string;
  referenceLow: string | null;
  referenceHigh: string | null;
  note: string | null;
};

export type ClinicalReport = {
  name: string;
  issuedOn: string;
  conclusion: string | null;
};

export type ClinicalMedication = {
  name: string;
  dose: string | null;
  unit: string | null;
  route: string | null;
  frequency: string | null;
  status: string;
  authoredOn: string;
};

/** Safe Harbor-oriented payload. No names, contact fields, or record ids. */
export type DeidentifiedRecord = {
  state: string | null;
  ageBand: "under 90" | "90 or older" | null;
  labs: Array<{
    name: string;
    value: string;
    unit: string;
    collectedYear: string | null;
    referenceLow: string | null;
    referenceHigh: string | null;
    note: string | null;
  }>;
  reports: Array<{ name: string; issuedYear: string | null; conclusion: string | null }>;
  medications: Array<{
    name: string;
    dose: string | null;
    unit: string | null;
    route: string | null;
    frequency: string | null;
    status: string;
    authoredYear: string | null;
  }>;
};

const IDENTIFIER_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "fax",
  "dateOfBirth",
  "charmPatientId",
  "portalPatientId",
  "mrn",
  "addressLine",
  "city",
  "postalCode",
  "accountNumber",
  "deviceId",
] as const;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const URL = /\bhttps?:\/\/\S+/gi;
const ISO_DATE = /\b(\d{4})-\d{2}-\d{2}\b/g;
const ZIP = /\b\d{5}(?:-\d{4})?\b/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function collectKeys(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, into);
    return into;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      into.add(key);
      collectKeys(child, into);
    }
  }
  return into;
}

function secretsFrom(record: HubPatientRecord, now: Date, extraSecrets: string[] = []) {
  const age = ageYears(record.dateOfBirth, now);
  const values = [
    record.firstName,
    record.lastName,
    `${record.firstName} ${record.lastName}`.trim(),
    record.dateOfBirth,
    record.email,
    record.phone,
    record.fax,
    record.charmPatientId,
    record.mrn,
    record.accountNumber,
    record.deviceId,
    record.addressLine,
    record.city,
    record.postalCode,
    String(record.portalPatientId),
    ...extraSecrets,
  ];
  if (age != null && age >= 90 && record.dateOfBirth) values.push(record.dateOfBirth.slice(0, 4));
  return values.filter((value): value is string => typeof value === "string" && value.trim().length >= 3);
}

export function scrubText(text: string, secrets: string[]) {
  let next = text;
  const ordered = [...secrets].sort((a, b) => b.length - a.length);
  for (const secret of ordered) {
    next = next.replace(new RegExp(escapeRegExp(secret), "gi"), "[removed]");
  }
  return next
    .replace(EMAIL, "[removed]")
    .replace(PHONE, "[removed]")
    .replace(SSN, "[removed]")
    .replace(URL, "[removed]")
    .replace(ISO_DATE, "$1")
    .replace(ZIP, "[removed]");
}

function yearOf(value: string, secrets: string[], hideYear: boolean) {
  const match = /^(\d{4})-\d{2}-\d{2}/.exec(value.trim());
  if (!match) {
    const scrubbed = scrubText(value, secrets).trim();
    return scrubbed ? scrubbed : null;
  }
  if (hideYear) return null;
  return match[1] ?? null;
}

function ageYears(dob: string | null, now: Date) {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [year, month, day] = dob.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  let age = now.getUTCFullYear() - year;
  const monthDelta = now.getUTCMonth() + 1 - month;
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < day)) age -= 1;
  return age;
}

function ageBand(dob: string | null, now: Date): DeidentifiedRecord["ageBand"] {
  const age = ageYears(dob, now);
  if (age == null || age < 0) return null;
  return age >= 90 ? "90 or older" : "under 90";
}

function stateOnly(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * HIPAA Safe Harbor reduction for this fan-out.
 * Drops names, full dates other than year, postal codes smaller than a state,
 * contact fields, and record identifiers. Ages 90 and older lose the birth year too.
 */
export function deidentify(record: HubPatientRecord, now = new Date(), extraSecrets: string[] = []): DeidentifiedRecord {
  const secrets = secretsFrom(record, now, extraSecrets);
  const text = (value: string | null) => {
    if (!value) return null;
    const scrubbed = scrubText(value, secrets).trim();
    return scrubbed ? scrubbed : null;
  };
  return {
    state: stateOnly(record.state),
    ageBand: ageBand(record.dateOfBirth, now),
    labs: record.labs.map((lab) => ({
      name: text(lab.name) ?? "Lab",
      value: text(lab.value) ?? "",
      unit: text(lab.unit) ?? "",
      collectedYear: yearOf(lab.collectedOn, secrets, false),
      referenceLow: text(lab.referenceLow),
      referenceHigh: text(lab.referenceHigh),
      note: text(lab.note),
    })),
    reports: record.reports.map((report) => ({
      name: text(report.name) ?? "Report",
      issuedYear: yearOf(report.issuedOn, secrets, false),
      conclusion: text(report.conclusion),
    })),
    medications: record.medications.map((med) => ({
      name: text(med.name) ?? "Medication",
      dose: text(med.dose),
      unit: text(med.unit),
      route: text(med.route),
      frequency: text(med.frequency),
      status: med.status,
      authoredYear: yearOf(med.authoredOn, secrets, false),
    })),
  };
}

export function assertDeidentified(body: unknown, source: HubPatientRecord, now = new Date(), extraSecrets: string[] = []) {
  const keys = collectKeys(body);
  for (const key of IDENTIFIER_KEYS) {
    if (keys.has(key)) {
      throw new Error(`De-identification failed: field ${key} remained in the outbound payload`);
    }
  }
  const serialized = JSON.stringify(body).toLowerCase();
  for (const secret of secretsFrom(source, now, extraSecrets)) {
    if (serialized.includes(secret.toLowerCase())) {
      throw new Error("De-identification failed: an identifier remained in the outbound payload");
    }
  }
}

export function minimumNecessary(record: HubPatientRecord): HubPatientRecord {
  return {
    portalPatientId: record.portalPatientId,
    charmPatientId: record.charmPatientId,
    mrn: record.mrn,
    accountNumber: null,
    deviceId: null,
    firstName: record.firstName,
    lastName: record.lastName,
    dateOfBirth: record.dateOfBirth,
    email: record.email,
    phone: record.phone,
    fax: null,
    addressLine: record.addressLine,
    city: record.city,
    state: stateOnly(record.state),
    postalCode: record.postalCode,
    labs: record.labs,
    reports: record.reports,
    medications: record.medications,
  };
}

export type GatedPayload = {
  body: HubPatientRecord | DeidentifiedRecord;
  deidentified: boolean;
};

/**
 * Non-BAA destinations never receive the identified record.
 * The check throws instead of sending if stripping fails.
 */
export function gatePayload(record: HubPatientRecord, baaCovered: boolean, now = new Date(), extraSecrets: string[] = []): GatedPayload {
  if (baaCovered) return { body: minimumNecessary(record), deidentified: false };
  const body = deidentify(record, now, extraSecrets);
  assertDeidentified(body, record, now, extraSecrets);
  return { body, deidentified: true };
}

export function assertDeliveryShape(body: unknown, deidentified: boolean) {
  if (!deidentified) return;
  const keys = collectKeys(body);
  for (const key of IDENTIFIER_KEYS) {
    if (keys.has(key)) throw new Error(`Refusing identified field ${key} on a non-BAA delivery`);
  }
}

export type DestinationAdapterKey = DestinationKey;
