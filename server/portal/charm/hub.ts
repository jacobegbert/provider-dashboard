import { SAMPLE_PREFIX } from "../../../shared/demo";
import type { User } from "../../../drizzle/schema";
import type { DestinationKey, HubDestination, HubSendStatus, PortalStore } from "../types";
import { createDestinationAdapters, type HubDestinationAdapter } from "./adapters";
import { gatePayload, type HubPatientRecord } from "./deidentify";
import { createCharmClient, type CharmChart, type CharmFhirClient } from "./fhir";

export const DESTINATION_DEFAULTS: HubDestination[] = [
  { key: "slack", label: "Slack", enabled: false, baaCovered: false },
  { key: "gohighlevel", label: "GoHighLevel", enabled: false, baaCovered: false },
  { key: "viktor", label: "Viktor via Slack", enabled: false, baaCovered: false },
  { key: "webhook", label: "Webhook", enabled: false, baaCovered: false },
];

const KEYS = new Set<DestinationKey>(DESTINATION_DEFAULTS.map((item) => item.key));

function sample(text: string) {
  return `${SAMPLE_PREFIX} ${text}`;
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export type CharmHub = ReturnType<typeof createCharmHub>;

export function createCharmHub(deps: {
  store: PortalStore;
  charm?: CharmFhirClient;
  adapters?: Record<DestinationKey, HubDestinationAdapter>;
  now?: () => Date;
}) {
  const store = deps.store;
  const charm = deps.charm ?? createCharmClient();
  const adapters = deps.adapters ?? createDestinationAdapters();
  const now = deps.now ?? (() => new Date());

  async function destinations() {
    const existing = await store.listDestinations();
    const present = new Set(existing.map((item) => item.key));
    for (const item of DESTINATION_DEFAULTS) {
      if (!present.has(item.key)) await store.saveDestination(item);
    }
    const rows = await store.listDestinations();
    return DESTINATION_DEFAULTS.map((item) => rows.find((row) => row.key === item.key) ?? item);
  }

  async function recordSend(input: {
    userId: number;
    patientId: number;
    destinationKey: DestinationKey;
    status: HubSendStatus;
    deidentified: boolean;
    baaCovered: boolean;
    summary: string;
    externalId?: string | null;
  }) {
    const send = await store.insertHubSend({
      destinationKey: input.destinationKey,
      status: input.status,
      deidentified: input.deidentified,
      baaCovered: input.baaCovered,
      summary: input.summary,
      externalId: input.externalId ?? null,
    });
    const action = input.status === "sent" ? "hub.send" : input.status === "suppressed" ? "hub.send.suppressed" : "hub.send.failed";
    await store.logAudit({
      userId: input.userId,
      action,
      entityType: "hub_send",
      entityId: send.id,
      details: {
        patientId: input.patientId,
        destinationKey: input.destinationKey,
        status: input.status,
        deidentified: input.deidentified,
        baaCovered: input.baaCovered,
        externalId: input.externalId ?? null,
      },
    });
    return send;
  }

  async function deliver(user: User, patientId: number, record: HubPatientRecord, destination: HubDestination, extraSecrets: string[]) {
    const counts = [
      countLabel(record.labs.length, "lab", "labs"),
      countLabel(record.reports.length, "report", "reports"),
      countLabel(record.medications.length, "medication", "medications"),
    ].join(", ");
    if (!destination.enabled) {
      return recordSend({
        userId: user.id,
        patientId,
        destinationKey: destination.key,
        status: "suppressed",
        deidentified: !destination.baaCovered,
        baaCovered: destination.baaCovered,
        summary: `Kill switch on. Nothing sent. ${counts}.`,
      });
    }
    const adapter = adapters[destination.key];
    if (!adapter) {
      return recordSend({
        userId: user.id,
        patientId,
        destinationKey: destination.key,
        status: "failed",
        deidentified: !destination.baaCovered,
        baaCovered: destination.baaCovered,
        summary: `No adapter is configured. Nothing sent. ${counts}.`,
      });
    }
    let gated: ReturnType<typeof gatePayload>;
    try {
      gated = gatePayload(record, destination.baaCovered, now(), extraSecrets);
    } catch {
      return recordSend({
        userId: user.id,
        patientId,
        destinationKey: destination.key,
        status: "failed",
        deidentified: true,
        baaCovered: destination.baaCovered,
        summary: `Policy rejected the payload before delivery. ${counts}.`,
      });
    }
    try {
      const result = await adapter.send({ body: gated.body, deidentified: gated.deidentified });
      return recordSend({
        userId: user.id,
        patientId,
        destinationKey: destination.key,
        status: "sent",
        deidentified: gated.deidentified,
        baaCovered: destination.baaCovered,
        externalId: result.externalId,
        summary: gated.deidentified
          ? `De-identified Safe Harbor payload. ${counts}.`
          : `Identified minimum-necessary payload. Names were not copied into this log. ${counts}.`,
      });
    } catch {
      return recordSend({
        userId: user.id,
        patientId,
        destinationKey: destination.key,
        status: "failed",
        deidentified: gated.deidentified,
        baaCovered: destination.baaCovered,
        summary: `Destination rejected the delivery. Payload was not retried. ${counts}.`,
      });
    }
  }

  async function matchPatient(user: User, chart: CharmChart) {
    const linked = await store.getCharmLinkByCharmId(chart.patient.fhirId);
    if (linked) {
      const patient = await store.getPatient(linked.patientId);
      if (patient && !patient.deletedAt) return patient;
    }
    const email = chart.patient.email?.trim().toLowerCase();
    if (email) {
      const roster = await store.listPatients();
      const found = roster.find((patient) => patient.email?.toLowerCase() === email);
      if (found) return found;
    }
    return store.insertPatient({
      userId: null,
      providerId: user.id,
      firstName: chart.patient.firstName,
      lastName: chart.patient.lastName,
      email: chart.patient.email,
      phone: chart.patient.phone,
      dateOfBirth: chart.patient.dateOfBirth,
      status: "active",
      notes: "Imported from the Charm feed. Fictional when the mock adapter is in use.",
    });
  }

  async function upsertLabs(patientId: number, chart: CharmChart) {
    let count = 0;
    for (const lab of chart.observations) {
      const existing = await store.getResourceLink(lab.fhirId);
      const fields = {
        name: lab.name,
        value: lab.value,
        unit: lab.unit || "—",
        referenceLow: lab.referenceLow,
        referenceHigh: lab.referenceHigh,
        collectedOn: lab.collectedOn.slice(0, 10),
        note: lab.note,
      };
      if (existing) await store.updateLab(existing.portalId, fields);
      else {
        const created = await store.insertLab({ patientId, ...fields });
        await store.insertResourceLink({ charmId: lab.fhirId, kind: "observation", portalId: created.id });
      }
      count += 1;
    }
    for (const report of chart.reports) {
      const existing = await store.getResourceLink(report.fhirId);
      const fields = {
        name: report.name,
        value: "narrative",
        unit: "report",
        referenceLow: null,
        referenceHigh: null,
        collectedOn: report.issuedOn.slice(0, 10),
        note: report.conclusion,
      };
      if (existing) await store.updateLab(existing.portalId, fields);
      else {
        const created = await store.insertLab({ patientId, ...fields });
        await store.insertResourceLink({ charmId: report.fhirId, kind: "diagnostic_report", portalId: created.id });
      }
      count += 1;
    }
    return count;
  }

  async function upsertMedications(patientId: number, chart: CharmChart) {
    const plan = await store.getPlan(patientId);
    if (!plan) return 0;
    let count = 0;
    for (const med of chart.medications) {
      const fields = {
        kind: "medication" as const,
        name: med.name,
        dose: med.dose,
        unit: med.unit,
        route: med.route,
        frequency: med.frequency,
        instructions: med.sampleTemplate
          ? sample("Imported from the Charm demo feed. Not a prescription.")
          : "Imported from Charm into the draft plan. Patients do not see it until it is published.",
        status: med.status,
        isSampleTemplate: med.sampleTemplate,
      };
      const existing = await store.getResourceLink(med.fhirId);
      if (existing) await store.updateItem(existing.portalId, fields);
      else {
        const drafts = await store.listItems(patientId, "draft");
        const sortOrder = drafts.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
        const created = await store.insertItem({
          planId: plan.id,
          patientId,
          phase: "draft",
          sourceItemId: null,
          sortOrder,
          ...fields,
        });
        await store.insertResourceLink({ charmId: med.fhirId, kind: "medication", portalId: created.id });
      }
      count += 1;
    }
    return count;
  }

  return {
    sourceId: charm.id,
    async overview() {
      return {
        source: {
          id: charm.id,
          label: charm.id === "mock" ? "Mock Charm FHIR" : "Charm Health FHIR",
        },
        destinations: await destinations(),
        sends: await store.listHubSends(25),
      };
    },
    async setDestination(user: User, input: HubDestination) {
      if (!KEYS.has(input.key)) throw new Error("Unknown destination");
      const current = (await destinations()).find((item) => item.key === input.key);
      const saved = await store.saveDestination({
        key: input.key,
        label: current?.label ?? input.label,
        enabled: input.enabled,
        baaCovered: input.baaCovered,
      });
      await store.logAudit({
        userId: user.id,
        action: "hub.destination",
        entityType: "hub_destination",
        entityId: null,
        details: { destinationKey: saved.key, enabled: saved.enabled, baaCovered: saved.baaCovered },
      });
      return saved;
    },
    async sync(user: User) {
      const charts = await charm.pullCharts();
      const configured = await destinations();
      const extraSecrets = charts.flatMap((chart) => [
        chart.patient.firstName,
        chart.patient.lastName,
        `${chart.patient.firstName} ${chart.patient.lastName}`,
        chart.patient.email ?? "",
        chart.patient.phone ?? "",
        chart.patient.fax ?? "",
        chart.patient.mrn ?? "",
        chart.patient.fhirId,
        chart.patient.addressLine ?? "",
        chart.patient.city ?? "",
        chart.patient.postalCode ?? "",
        chart.patient.accountNumber ?? "",
        chart.patient.deviceId ?? "",
        chart.patient.dateOfBirth ?? "",
      ]);
      let labs = 0;
      let medications = 0;
      let suppressed = 0;
      let deliveries = 0;
      for (const chart of charts) {
        const patient = await matchPatient(user, chart);
        await store.updatePatient(patient.id, {
          firstName: chart.patient.firstName,
          lastName: chart.patient.lastName,
          email: chart.patient.email,
          phone: chart.patient.phone,
          dateOfBirth: chart.patient.dateOfBirth,
        });
        if (!await store.getPlan(patient.id)) {
          await store.insertPlan({
            patientId: patient.id,
            providerId: user.id,
            summary: sample("Imported from the Charm demo feed. Draft until a clinician publishes."),
            publishedSummary: "",
            version: 0,
            publishedAt: null,
          });
        }
        await store.upsertCharmLink({
          patientId: patient.id,
          charmPatientId: chart.patient.fhirId,
          lastSyncedAt: now(),
        });
        labs += await upsertLabs(patient.id, chart);
        medications += await upsertMedications(patient.id, chart);
        const record: HubPatientRecord = {
          portalPatientId: patient.id,
          charmPatientId: chart.patient.fhirId,
          mrn: chart.patient.mrn,
          accountNumber: chart.patient.accountNumber,
          deviceId: chart.patient.deviceId,
          firstName: chart.patient.firstName,
          lastName: chart.patient.lastName,
          dateOfBirth: chart.patient.dateOfBirth,
          email: chart.patient.email,
          phone: chart.patient.phone,
          fax: chart.patient.fax,
          addressLine: chart.patient.addressLine,
          city: chart.patient.city,
          state: chart.patient.state,
          postalCode: chart.patient.postalCode,
          labs: [
            ...chart.observations.map((lab) => ({
              name: lab.name,
              value: lab.value,
              unit: lab.unit,
              collectedOn: lab.collectedOn,
              referenceLow: lab.referenceLow,
              referenceHigh: lab.referenceHigh,
              note: lab.note,
            })),
            ...chart.reports.map((report) => ({
              name: report.name,
              value: "narrative",
              unit: "report",
              collectedOn: report.issuedOn,
              referenceLow: null,
              referenceHigh: null,
              note: report.conclusion,
            })),
          ],
          reports: chart.reports.map((report) => ({
            name: report.name,
            issuedOn: report.issuedOn,
            conclusion: report.conclusion,
          })),
          medications: chart.medications.map((med) => ({
            name: med.name,
            dose: med.dose,
            unit: med.unit,
            route: med.route,
            frequency: med.frequency,
            status: med.status,
            authoredOn: med.authoredOn,
          })),
        };
        await store.logAudit({
          userId: user.id,
          action: "hub.sync",
          entityType: "patient",
          entityId: patient.id,
          details: { patientId: patient.id, source: charm.id },
        });
        for (const destination of configured) {
          const send = await deliver(user, patient.id, record, destination, extraSecrets);
          if (send.status === "sent") deliveries += 1;
          if (send.status === "suppressed") suppressed += 1;
        }
      }
      return { patients: charts.length, labs, medications, deliveries, suppressed };
    },
  };
}
