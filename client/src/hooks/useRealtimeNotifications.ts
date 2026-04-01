/**
 * useRealtimeNotifications — Client-side SSE hook for real-time push notifications.
 *
 * Connects to /api/sse/notifications, listens for "notification" events,
 * shows a Sonner toast, and optionally requests browser Notification permission.
 *
 * Automatically reconnects on disconnect with exponential back-off.
 */
import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SSENotification {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt: string;
}

/**
 * Resolve a client-side navigation path for a notification.
 * This is a lightweight mirror of the server-side resolveUrl logic
 * so we can navigate immediately without an extra round-trip.
 */
/**
 * Resolve a client-side navigation path for a notification.
 * Context-aware: uses current path to determine if user is on patient or provider portal.
 */
function resolveClientUrl(n: SSENotification): string | null {
  const { relatedEntityType, type } = n;
  const isPatient = window.location.pathname.startsWith("/patient");

  if (relatedEntityType === "appointment") return isPatient ? "/patient/schedule" : "/provider/schedule";
  if (relatedEntityType === "assignment" || relatedEntityType === "clientTask") return "/patient/protocols";
  if (relatedEntityType === "message" || type === "message") return isPatient ? "/patient/messages" : "/provider/messages";
  if (type === "appointment_reminder") return isPatient ? "/patient/schedule" : "/provider/schedule";
  if (type === "task_reminder" || type === "task_overdue") return isPatient ? "/patient/protocols" : "/provider/clients";
  if (type === "compliance_alert") return "/provider/attention";
  if (type === "protocol_assigned") return "/patient/protocols";
  return null;
}

export function useRealtimeNotifications(enabled: boolean = true) {
  const utils = trpc.useUtils();
  const retryDelay = useRef(1000);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;
  const esRef = useRef<EventSource | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [enabled]);

  const handleNotification = useCallback(
    (event: MessageEvent) => {
      try {
        const data: SSENotification = JSON.parse(event.data);

        // Show Sonner toast
        const url = resolveClientUrl(data);
        toast(data.title, {
          description: data.body || undefined,
          duration: 6000,
          action: url
            ? {
                label: "View",
                onClick: () => {
                  window.location.hash = ""; // clear any hash
                  window.location.href = url;
                },
              }
            : undefined,
        });

        // Show browser notification if permitted and tab is not focused
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          document.hidden
        ) {
          try {
            const n = new Notification(data.title, {
              body: data.body || undefined,
              icon: "/favicon.ico",
              tag: `notif-${data.id}`,
            });
            if (url) {
              n.onclick = () => {
                window.focus();
                window.location.href = url;
              };
            }
          } catch {
            // Browser notifications may fail in some environments
          }
        }

        // Invalidate notification queries so badge counts update
        utils.notification.list.invalidate();
        utils.notification.unreadCount.invalidate();
      } catch (e) {
        console.warn("[SSE] Failed to parse notification event:", e);
      }
    },
    [utils]
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;

      const es = new EventSource("/api/sse/notifications", {
        withCredentials: true,
      });
      esRef.current = es;

      es.addEventListener("connected", () => {
        // Reset retry delay and count on successful connection
        retryDelay.current = 1000;
        retryCount.current = 0;
      });

      es.addEventListener("notification", handleNotification);

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!cancelled && retryCount.current < MAX_RETRIES) {
          // Exponential back-off: 1s, 2s, 4s, 8s, max 30s — capped at MAX_RETRIES
          retryCount.current += 1;
          reconnectTimer = setTimeout(() => {
            retryDelay.current = Math.min(retryDelay.current * 2, 30000);
            connect();
          }, retryDelay.current);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled, handleNotification]);
}
