/**
 * Twilio Incoming SMS Webhook
 *
 * When a patient replies to an SMS notification, this webhook:
 * 1. Looks up the patient by their phone number
 * 2. Saves the incoming message in the messaging system
 * 3. Creates a notification for the provider
 * 4. Responds with TwiML (no auto-reply SMS to avoid extra charges)
 *
 * Twilio sends POST with: From, To, Body, MessageSid, etc.
 */
import { Request, Response } from "express";
import { normalizePhone } from "./sms";
import twilio from "twilio";
import { ENV } from "./_core/env";

/**
 * Validate that the request actually came from Twilio (signature verification).
 * In production, this prevents spoofed webhook calls.
 */
function validateTwilioRequest(req: Request): boolean {
  if (!ENV.twilioAuthToken) return false;

  // In development, skip validation
  if (!ENV.isProduction) return true;

  const signature = req.headers["x-twilio-signature"] as string;
  if (!signature) return false;

  // Build the full URL that Twilio used to call us
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["host"];
  const url = `${protocol}://${host}${req.originalUrl}`;

  return twilio.validateRequest(
    ENV.twilioAuthToken,
    signature,
    url,
    req.body
  );
}

/**
 * Express handler for POST /api/twilio/incoming-sms
 */
export async function incomingSmsHandler(req: Request, res: Response) {
  try {
    // Validate the request is from Twilio
    if (ENV.isProduction && !validateTwilioRequest(req)) {
      console.warn("[Twilio Webhook] Invalid signature — rejecting request");
      res.status(403).send("Forbidden");
      return;
    }

    const { From: fromPhone, Body: body, MessageSid: messageSid } = req.body;

    if (!fromPhone || !body) {
      console.warn("[Twilio Webhook] Missing From or Body in request");
      // Respond with empty TwiML (no reply SMS)
      res.type("text/xml").send("<Response></Response>");
      return;
    }

    console.log(`[Twilio Webhook] Incoming SMS from ${fromPhone}: "${body.substring(0, 50)}..." (sid: ${messageSid})`);

    // Normalize the incoming phone number
    const normalizedPhone = normalizePhone(fromPhone);
    if (!normalizedPhone) {
      console.warn("[Twilio Webhook] Could not normalize phone:", fromPhone);
      res.type("text/xml").send("<Response></Response>");
      return;
    }

    // Look up the patient by phone number
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) {
      console.error("[Twilio Webhook] Database not available");
      res.type("text/xml").send("<Response></Response>");
      return;
    }

    const { patients, users, messages } = await import("../drizzle/schema");
    const { eq, or, like } = await import("drizzle-orm");

    // Try to find patient by normalized phone or raw phone
    // Strip the +1 prefix for matching since patients might store phone in various formats
    const digits = normalizedPhone.replace(/^\+1/, "");
    const patientRows = await db
      .select()
      .from(patients)
      .where(
        or(
          eq(patients.phone, normalizedPhone),
          eq(patients.phone, fromPhone),
          eq(patients.phone, digits),
          like(patients.phone, `%${digits}`)
        )
      )
      .limit(1);

    if (patientRows.length === 0) {
      console.warn(`[Twilio Webhook] No patient found for phone: ${fromPhone} (normalized: ${normalizedPhone})`);
      // Respond with a helpful message
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Black Label Medicine: We couldn't match your number to a patient record. Please log in at https://www.blacklabelmedicine.com to send messages.");
      res.type("text/xml").send(twiml.toString());
      return;
    }

    const patient = patientRows[0];
    console.log(`[Twilio Webhook] Matched patient: ${patient.firstName} ${patient.lastName} (id: ${patient.id})`);

    // Handle STOP / START / HELP keywords (TCPA compliance)
    const keyword = body.trim().toUpperCase();
    if (keyword === "STOP" || keyword === "UNSUBSCRIBE" || keyword === "CANCEL" || keyword === "QUIT") {
      await db
        .update(patients)
        .set({ smsOptIn: false, smsOptInAt: new Date() })
        .where(eq(patients.id, patient.id));
      console.log(`[Twilio Webhook] Patient ${patient.id} opted out of SMS`);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Black Label Medicine: You have been unsubscribed from SMS notifications. Reply START to re-subscribe.");
      res.type("text/xml").send(twiml.toString());
      return;
    }
    if (keyword === "START" || keyword === "SUBSCRIBE" || keyword === "YES") {
      await db
        .update(patients)
        .set({ smsOptIn: true, smsOptInAt: new Date() })
        .where(eq(patients.id, patient.id));
      console.log(`[Twilio Webhook] Patient ${patient.id} opted back in to SMS`);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Black Label Medicine: You have been re-subscribed to SMS notifications. Reply STOP to unsubscribe. Msg & data rates may apply.");
      res.type("text/xml").send(twiml.toString());
      return;
    }
    if (keyword === "HELP" || keyword === "INFO") {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Black Label Medicine: For help, visit https://app.blacklabelmedicine.com or call your provider. Reply STOP to unsubscribe from SMS.");
      res.type("text/xml").send(twiml.toString());
      return;
    }

    // Determine the sender user ID (patient's linked user account)
    // and the receiver (the provider)
    const senderId = patient.userId;
    const receiverId = patient.providerId;

    if (!senderId) {
      console.warn(`[Twilio Webhook] Patient ${patient.id} has no linked user account — saving message with providerId as sender placeholder`);
      // Still save the message but note it came via SMS
      // Use providerId as a fallback senderId and mark it as system message
      await db.insert(messages).values({
        senderId: receiverId, // Will show as system/provider message
        receiverId: receiverId,
        patientId: patient.id,
        content: `[SMS from ${patient.firstName}]: ${body}`,
        messageType: "system",
        isRead: false,
      });
    } else {
      // Save as a normal message from the patient
      await db.insert(messages).values({
        senderId: senderId,
        receiverId: receiverId,
        patientId: patient.id,
        content: body,
        messageType: "text",
        isRead: false,
      });
    }

    // Create a notification for the provider
    try {
      const { createNotification } = await import("./db");
      // Find the provider's user record
      const providerUser = await db
        .select()
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1);

      if (providerUser.length > 0) {
        await createNotification({
          userId: providerUser[0].id,
          type: "message",
          title: `SMS reply from ${patient.firstName} ${patient.lastName}`,
          body: body.length > 100 ? body.substring(0, 100) + "…" : body,
          relatedEntityType: "message",
          relatedEntityId: patient.id,
        });
      }
    } catch (notifErr) {
      console.error("[Twilio Webhook] Failed to create notification:", notifErr);
      // Non-fatal — message was still saved
    }

    console.log(`[Twilio Webhook] Message saved for patient ${patient.id}`);

    // Respond with empty TwiML — no auto-reply SMS
    // The provider will see the message in the dashboard and can reply from there
    res.type("text/xml").send("<Response></Response>");
  } catch (err) {
    console.error("[Twilio Webhook] Error processing incoming SMS:", err);
    // Always respond with valid TwiML to avoid Twilio retries
    res.type("text/xml").send("<Response></Response>");
  }
}
