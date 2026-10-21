import type { ItemKind } from "./types";

/**
 * Clinician-only guidance drafts.
 *
 * The default model is a deterministic stub. Nothing it returns is shown to
 * a patient. The portal service stores every suggestion as status "pending"
 * until a clinician approves or dismisses it. Approval copies the text into
 * a draft plan note, which is still invisible until the clinician publishes.
 *
 * To try a hosted model later, set GUIDANCE_PROVIDER=anthropic and
 * ANTHROPIC_API_KEY in the environment. Do not commit the key. The hosted
 * call is still only a draft source — it cannot publish or prescribe.
 */
export type GuidanceInput = {
  patientFirstName: string;
  labs: { name: string; value: string; unit: string; collectedOn: string }[];
  items: { kind: ItemKind; name: string; dose: string | null; status: string }[];
};

export type GuidanceSuggestion = {
  title: string;
  body: string;
};

export interface GuidanceModel {
  readonly id: string;
  suggest(input: GuidanceInput): Promise<GuidanceSuggestion[]>;
}

const DRAFT_PREFIX = "UNREVIEWED DRAFT — not medical guidance.";

export function createStubGuidanceModel(): GuidanceModel {
  return {
    id: "stub",
    async suggest(input) {
      const suggestions: GuidanceSuggestion[] = [];
      const vitaminD = input.labs.filter((lab) => lab.name.toLowerCase().includes("vitamin d"));
      if (vitaminD.length > 0) {
        const latest = vitaminD[vitaminD.length - 1];
        suggestions.push({
          title: "Sample draft: vitamin D trend",
          body: [
            DRAFT_PREFIX,
            `Fictional prompt for ${input.patientFirstName}'s clinician. The chart lists vitamin D at ${latest.value} ${latest.unit} on ${latest.collectedOn}.`,
            "A clinician could decide whether that trend is worth a conversation.",
            "This is not a dose, not a prescription, and it is not visible to the patient.",
          ].join(" "),
        });
      } else {
        suggestions.push({
          title: "Sample draft: chart review",
          body: `${DRAFT_PREFIX} No specific lab trend was selected. This stub only shows where a reviewed suggestion would appear for the clinician.`,
        });
      }

      if (input.items.some((item) => item.kind === "peptide")) {
        suggestions.push({
          title: "Sample draft: peptide line stays clinician-reviewed",
          body: `${DRAFT_PREFIX} A peptide line is on the draft plan. Leave any change to the clinician. Do not auto-renew it and do not queue it from this panel.`,
        });
      }

      return suggestions.slice(0, 2);
    },
  };
}

export function createAnthropicGuidanceModel(apiKey: string): GuidanceModel {
  return {
    id: "anthropic",
    async suggest(input) {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: process.env.GUIDANCE_MODEL ?? "claude-3-5-haiku-latest",
        max_tokens: 700,
        system: [
          "You help a licensed clinician review a chart.",
          'Return JSON only: {"suggestions":[{"title":string,"body":string}]} with at most 2 items.',
          `Every body must start with "${DRAFT_PREFIX}"`,
          "Do not prescribe, do not invent doses, and do not address the patient.",
        ].join(" "),
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      const text = message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end < start) {
        throw new Error("Guidance model did not return JSON");
      }
      const parsed = JSON.parse(text.slice(start, end + 1)) as {
        suggestions?: { title?: string; body?: string }[];
      };
      return (parsed.suggestions ?? []).slice(0, 2).map((suggestion) => ({
        title: String(suggestion.title ?? "Draft suggestion").slice(0, 256),
        body: String(suggestion.body ?? DRAFT_PREFIX).slice(0, 4000),
      }));
    },
  };
}

export function createGuidanceModel(): GuidanceModel {
  if (process.env.GUIDANCE_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return createAnthropicGuidanceModel(process.env.ANTHROPIC_API_KEY);
  }
  return createStubGuidanceModel();
}
