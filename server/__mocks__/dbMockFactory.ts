/**
 * Shared db mock factory — covers every export from server/db.ts
 * Usage in test files:
 *   import { createDbMock } from "./__mocks__/dbMockFactory";
 *   vi.mock("./db", () => createDbMock());
 *
 * Override specific functions by spreading:
 *   vi.mock("./db", () => ({
 *     ...createDbMock(),
 *     listPatients: vi.fn(async () => [myCustomPatient]),
 *   }));
 */
import { vi } from "vitest";

export function createDbMock(overrides: Record<string, any> = {}) {
  const base: Record<string, any> = {
    // Core
    getDb: vi.fn().mockResolvedValue({}),

    // Users
    upsertUser: vi.fn(async (data: any) => ({ id: 1, ...data })),
    getUserByOpenId: vi.fn(async () => ({ id: 1, openId: "owner-open-id", name: "Test Owner", email: "owner@test.com", role: "admin" })),
    getUserById: vi.fn(async () => null),

    // Patients
    getPatientByUserId: vi.fn(async () => null),
    getPatientByEmail: vi.fn(async () => null),
    getPatientByName: vi.fn(async () => null),
    linkPatientToUser: vi.fn(async () => {}),
    listPatients: vi.fn(async () => []),
    getPatient: vi.fn(async () => null),
    createPatient: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date(), updatedAt: new Date() })),
    updatePatient: vi.fn(async () => {}),
    deletePatient: vi.fn(async () => {}),
    restorePatient: vi.fn(async () => {}),
    permanentlyDeletePatient: vi.fn(async () => {}),
    listDeletedPatients: vi.fn(async () => []),

    // Protocols
    listProtocols: vi.fn(async () => []),
    listAllProtocols: vi.fn(async () => []),
    getProtocol: vi.fn(async () => null),
    createProtocol: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date(), updatedAt: new Date() })),
    updateProtocol: vi.fn(async () => {}),

    // Protocol Steps
    listProtocolSteps: vi.fn(async () => []),
    createProtocolStep: vi.fn(async (data: any) => ({ id: 1, ...data })),
    updateProtocolStep: vi.fn(async () => {}),
    deleteProtocolStep: vi.fn(async () => {}),

    // Assignments
    listAssignmentsForPatient: vi.fn(async () => []),
    listActiveAssignmentsForProvider: vi.fn(async () => []),
    listAssignmentsForProtocol: vi.fn(async () => []),
    getAssignment: vi.fn(async () => null),
    createAssignment: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    updateAssignment: vi.fn(async () => {}),
    deleteAssignment: vi.fn(async () => {}),

    // Assignment Steps
    listAssignmentSteps: vi.fn(async () => []),
    createAssignmentStep: vi.fn(async (data: any) => ({ id: 1, ...data })),
    updateAssignmentStep: vi.fn(async () => {}),
    deleteAssignmentStep: vi.fn(async () => {}),
    deleteAssignmentStepsByAssignment: vi.fn(async () => {}),
    duplicateStepsToAssignment: vi.fn(async () => []),

    // Task Completions
    listCompletionsForAssignment: vi.fn(async () => []),
    createTaskCompletion: vi.fn(async (data: any) => ({ id: 1, ...data })),
    deleteTaskCompletion: vi.fn(async () => {}),
    bulkCreateTaskCompletions: vi.fn(async () => []),
    listCompletionsByDateRange: vi.fn(async () => []),

    // Messages
    listConversationsForProvider: vi.fn(async () => []),
    listMessagesForPatient: vi.fn(async () => []),
    createMessage: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    getMessage: vi.fn(async () => null),
    deleteMessageContent: vi.fn(async () => {}),
    markMessagesRead: vi.fn(async () => {}),

    // Appointments
    listAppointmentsForProvider: vi.fn(async () => []),
    listAppointmentsForPatient: vi.fn(async () => []),
    createAppointment: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    updateAppointment: vi.fn(async () => {}),
    getAppointmentById: vi.fn(async () => null),

    // Notifications
    listNotificationsForUser: vi.fn(async () => []),
    createNotification: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    markNotificationRead: vi.fn(async () => {}),
    getUnreadNotificationCount: vi.fn(async () => 0),
    markAllNotificationsRead: vi.fn(async () => {}),
    deleteNotification: vi.fn(async () => {}),
    listNotificationsForUserPaginated: vi.fn(async () => ({ items: [], total: 0 })),
    createNotificationWithEmail: vi.fn(async (data: any) => ({ id: 1, ...data })),

    // Documents
    listDocumentsForPatient: vi.fn(async () => []),
    createDocument: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    deleteDocument: vi.fn(async () => {}),
    getDocument: vi.fn(async () => null),

    // Client Notes
    listNotesForPatient: vi.fn(async () => []),
    createClientNote: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    updateClientNote: vi.fn(async () => {}),
    deleteClientNote: vi.fn(async () => {}),

    // Client Tasks
    listTasksForPatient: vi.fn(async () => []),
    createClientTask: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    updateClientTask: vi.fn(async () => {}),
    deleteClientTask: vi.fn(async () => {}),

    // Push Subscriptions
    savePushSubscription: vi.fn(async () => {}),
    getPushSubscriptionsForUser: vi.fn(async () => []),

    // Audit
    logAudit: vi.fn(async () => ({})),

    // Attention Queue
    getAttentionQueue: vi.fn(async () => ({ overduePatients: [], lowCompliance: [], unreadMessages: [], upcomingAppointments: [], newPatients: [] })),
    getProviderStats: vi.fn(async () => ({
      totalPatients: 0,
      activePatients: 0,
      totalProtocols: 0,
      activeAssignments: 0,
      avgCompliance: 0,
      totalUnread: 0,
      upcomingAppointments: 0,
    })),
    dismissAttentionItem: vi.fn(async () => {}),
    getDismissedAttentionItems: vi.fn(async () => []),
    restoreAttentionItem: vi.fn(async () => {}),
    restoreAllAttentionItems: vi.fn(async () => {}),

    // Provider Profile
    getProviderProfile: vi.fn(async () => ({ practiceName: "Test Practice" })),
    upsertProviderProfile: vi.fn(async (data: any) => ({ id: 1, ...data })),

    // Invites
    createInvite: vi.fn(async (data: any) => ({ id: 1, ...data })),
    getInviteByToken: vi.fn(async () => null),
    getActiveInviteForPatient: vi.fn(async () => null),
    markInviteUsed: vi.fn(async () => {}),
    listInvitesForPatient: vi.fn(async () => []),

    // Biomarkers
    createBiomarkerEntry: vi.fn(async (data: any) => ({ id: 1, ...data })),
    listBiomarkerEntries: vi.fn(async () => []),
    updateBiomarkerEntry: vi.fn(async () => {}),
    deleteBiomarkerEntry: vi.fn(async () => {}),
    createCustomMetric: vi.fn(async (data: any) => ({ id: 1, ...data })),
    listCustomMetrics: vi.fn(async () => []),
    deleteCustomMetric: vi.fn(async () => {}),

    // Resources
    createResource: vi.fn(async (data: any) => ({ id: 1, ...data })),
    updateResource: vi.fn(async () => {}),
    deleteResource: vi.fn(async () => {}),
    getResourceById: vi.fn(async () => null),
    listResources: vi.fn(async () => []),
    archiveResource: vi.fn(async () => {}),
    shareResource: vi.fn(async (data: any) => ({ id: 1, ...data })),
    unshareResource: vi.fn(async () => {}),
    listSharesForResource: vi.fn(async () => []),
    listResourcesForPatient: vi.fn(async () => []),
    markResourceViewed: vi.fn(async () => {}),

    // Staff Invites
    promoteToStaff: vi.fn(async () => {}),
    createStaffInvite: vi.fn(async (data: any) => ({ id: 1, ...data, token: "test-token", createdAt: new Date() })),
    getStaffInviteByToken: vi.fn(async () => null),
    listStaffInvites: vi.fn(async () => []),
    revokeStaffInvite: vi.fn(async () => {}),
    markStaffInviteUsed: vi.fn(async () => {}),
    listStaffMembers: vi.fn(async () => []),
    removeStaffMember: vi.fn(async () => {}),

    // Patient-Created Protocols
    listPatientCreatedProtocols: vi.fn(async () => []),
    listAllPatientCreatedProtocols: vi.fn(async () => []),
  };

  return { ...base, ...overrides };
}
