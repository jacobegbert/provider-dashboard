/**
 * Resolve a notification to a navigation URL based on its type and related entity.
 * Returns a client-side URL path or null if no deep link is available.
 * 
 * For "message" type notifications, we need a server round-trip to resolve the patientId,
 * so this function returns a fallback and the component should use the tRPC resolveUrl query.
 */

export function getNotificationFallbackUrl(
  type: string,
  relatedEntityType?: string | null,
  relatedEntityId?: number | null
): string | null {
  // Direct mapping for entity types that don't need a DB lookup
  if (relatedEntityType === "appointment") return "/provider/schedule";
  if (relatedEntityType === "assignment") return "/patient/protocols";
  if (relatedEntityType === "clientTask") return "/patient/protocols";

  // Fallback based on notification type
  switch (type) {
    case "message":
      return "/provider/messages";
    case "appointment_reminder":
      return "/provider/schedule";
    case "task_overdue":
    case "task_reminder":
      return "/provider/clients";
    case "compliance_alert":
      return "/provider/attention";
    default:
      return null;
  }
}
