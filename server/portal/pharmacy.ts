import type { PharmacyChangeType } from "./types";

/**
 * Pharmacy adapter boundary.
 *
 * This repo ships the mock adapter only. A future dispensing integration
 * should implement PharmacyAdapter in a new module and be selected from
 * PHARMACY_ADAPTER. It should:
 * - read credentials from the environment at runtime, never from the repo
 * - accept PharmacySubmitRequest and return a durable external id
 * - treat localId as an idempotency key
 * - map remote states onto queued | accepted | filled | cancelled | failed
 * - be invoked only from the clinic publish path, never from a patient route
 * - avoid logging patient free text
 *
 * Do not add a live NCPDP, Surescripts, or pharmacy HTTP client here.
 */
export type PharmacySubmitRequest = {
  localId: string;
  patientId: number;
  changeType: PharmacyChangeType;
  drugName: string;
  details: string;
};

export type PharmacySubmitResult = {
  externalId: string;
  status: "queued" | "accepted";
};

export interface PharmacyAdapter {
  readonly id: string;
  readonly displayName: string;
  submit(request: PharmacySubmitRequest): Promise<PharmacySubmitResult>;
}

export function createMockPharmacyAdapter(): PharmacyAdapter {
  return {
    id: "mock",
    displayName: "Mock pharmacy",
    async submit(request) {
      return {
        externalId: `mock-${request.localId}`,
        status: "accepted",
      };
    },
  };
}

export function createPharmacyAdapter(): PharmacyAdapter {
  const which = process.env.PHARMACY_ADAPTER ?? "mock";
  if (which !== "mock") {
    console.warn(
      `[pharmacy] PHARMACY_ADAPTER=${which} is not implemented. Using the mock adapter. No order is transmitted.`,
    );
  }
  return createMockPharmacyAdapter();
}
