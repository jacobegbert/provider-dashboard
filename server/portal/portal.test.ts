import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_CLINICIAN, DEMO_PATIENT } from "../../shared/demo";
import type { User } from "../../drizzle/schema";
import type { TrpcContext } from "../_core/context";
import { appRouter } from "../routers";
import { pharmacyChanges } from "./planDiff";
import { createMockPharmacyAdapter } from "./pharmacy";
import { resetStoreForTests } from "./store";
import type { PlanItem } from "./types";

function caller(user: User | null, res?: { cookie: ReturnType<typeof vi.fn>; clearCookie: ReturnType<typeof vi.fn> }) {
  return appRouter.createCaller({
    user,
    req: { protocol: "http", headers: {} } as TrpcContext["req"],
    res: (res ?? { cookie: vi.fn(), clearCookie: vi.fn() }) as unknown as TrpcContext["res"],
  });
}

async function setup() {
  const { store, service } = await resetStoreForTests();
  const clinician = await store.getUserByEmail(DEMO_CLINICIAN.email);
  const patientUser = await store.getUserByEmail(DEMO_PATIENT.email);
  const morgan = await store.getPatientByUserId(patientUser!.id);
  const quinn = (await store.listPatients()).find((patient) => patient.firstName === "Quinn");
  if (!clinician || !patientUser || !morgan || !quinn) throw new Error("seed missing");
  return { store, service, clinician, patientUser, morgan, quinn };
}

function item(partial: Partial<PlanItem> & Pick<PlanItem, "id" | "kind" | "name" | "phase">): PlanItem {
  return {
    planId: 1,
    patientId: 1,
    sourceItemId: null,
    dose: null,
    unit: null,
    route: null,
    frequency: null,
    instructions: null,
    status: "active",
    isSampleTemplate: true,
    sortOrder: 1,
    ...partial,
  };
}

describe("plan diff", () => {
  it("queues medication and peptide changes and skips regenerative lines and notes", () => {
    const previous = [
      item({ id: 10, phase: "published", sourceItemId: 1, kind: "medication", name: "D3", dose: "1000" }),
      item({ id: 11, phase: "published", sourceItemId: 2, kind: "regenerative", name: "Cell protocol" }),
    ];
    const next = [
      item({ id: 1, phase: "draft", kind: "medication", name: "D3", dose: "5000" }),
      item({ id: 2, phase: "draft", kind: "regenerative", name: "Cell protocol", status: "clinic_managed" }),
      item({ id: 3, phase: "draft", kind: "peptide", name: "Sample peptide" }),
      item({ id: 4, phase: "draft", kind: "note", name: "A note" }),
    ];
    const changes = pharmacyChanges(previous, next);
    expect(changes.map((change) => change.changeType).sort()).toEqual(["change", "new"]);
    expect(changes.some((change) => change.drugName.includes("Cell"))).toBe(false);
    expect(changes.some((change) => change.drugName === "A note")).toBe(false);
  });
});

describe("portal isolation and publish", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps each patient on their own chart", async () => {
    const { patientUser, clinician, quinn } = await setup();
    const home = await caller(patientUser).portal.patient.home();
    const serialized = JSON.stringify(home);
    expect(serialized).not.toContain("TB-500");
    expect(serialized).not.toContain("Ferritin");
    expect(serialized).not.toContain("Quinn");
    expect(serialized).not.toContain("UNREVIEWED DRAFT");
    expect(home.plan.items.some((row) => row.name.includes("BPC-157"))).toBe(true);
    await expect(caller(patientUser).portal.clinic.chart({ patientId: quinn.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(patientUser).portal.pharmacy.queue()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const chart = await caller(clinician).portal.clinic.chart({ patientId: quinn.id });
    expect(chart.patient.firstName).toBe("Quinn");
  });

  it("hides draft edits until publish, then notifies the patient", async () => {
    const { service, clinician, patientUser, morgan } = await setup();
    const events: string[] = [];
    const { subscribePortal } = await import("./events");
    const stop = subscribePortal(patientUser.id, (event) => events.push(event.type));
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await service.addItem(clinician, morgan.id, {
      kind: "medication",
      name: "Sample magnesium template",
      dose: "200",
      unit: "mg",
      route: "oral",
      frequency: "nightly",
      status: "active",
      instructions: "SAMPLE TEMPLATE — not medical guidance.",
      isSampleTemplate: true,
    });
    const before = await service.patientHome(patientUser);
    expect(JSON.stringify(before)).not.toContain("magnesium");
    expect(events).toEqual([]);

    const published = await service.publish(clinician, morgan.id);
    expect(published.changed).toBe(true);
    expect(published.ordersCreated).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(events).toContain("plan");

    const after = await service.patientHome(patientUser);
    expect(JSON.stringify(after)).toContain("Sample magnesium template");
    expect(after.plan.version).toBe(published.version);

    const again = await service.publish(clinician, morgan.id);
    expect(again.changed).toBe(false);
    expect(again.ordersCreated).toBe(0);
    stop();
  });

  it("does not queue a regenerative publish and does discontinue a removed medicine", async () => {
    const { service, store, clinician, morgan } = await setup();
    await service.addItem(clinician, morgan.id, {
      kind: "regenerative",
      name: "Sample extra cell entry",
      status: "clinic_managed",
      instructions: "SAMPLE TEMPLATE — not medical guidance.",
      isSampleTemplate: true,
    });
    const regenerative = await service.publish(clinician, morgan.id);
    expect(regenerative.ordersCreated).toBe(0);

    const draft = await store.listItems(morgan.id, "draft");
    const vitamin = draft.find((row) => row.name.includes("vitamin D3"));
    await service.removeItem(clinician, morgan.id, vitamin!.id);
    const removed = await service.publish(clinician, morgan.id);
    expect(removed.ordersCreated).toBe(1);
    const orders = await store.listOrders(morgan.id);
    expect(orders[0]?.changeType).toBe("discontinue");
  });

  it("keeps guidance drafts off the patient view until a clinician publishes a note", async () => {
    const { service, clinician, patientUser, morgan } = await setup();
    const drafts = await service.requestGuidance(clinician, morgan.id);
    expect(drafts[0]?.body.startsWith("UNREVIEWED DRAFT")).toBe(true);
    const home = await service.patientHome(patientUser);
    expect(JSON.stringify(home)).not.toContain("UNREVIEWED DRAFT");
    expect(JSON.stringify(home)).not.toContain(drafts[0]!.title);

    await service.reviewGuidance(clinician, drafts[0]!.id, "approved");
    const stillHidden = await service.patientHome(patientUser);
    expect(JSON.stringify(stillHidden)).not.toContain(drafts[0]!.title);

    const chart = await service.chart(clinician, morgan.id);
    expect(chart.draftItems.some((row) => row.name === drafts[0]!.title)).toBe(true);
    expect(chart.publishedItems.some((row) => row.name === drafts[0]!.title)).toBe(false);
    expect(chart.guidance.some((row) => row.id === drafts[0]!.id)).toBe(false);
  });

  it("rejects a cross-chart item edit and a bad password", async () => {
    const { service, store, clinician, patientUser } = await setup();
    const quinnItems = await store.listItems((await store.listPatients()).find((patient) => patient.firstName === "Quinn")!.id, "draft");
    const morgan = await store.getPatientByUserId(patientUser.id);
    await expect(service.updateItem(clinician, morgan!.id, quinnItems[0]!.id, { name: "Stolen rename" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(quinnItems[0]!.name).toContain("TB-500");

    const res = { cookie: vi.fn(), clearCookie: vi.fn() };
    await expect(caller(null, res).auth.login({
      email: DEMO_PATIENT.email,
      password: "not-the-password",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(res.cookie).not.toHaveBeenCalled();

    await caller(null, res).auth.login({
      email: DEMO_CLINICIAN.email,
      password: DEMO_CLINICIAN.password,
    });
    expect(res.cookie).toHaveBeenCalled();
    const me = await caller(clinician).auth.me();
    expect(me).not.toHaveProperty("passwordHash");
    expect(me?.role).toBe("admin");
  });

  it("lets staff read the roster and only updates mock pharmacy orders locally", async () => {
    const { clinician, morgan } = await setup();
    const staff = { ...clinician, role: "staff" as const };
    const roster = await caller(staff).portal.clinic.roster();
    expect(roster.map((row) => row.firstName).sort()).toEqual(["Morgan", "Quinn"]);
    const queue = await caller(staff).portal.pharmacy.queue();
    expect(queue.adapterId).toBe("mock");
    const order = queue.orders.find((row) => row.patientId === morgan.id);
    const updated = await caller(staff).portal.pharmacy.setStatus({ orderId: order!.id, status: "filled" });
    expect(updated.status).toBe("filled");
    const adapter = createMockPharmacyAdapter();
    const submitted = await adapter.submit({
      localId: "1",
      patientId: morgan.id,
      changeType: "new",
      drugName: "Sample",
      details: "demo",
    });
    expect(submitted.externalId.startsWith("mock-")).toBe(true);
  });
});
