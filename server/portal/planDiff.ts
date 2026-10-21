import type { PharmacyChangeType, PlanItem } from "./types";

const DISPENSABLE = new Set<PlanItem["kind"]>(["medication", "peptide"]);

export type PharmacyChange = {
  changeType: PharmacyChangeType;
  planItemId: number | null;
  patientId: number;
  kind: "medication" | "peptide";
  drugName: string;
  details: string;
};

function field(value: string | null | undefined) {
  return (value ?? "").trim();
}

function signature(item: PlanItem) {
  return [
    item.kind,
    field(item.name),
    field(item.dose),
    field(item.unit),
    field(item.route),
    field(item.frequency),
    item.status,
    field(item.instructions),
  ].join("\u001f");
}

function describe(item: Pick<PlanItem, "dose" | "unit" | "route" | "frequency" | "status">) {
  return [item.dose, item.unit, item.route, item.frequency, item.status].filter(Boolean).join(" · ");
}

export function canonicalItems(items: PlanItem[]) {
  return JSON.stringify(
    items
      .map((item) => ({
        key: item.phase === "published" ? (item.sourceItemId ?? item.id) : item.id,
        kind: item.kind,
        name: field(item.name),
        dose: field(item.dose),
        unit: field(item.unit),
        route: field(item.route),
        frequency: field(item.frequency),
        instructions: field(item.instructions),
        status: item.status,
        isSampleTemplate: item.isSampleTemplate,
        sortOrder: item.sortOrder,
      }))
      .sort((a, b) => a.key - b.key || a.name.localeCompare(b.name)),
  );
}

export function plansDiffer(
  plan: { summary: string; publishedSummary: string },
  items: PlanItem[],
) {
  const summaryChanged = field(plan.summary) !== field(plan.publishedSummary);
  const itemsChanged =
    canonicalItems(items.filter((item) => item.phase === "draft")) !==
    canonicalItems(items.filter((item) => item.phase === "published"));
  return summaryChanged || itemsChanged;
}

/**
 * Pharmacy orders are only for medication and peptide lines.
 * Regenerative protocols stay clinic-managed and never enter the queue.
 * Notes never enter the queue.
 */
export function pharmacyChanges(previousPublished: PlanItem[], nextDraft: PlanItem[]): PharmacyChange[] {
  const previous = previousPublished.filter((item) => DISPENSABLE.has(item.kind));
  const next = nextDraft.filter((item) => DISPENSABLE.has(item.kind));
  const changes: PharmacyChange[] = [];

  for (const item of next) {
    const prior = previous.find((candidate) => candidate.sourceItemId === item.id);
    if (!prior) {
      changes.push({
        changeType: "new",
        planItemId: item.id,
        patientId: item.patientId,
        kind: item.kind as "medication" | "peptide",
        drugName: item.name,
        details: describe(item),
      });
      continue;
    }
    if (signature(prior) !== signature(item)) {
      changes.push({
        changeType: "change",
        planItemId: item.id,
        patientId: item.patientId,
        kind: item.kind as "medication" | "peptide",
        drugName: item.name,
        details: describe(item),
      });
    }
  }

  for (const prior of previous) {
    const stillThere = prior.sourceItemId != null && next.some((item) => item.id === prior.sourceItemId);
    if (!stillThere) {
      changes.push({
        changeType: "discontinue",
        planItemId: prior.sourceItemId,
        patientId: prior.patientId,
        kind: prior.kind as "medication" | "peptide",
        drugName: prior.name,
        details: `Discontinue. Last published as ${describe(prior)}`,
      });
    }
  }

  return changes;
}
