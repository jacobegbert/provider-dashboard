import type { Patient, User } from "../../drizzle/schema";

export type ItemKind = "medication" | "peptide" | "regenerative" | "note";
export type ItemPhase = "draft" | "published";
export type ItemStatus = "active" | "paused" | "clinic_managed" | "completed";

export type PlanItem = {
  id: number;
  planId: number;
  patientId: number;
  phase: ItemPhase;
  sourceItemId: number | null;
  kind: ItemKind;
  name: string;
  dose: string | null;
  unit: string | null;
  route: string | null;
  frequency: string | null;
  instructions: string | null;
  status: ItemStatus;
  isSampleTemplate: boolean;
  sortOrder: number;
};

export type NewPlanItem = Omit<PlanItem, "id">;

export type CarePlan = {
  id: number;
  patientId: number;
  providerId: number;
  summary: string;
  publishedSummary: string;
  version: number;
  publishedAt: Date | null;
};

export type LabResult = {
  id: number;
  patientId: number;
  name: string;
  value: string;
  unit: string;
  referenceLow: string | null;
  referenceHigh: string | null;
  collectedOn: string;
  note: string | null;
};

export type ThreadMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  patientId: number;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

export type IntakeRecord = {
  patientId: number;
  status: "not_started" | "in_progress" | "completed";
  goals: string;
  currentMedications: string;
  conditions: string;
  reviewedByProvider: boolean;
  providerNotes: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
};

export type PharmacyStatus = "queued" | "accepted" | "filled" | "cancelled" | "failed";
export type PharmacyChangeType = "new" | "change" | "discontinue";

export type PharmacyOrder = {
  id: number;
  patientId: number;
  planItemId: number | null;
  adapterId: string;
  externalId: string | null;
  changeType: PharmacyChangeType;
  drugName: string;
  details: string;
  status: PharmacyStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type GuidanceStatus = "pending" | "approved" | "dismissed";

export type GuidanceDraft = {
  id: number;
  patientId: number;
  modelId: string;
  title: string;
  body: string;
  status: GuidanceStatus;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type AuditEntry = {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
};

export type NewPatient = {
  userId: number | null;
  providerId: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  status?: Patient["status"];
  healthGoals?: string[];
  conditions?: string[];
  notes?: string | null;
};

export interface PortalStore {
  readonly mode: "memory" | "mysql";
  getUserByOpenId(openId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  upsertUser(input: {
    openId: string;
    name?: string | null;
    email?: string | null;
    passwordHash?: string | null;
    loginMethod?: string | null;
    role?: User["role"];
    lastSignedIn?: Date;
  }): Promise<void>;
  listPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  insertPatient(input: NewPatient): Promise<Patient>;
  getPlan(patientId: number): Promise<CarePlan | undefined>;
  insertPlan(input: Omit<CarePlan, "id">): Promise<CarePlan>;
  updatePlan(patientId: number, patch: Partial<Pick<CarePlan, "summary" | "publishedSummary" | "version" | "publishedAt" | "providerId">>): Promise<CarePlan>;
  listItems(patientId: number, phase?: ItemPhase): Promise<PlanItem[]>;
  getItem(id: number): Promise<PlanItem | undefined>;
  insertItem(input: NewPlanItem): Promise<PlanItem>;
  updateItem(id: number, patch: Partial<Omit<PlanItem, "id" | "planId" | "patientId" | "phase" | "sourceItemId">>): Promise<PlanItem>;
  deleteItem(id: number): Promise<void>;
  deletePublished(patientId: number): Promise<void>;
  listLabs(patientId: number): Promise<LabResult[]>;
  insertLab(input: Omit<LabResult, "id">): Promise<LabResult>;
  listMessages(patientId: number): Promise<ThreadMessage[]>;
  insertMessage(input: Omit<ThreadMessage, "id" | "isRead" | "createdAt"> & { isRead?: boolean; createdAt?: Date }): Promise<ThreadMessage>;
  markIncomingRead(patientId: number, viewerId: number): Promise<void>;
  getIntake(patientId: number): Promise<IntakeRecord | undefined>;
  saveIntake(record: IntakeRecord): Promise<IntakeRecord>;
  listOrders(patientId?: number): Promise<PharmacyOrder[]>;
  getOrder(id: number): Promise<PharmacyOrder | undefined>;
  insertOrder(input: Omit<PharmacyOrder, "id" | "createdAt" | "updatedAt"> & { createdAt?: Date }): Promise<PharmacyOrder>;
  updateOrderStatus(id: number, status: PharmacyStatus): Promise<PharmacyOrder>;
  listGuidance(patientId: number): Promise<GuidanceDraft[]>;
  getGuidance(id: number): Promise<GuidanceDraft | undefined>;
  insertGuidance(input: Omit<GuidanceDraft, "id" | "status" | "reviewedBy" | "reviewedAt" | "createdAt"> & { status?: GuidanceStatus }): Promise<GuidanceDraft>;
  updateGuidance(id: number, patch: Partial<Pick<GuidanceDraft, "status" | "reviewedBy" | "reviewedAt">>): Promise<GuidanceDraft>;
  logAudit(entry: { userId: number; action: string; entityType: string; entityId?: number | null; details?: Record<string, unknown> }): Promise<void>;
  listAudit(patientId: number, limit: number): Promise<AuditEntry[]>;
}
