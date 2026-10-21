import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_CLINICIAN, DEMO_PATIENT } from "../../../shared/demo";
import type { User } from "../../../drizzle/schema";
import type { TrpcContext } from "../../_core/context";
import { appRouter } from "../../routers";
import { resetStoreForTests } from "../store";
import type { DestinationKey } from "../types";
import { createMockDestination } from "./adapters";
import { assertDeidentified, assertDeliveryShape, deidentify, gatePayload, type HubPatientRecord } from "./deidentify";
import { createCharmClient, createMockCharmClient } from "./fhir";
import { createCharmHub } from "./hub";

const NOW = new Date("2026-10-21T00:00:00Z");

function record(overrides: Partial<HubPatientRecord> = {}): HubPatientRecord {
  return {
    portalPatientId: 41,
    charmPatientId: "Patient/demo-morgan",
    mrn: "DEMO-MRN-MORGAN",
    accountNumber: "DEMO-ACCT-MORGAN",
    deviceId: "DEMO-DEVICE-MORGAN",
    firstName: "Morgan",
    lastName: "Hale",
    dateOfBirth: "1991-04-12",
    email: "morgan.hale@example.com",
    phone: "555-0148",
    fax: "555-0149",
    addressLine: "100 Harbor Lane",
    city: "Salt Lake City",
    state: "UT",
    postalCode: "84101",
    labs: [{
      name: "Sample vitamin D recheck",
      value: "52",
      unit: "ng/mL",
      collectedOn: "2026-10-01",
      referenceLow: "30",
      referenceHigh: "100",
      note: "Call Morgan Hale at 555-0148 or morgan.hale@example.com. MRN DEMO-MRN-MORGAN.",
    }],
    reports: [{
      name: "Sample metabolic panel",
      issuedOn: "2026-10-02",
      conclusion: "See https://example.test/morgan and zip 84101.",
    }],
    medications: [{
      name: "Sample magnesium glycinate template",
      dose: "200",
      unit: "mg",
      route: "oral",
      frequency: "nightly",
      status: "active",
      authoredOn: "2026-10-03",
    }],
    ...overrides,
  };
}

function caller(user: User | null) {
  return appRouter.createCaller({
    user,
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  });
}

describe("Safe Harbor de-identification", () => {
  it("strips names, dates of birth, contact fields, and identifiers", () => {
    const source = record();
    const body = deidentify(source, NOW);
    expect(body.state).toBe("UT");
    expect(body.ageBand).toBe("under 90");
    expect(body.labs[0]?.collectedYear).toBe("2026");
    expect(body.medications[0]?.name).toContain("magnesium");
    const serialized = JSON.stringify(body);
    for (const token of [
      "Morgan",
      "Hale",
      "1991-04-12",
      "morgan.hale@example.com",
      "555-0148",
      "555-0149",
      "Patient/demo-morgan",
      "DEMO-MRN-MORGAN",
      "DEMO-ACCT-MORGAN",
      "DEMO-DEVICE-MORGAN",
      "Harbor Lane",
      "Salt Lake City",
      "84101",
      "https://example.test",
    ]) {
      expect(serialized.toLowerCase()).not.toContain(token.toLowerCase());
    }
    expect(body).not.toHaveProperty("firstName");
    expect(body).not.toHaveProperty("email");
    assertDeidentified(body, source, NOW);
  });

  it("aggregates ages of 90 or older and drops the birth year", () => {
    const source = record({
      firstName: "Riley",
      lastName: "Chen",
      dateOfBirth: "1934-06-18",
      email: "riley.chen@example.com",
      charmPatientId: "Patient/demo-riley",
      mrn: "DEMO-MRN-RILEY",
      labs: [{
        name: "Sample B12 template",
        value: "410",
        unit: "pg/mL",
        collectedOn: "2026-08-15",
        referenceLow: null,
        referenceHigh: null,
        note: "Born 1934-06-18 in Ogden.",
      }],
    });
    const body = deidentify(source, NOW);
    expect(body.ageBand).toBe("90 or older");
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("1934");
    expect(serialized).not.toContain("Riley");
    expect(serialized).not.toContain("riley.chen@example.com");
  });

  it("refuses to mark an identified object as de-identified", () => {
    const source = record();
    expect(() => assertDeidentified({ firstName: "Morgan", note: "ok" }, source, NOW)).toThrow(/firstName/);
    expect(() => assertDeidentified({ note: "Morgan Hale" }, source, NOW)).toThrow(/identifier/);
    expect(() => assertDeliveryShape({ email: "morgan.hale@example.com" }, true)).toThrow(/email/);
  });

  it("sends identified fields only when the destination is BAA-covered", () => {
    const source = record();
    const covered = gatePayload(source, true, NOW);
    expect(covered.deidentified).toBe(false);
    expect(covered.body).toMatchObject({ firstName: "Morgan", email: "morgan.hale@example.com" });
    expect(covered.body).toMatchObject({ deviceId: null, accountNumber: null });

    const open = gatePayload(source, false, NOW);
    expect(open.deidentified).toBe(true);
    expect(JSON.stringify(open.body)).not.toContain("Morgan");
    expect(JSON.stringify(open.body)).not.toContain("morgan.hale@example.com");
  });
});

describe("Charm hub policy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks every destination until the kill switch is turned off, then de-identifies", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { store, service } = await resetStoreForTests();
    const clinician = await store.getUserByEmail(DEMO_CLINICIAN.email);
    const patientUser = await store.getUserByEmail(DEMO_PATIENT.email);
    const morgan = await store.getPatientByUserId(patientUser!.id);
    if (!clinician || !patientUser || !morgan) throw new Error("seed missing");

    const seen: Array<{ key: DestinationKey; body: unknown; deidentified: boolean }> = [];
    const adapters = Object.fromEntries((["slack", "gohighlevel", "viktor", "webhook"] as const).map((key) => [key, {
      key,
      async send(input: { body: unknown; deidentified: boolean }) {
        assertDeliveryShape(input.body, input.deidentified);
        seen.push({ key, ...input });
        return { externalId: `spy-${key}` };
      },
    }])) as Record<DestinationKey, { key: DestinationKey; send: (input: { body: unknown; deidentified: boolean }) => Promise<{ externalId: string }> }>;

    const hub = createCharmHub({
      store,
      charm: createMockCharmClient(),
      adapters,
      now: () => NOW,
    });

    const blocked = await hub.sync(clinician);
    expect(blocked.patients).toBe(3);
    expect(blocked.deliveries).toBe(0);
    expect(blocked.suppressed).toBe(12);
    expect(seen).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();

    const home = await service.patientHome(patientUser);
    const labs = await service.patientLabs(patientUser);
    expect(JSON.stringify(home)).not.toContain("magnesium");
    expect(JSON.stringify(home)).not.toContain("Quinn");
    expect(JSON.stringify(home)).not.toContain("Riley");
    expect(JSON.stringify(labs)).toContain("Sample vitamin D recheck");
    expect(JSON.stringify(labs)).not.toContain("Sample TSH template");
    expect(JSON.stringify(labs)).not.toContain("Riley");

    const before = (await store.listLabs(morgan.id)).length;
    await hub.sync(clinician);
    expect((await store.listLabs(morgan.id)).length).toBe(before);

    await hub.setDestination(clinician, { key: "slack", label: "Slack", enabled: true, baaCovered: false });
    await hub.setDestination(clinician, { key: "webhook", label: "Webhook", enabled: true, baaCovered: true });
    seen.length = 0;
    const sent = await hub.sync(clinician);
    expect(sent.deliveries).toBe(6);
    expect(seen.filter((item) => item.key === "slack").every((item) => item.deidentified)).toBe(true);
    expect(seen.filter((item) => item.key === "webhook").every((item) => !item.deidentified)).toBe(true);
    const slackBodies = JSON.stringify(seen.filter((item) => item.key === "slack").map((item) => item.body));
    expect(slackBodies).not.toContain("Morgan");
    expect(slackBodies).not.toContain("Quinn");
    expect(slackBodies).not.toContain("Riley");
    expect(slackBodies).not.toContain("example.com");
    expect(slackBodies).not.toContain("555-");
    const webhookBodies = JSON.stringify(seen.filter((item) => item.key === "webhook").map((item) => item.body));
    expect(webhookBodies).toContain("Morgan");

    const sends = await store.listHubSends(50);
    expect(sends.some((item) => item.status === "sent" && item.deidentified && item.destinationKey === "slack")).toBe(true);
    const auditBlob = JSON.stringify(sends);
    expect(auditBlob).not.toContain("morgan.hale@example.com");
    expect(auditBlob).not.toContain("DEMO-MRN");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps the hub off patient and staff sessions", async () => {
    const { store } = await resetStoreForTests();
    const clinician = await store.getUserByEmail(DEMO_CLINICIAN.email);
    const patientUser = await store.getUserByEmail(DEMO_PATIENT.email);
    if (!clinician || !patientUser) throw new Error("seed missing");
    const staff = { ...clinician, role: "staff" as const };
    await expect(caller(patientUser).portal.hub.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(staff).portal.hub.sync()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const overview = await caller(clinician).portal.hub.overview();
    expect(overview.source.id).toBe("mock");
    expect(overview.destinations.map((item) => item.key)).toEqual(["slack", "gohighlevel", "viktor", "webhook"]);
    expect(overview.destinations.every((item) => item.enabled === false && item.baaCovered === false)).toBe(true);
  });

  it("uses the mock Charm client unless live credentials are configured", () => {
    expect(createCharmClient({}).id).toBe("mock");
    expect(() => createCharmClient({ CHARM_ADAPTER: "live" })).toThrow(/CHARM_FHIR_BASE_URL/);
  });

  it("does not let a mock adapter accept identifier fields on a de-identified send", async () => {
    await expect(createMockDestination("slack").send({
      deidentified: true,
      body: { firstName: "Morgan" },
    })).rejects.toThrow(/firstName/);
  });
});
