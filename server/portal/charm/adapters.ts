import type { DestinationKey } from "../types";
import { assertDeliveryShape } from "./deidentify";

/**
 * Downstream fan-out.
 *
 * Each adapter receives the payload the policy already gated. A non-BAA
 * send has deidentified=true and must not contain identifier fields;
 * assertDeliveryShape refuses the call before any network I/O.
 *
 * HUB_DELIVERY stays "mock" unless it is set to "live" and that destination's
 * own secret is present. Tests use the mock adapters and do not call vendors.
 *
 * Viktor has no direct API here. The Viktor adapter posts to a Slack channel
 * the clinic has pointed at Viktor. GoHighLevel contact and invoice calls
 * run only for an identified (BAA) payload. A de-identified GoHighLevel send
 * posts the Safe Harbor JSON as a location note and does not create a contact.
 */

export type HubDelivery = {
  body: unknown;
  deidentified: boolean;
};

export interface HubDestinationAdapter {
  readonly key: DestinationKey;
  send(input: HubDelivery): Promise<{ externalId: string }>;
}

export function createMockDestination(key: DestinationKey): HubDestinationAdapter {
  return {
    key,
    async send(input) {
      assertDeliveryShape(input.body, input.deidentified);
      return { externalId: `mock-${key}` };
    },
  };
}

export function createDestinationAdapters(env: NodeJS.ProcessEnv = process.env): Record<DestinationKey, HubDestinationAdapter> {
  const live = env.HUB_DELIVERY === "live";
  const slackToken = env.SLACK_BOT_TOKEN?.trim();
  const ghlToken = env.GHL_API_TOKEN?.trim();
  const ghlLocation = env.GHL_LOCATION_ID?.trim();
  return {
    slack: live && slackToken && env.SLACK_CHANNEL_ID?.trim()
      ? createSlackAdapter("slack", slackToken, env.SLACK_CHANNEL_ID.trim())
      : createMockDestination("slack"),
    viktor: live && slackToken && env.VIKTOR_SLACK_CHANNEL_ID?.trim()
      ? createSlackAdapter("viktor", slackToken, env.VIKTOR_SLACK_CHANNEL_ID.trim(), "Viktor queue")
      : createMockDestination("viktor"),
    gohighlevel: live && ghlToken && ghlLocation
      ? createGoHighLevelAdapter(ghlToken, ghlLocation)
      : createMockDestination("gohighlevel"),
    webhook: live && env.HUB_WEBHOOK_URL?.trim()
      ? createWebhookAdapter(env.HUB_WEBHOOK_URL.trim())
      : createMockDestination("webhook"),
  };
}

function createSlackAdapter(key: "slack" | "viktor", token: string, channel: string, title = "Charm hub"): HubDestinationAdapter {
  return {
    key,
    async send(input) {
      assertDeliveryShape(input.body, input.deidentified);
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          channel,
          text: `${title}\n${JSON.stringify(input.body)}`,
        }),
      });
      if (!response.ok) throw new Error(`Slack delivery failed (${response.status})`);
      const body = await response.json() as { ok?: boolean; ts?: string; error?: string };
      if (!body.ok) throw new Error(`Slack delivery was rejected (${body.error ?? "unknown"})`);
      return { externalId: body.ts ?? `${key}-posted` };
    },
  };
}

function readContact(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const firstName = typeof record.firstName === "string" ? record.firstName : "";
  const lastName = typeof record.lastName === "string" ? record.lastName : "";
  const email = typeof record.email === "string" ? record.email : "";
  const phone = typeof record.phone === "string" ? record.phone : "";
  if (!firstName && !email) return null;
  return { firstName, lastName, email, phone };
}

function createGoHighLevelAdapter(token: string, locationId: string): HubDestinationAdapter {
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    version: "2021-07-28",
  };
  return {
    key: "gohighlevel",
    async send(input) {
      assertDeliveryShape(input.body, input.deidentified);
      if (input.deidentified) {
        const response = await fetch("https://services.leadconnectorhq.com/contacts/notes", {
          method: "POST",
          headers,
          body: JSON.stringify({
            locationId,
            body: JSON.stringify(input.body),
          }),
        });
        if (!response.ok) throw new Error(`GoHighLevel de-identified delivery failed (${response.status})`);
        return { externalId: `ghl-deidentified-${locationId}` };
      }
      const contact = readContact(input.body);
      if (!contact) throw new Error("GoHighLevel identified delivery is missing a contact");
      const created = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...contact, locationId }),
      });
      if (!created.ok) throw new Error(`GoHighLevel contact sync failed (${created.status})`);
      const createdBody = await created.json() as { contact?: { id?: string } };
      const contactId = createdBody.contact?.id;
      if (!contactId) throw new Error("GoHighLevel contact sync did not return an id");
      const invoice = await fetch("https://services.leadconnectorhq.com/invoices/", {
        method: "POST",
        headers,
        body: JSON.stringify({
          altId: locationId,
          altType: "location",
          contactId,
          name: "Charm sync",
          currency: "USD",
          items: [{ name: "Charm clinical sync", amount: 0, qty: 1 }],
        }),
      });
      if (!invoice.ok) throw new Error(`GoHighLevel invoice sync failed (${invoice.status})`);
      return { externalId: contactId };
    },
  };
}

function createWebhookAdapter(url: string): HubDestinationAdapter {
  return {
    key: "webhook",
    async send(input) {
      assertDeliveryShape(input.body, input.deidentified);
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deidentified: input.deidentified, body: input.body }),
      });
      if (!response.ok) throw new Error(`Webhook delivery failed (${response.status})`);
      return { externalId: "webhook-accepted" };
    },
  };
}
