import { SignJWT, importPKCS8 } from "jose";
import { SAMPLE_PREFIX } from "../../../shared/demo";

/**
 * Charm Health FHIR R4 client.
 *
 * The default adapter is an in-memory fictional feed. It does not open a
 * socket. CHARM_ADAPTER=live selects the SMART-on-FHIR backend client, which
 * reads credentials from the environment at call time. Nothing in that path
 * is committed, and tests must keep using the mock.
 */

export type CharmPatient = {
  fhirId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  fax: string | null;
  mrn: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  accountNumber: string | null;
  deviceId: string | null;
};

export type CharmObservation = {
  fhirId: string;
  name: string;
  value: string;
  unit: string;
  referenceLow: string | null;
  referenceHigh: string | null;
  collectedOn: string;
  note: string | null;
};

export type CharmReport = {
  fhirId: string;
  name: string;
  issuedOn: string;
  conclusion: string | null;
};

export type CharmMedication = {
  fhirId: string;
  name: string;
  dose: string | null;
  unit: string | null;
  route: string | null;
  frequency: string | null;
  status: "active" | "paused" | "completed";
  authoredOn: string;
  sampleTemplate: boolean;
};

export type CharmChart = {
  patient: CharmPatient;
  observations: CharmObservation[];
  reports: CharmReport[];
  medications: CharmMedication[];
};

export interface CharmFhirClient {
  readonly id: "mock" | "charm";
  pullCharts(): Promise<CharmChart[]>;
}

function sample(text: string) {
  return `${SAMPLE_PREFIX} ${text}`;
}

/** Fictional Charm feed. Emails match the seeded portal charts where a chart already exists. */
export function mockCharmCharts(): CharmChart[] {
  return [
    {
      patient: {
        fhirId: "Patient/demo-morgan",
        firstName: "Morgan",
        lastName: "Hale",
        dateOfBirth: "1991-04-12",
        email: "morgan.hale@example.com",
        phone: "555-0148",
        fax: "555-0149",
        mrn: "DEMO-MRN-MORGAN",
        addressLine: "100 Harbor Lane",
        city: "Salt Lake City",
        state: "UT",
        postalCode: "84101",
        accountNumber: "DEMO-ACCT-MORGAN",
        deviceId: "DEMO-DEVICE-MORGAN",
      },
      observations: [
        {
          fhirId: "Observation/demo-morgan-d",
          name: "Sample vitamin D recheck",
          value: "52",
          unit: "ng/mL",
          referenceLow: "30",
          referenceHigh: "100",
          collectedOn: "2026-10-01",
          note: sample("Fictional Charm observation for Morgan Hale <morgan.hale@example.com>."),
        },
      ],
      reports: [
        {
          fhirId: "DiagnosticReport/demo-morgan-panel",
          name: "Sample metabolic panel",
          issuedOn: "2026-10-02",
          conclusion: sample("Narrative for Morgan Hale. Phone 555-0148. Not a diagnosis."),
        },
      ],
      medications: [
        {
          fhirId: "MedicationRequest/demo-morgan-mag",
          name: "Sample magnesium glycinate template",
          dose: "200",
          unit: "mg",
          route: "oral",
          frequency: "nightly",
          status: "active",
          authoredOn: "2026-10-03",
          sampleTemplate: true,
        },
      ],
    },
    {
      patient: {
        fhirId: "Patient/demo-quinn",
        firstName: "Quinn",
        lastName: "Adler",
        dateOfBirth: "1984-11-02",
        email: "quinn.adler@example.com",
        phone: "555-0192",
        fax: null,
        mrn: "DEMO-MRN-QUINN",
        addressLine: "14 Cedar Court",
        city: "Provo",
        state: "UT",
        postalCode: "84601",
        accountNumber: "DEMO-ACCT-QUINN",
        deviceId: null,
      },
      observations: [
        {
          fhirId: "Observation/demo-quinn-tsh",
          name: "Sample TSH template",
          value: "1.8",
          unit: "mIU/L",
          referenceLow: "0.4",
          referenceHigh: "4.0",
          collectedOn: "2026-09-01",
          note: sample("Fictional Charm observation. Quinn's chart stays off Morgan's login."),
        },
      ],
      reports: [],
      medications: [],
    },
    {
      patient: {
        fhirId: "Patient/demo-riley",
        firstName: "Riley",
        lastName: "Chen",
        dateOfBirth: "1934-06-18",
        email: "riley.chen@example.com",
        phone: "555-0177",
        fax: null,
        mrn: "DEMO-MRN-RILEY",
        addressLine: "8 Market Street",
        city: "Ogden",
        state: "UT",
        postalCode: "84401",
        accountNumber: "DEMO-ACCT-RILEY",
        deviceId: "DEMO-DEVICE-RILEY",
      },
      observations: [
        {
          fhirId: "Observation/demo-riley-b12",
          name: "Sample B12 template",
          value: "410",
          unit: "pg/mL",
          referenceLow: "200",
          referenceHigh: "900",
          collectedOn: "2026-08-15",
          note: sample("Born 1934-06-18. Fictional chart used to exercise age-band redaction."),
        },
      ],
      reports: [],
      medications: [],
    },
  ];
}

export function createMockCharmClient(): CharmFhirClient {
  return {
    id: "mock",
    async pullCharts() {
      return mockCharmCharts();
    },
  };
}

type LiveConfig = {
  baseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  privateKey?: string;
  scope: string;
  fetchImpl?: typeof fetch;
};

const DEFAULT_SCOPE = "system/Patient.read system/Observation.read system/DiagnosticReport.read system/MedicationRequest.read";

export function createCharmClient(env: NodeJS.ProcessEnv = process.env): CharmFhirClient {
  if (env.CHARM_ADAPTER !== "live") return createMockCharmClient();
  const baseUrl = env.CHARM_FHIR_BASE_URL?.trim();
  const tokenUrl = env.CHARM_TOKEN_URL?.trim();
  const clientId = env.CHARM_CLIENT_ID?.trim();
  if (!baseUrl || !tokenUrl || !clientId) {
    throw new Error("CHARM_ADAPTER=live requires CHARM_FHIR_BASE_URL, CHARM_TOKEN_URL, and CHARM_CLIENT_ID");
  }
  const clientSecret = env.CHARM_CLIENT_SECRET?.trim();
  const privateKey = env.CHARM_PRIVATE_KEY?.trim();
  if (!clientSecret && !privateKey) {
    throw new Error("CHARM_ADAPTER=live requires CHARM_PRIVATE_KEY (SMART backend JWT) or CHARM_CLIENT_SECRET");
  }
  return createLiveCharmClient({
    baseUrl: baseUrl.replace(/\/$/, ""),
    tokenUrl,
    clientId,
    clientSecret,
    privateKey: privateKey?.replace(/\\n/g, "\n"),
    scope: env.CHARM_SCOPE?.trim() || DEFAULT_SCOPE,
  });
}

type FhirJson = Record<string, unknown>;

function asRecord(value: unknown): FhirJson | null {
  return value && typeof value === "object" ? value as FhirJson : null;
}

function textOf(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function codingText(code: unknown) {
  const record = asRecord(code);
  if (!record) return "Untitled";
  if (textOf(record.text)) return textOf(record.text)!;
  const coding = Array.isArray(record.coding) ? asRecord(record.coding[0]) : null;
  return textOf(coding?.display) ?? textOf(coding?.code) ?? "Untitled";
}

function dayOf(value: unknown) {
  const text = textOf(value);
  if (!text) return new Date().toISOString().slice(0, 10);
  return text.slice(0, 10);
}

function telecom(resource: FhirJson, system: string) {
  const list = Array.isArray(resource.telecom) ? resource.telecom : [];
  for (const item of list) {
    const row = asRecord(item);
    if (row?.system === system && textOf(row.value)) return textOf(row.value);
  }
  return null;
}

function identifier(resource: FhirJson) {
  const list = Array.isArray(resource.identifier) ? resource.identifier : [];
  for (const item of list) {
    const row = asRecord(item);
    const value = textOf(row?.value);
    if (value) return value;
  }
  return null;
}

export function chartFromFhir(patient: FhirJson, observations: FhirJson[], reports: FhirJson[], medications: FhirJson[]): CharmChart {
  const name = asRecord(Array.isArray(patient.name) ? patient.name[0] : null);
  const given = Array.isArray(name?.given) ? textOf(name.given[0]) : null;
  const address = asRecord(Array.isArray(patient.address) ? patient.address[0] : null);
  const line = Array.isArray(address?.line) ? textOf(address.line[0]) : null;
  return {
    patient: {
      fhirId: textOf(patient.id) ? `Patient/${textOf(patient.id)}` : "Patient/unknown",
      firstName: given ?? "Unknown",
      lastName: textOf(name?.family) ?? "Patient",
      dateOfBirth: textOf(patient.birthDate),
      email: telecom(patient, "email"),
      phone: telecom(patient, "phone"),
      fax: telecom(patient, "fax"),
      mrn: identifier(patient),
      addressLine: line,
      city: textOf(address?.city),
      state: textOf(address?.state),
      postalCode: textOf(address?.postalCode),
      accountNumber: null,
      deviceId: null,
    },
    observations: observations.map((resource) => {
      const quantity = asRecord(resource.valueQuantity);
      const range = asRecord(resource.referenceRange && Array.isArray(resource.referenceRange) ? resource.referenceRange[0] : null);
      const low = asRecord(range?.low);
      const high = asRecord(range?.high);
      return {
        fhirId: `Observation/${textOf(resource.id) ?? "unknown"}`,
        name: codingText(resource.code),
        value: quantity?.value != null ? String(quantity.value) : textOf(resource.valueString) ?? "see note",
        unit: textOf(quantity?.unit) ?? "",
        referenceLow: low?.value != null ? String(low.value) : null,
        referenceHigh: high?.value != null ? String(high.value) : null,
        collectedOn: dayOf(resource.effectiveDateTime ?? resource.issued),
        note: textOf(asRecord(Array.isArray(resource.note) ? resource.note[0] : null)?.text),
      };
    }),
    reports: reports.map((resource) => ({
      fhirId: `DiagnosticReport/${textOf(resource.id) ?? "unknown"}`,
      name: codingText(resource.code),
      issuedOn: dayOf(resource.issued ?? resource.effectiveDateTime),
      conclusion: textOf(resource.conclusion),
    })),
    medications: medications.map((resource) => {
      const dosage = asRecord(Array.isArray(resource.dosageInstruction) ? resource.dosageInstruction[0] : null);
      const dose = asRecord(dosage?.doseAndRate && Array.isArray(dosage.doseAndRate) ? asRecord(dosage.doseAndRate[0])?.doseQuantity : null);
      const route = asRecord(dosage?.route);
      const status = textOf(resource.status);
      return {
        fhirId: `MedicationRequest/${textOf(resource.id) ?? "unknown"}`,
        name: codingText(resource.medicationCodeableConcept),
        dose: dose?.value != null ? String(dose.value) : null,
        unit: textOf(dose?.unit),
        route: textOf(route?.text),
        frequency: textOf(dosage?.text),
        status: status === "completed" ? "completed" : status === "stopped" || status === "cancelled" ? "paused" : "active",
        authoredOn: dayOf(resource.authoredOn),
        sampleTemplate: false,
      };
    }),
  };
}

async function fetchBundle(fetchImpl: typeof fetch, url: string, token: string) {
  const response = await fetchImpl(url, { headers: { authorization: `Bearer ${token}`, accept: "application/fhir+json" } });
  if (!response.ok) throw new Error(`Charm FHIR request failed (${response.status})`);
  const body = await response.json() as FhirJson;
  const entries = Array.isArray(body.entry) ? body.entry : [];
  return entries
    .map((entry) => asRecord(asRecord(entry)?.resource))
    .filter((resource): resource is FhirJson => Boolean(resource));
}

export function createLiveCharmClient(config: LiveConfig): CharmFhirClient {
  const fetchImpl = config.fetchImpl ?? fetch;
  return {
    id: "charm",
    async pullCharts() {
      const token = await smartToken(config, fetchImpl);
      const patients = await fetchBundle(fetchImpl, `${config.baseUrl}/Patient?_count=100`, token);
      const charts: CharmChart[] = [];
      for (const patient of patients) {
        const id = textOf(patient.id);
        if (!id) continue;
        const [observations, reports, medications] = await Promise.all([
          fetchBundle(fetchImpl, `${config.baseUrl}/Observation?patient=${encodeURIComponent(id)}&_count=200`, token),
          fetchBundle(fetchImpl, `${config.baseUrl}/DiagnosticReport?patient=${encodeURIComponent(id)}&_count=50`, token),
          fetchBundle(fetchImpl, `${config.baseUrl}/MedicationRequest?patient=${encodeURIComponent(id)}&_count=100`, token),
        ]);
        charts.push(chartFromFhir(patient, observations, reports, medications));
      }
      return charts;
    },
  };
}

async function smartToken(config: LiveConfig, fetchImpl: typeof fetch) {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    scope: config.scope,
  });
  if (config.privateKey) {
    const key = await importPKCS8(config.privateKey, "RS384");
    const assertion = await new SignJWT({})
      .setProtectedHeader({ alg: "RS384", typ: "JWT" })
      .setIssuer(config.clientId)
      .setSubject(config.clientId)
      .setAudience(config.tokenUrl)
      .setJti(crypto.randomUUID())
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(key);
    params.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    params.set("client_assertion", assertion);
  } else if (config.clientSecret) {
    params.set("client_id", config.clientId);
    params.set("client_secret", config.clientSecret);
  } else {
    throw new Error("Charm SMART auth is missing a private key or client secret");
  }
  const response = await fetchImpl(config.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: params,
  });
  if (!response.ok) throw new Error(`Charm token request failed (${response.status})`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error("Charm token response did not include an access token");
  return body.access_token;
}
