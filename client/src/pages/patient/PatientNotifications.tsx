/**
 * PatientNotifications — Notification center for patient portal
 * Shows all notifications with filtering, mark-read, and deep-link navigation.
 * Design: Warm Scandinavian — sage green, terracotta, stone palette
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trophy,
  Info,
  Check,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string; label: string }
> = {
  message: { icon: MessageSquare, color: "text-gold", bg: "bg-gold/10", label: "Message" },
  task_overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Overdue" },
  task_reminder: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Reminder" },
  appointment_reminder: { icon: Calendar, color: "text-gold", bg: "bg-gold/10", label: "Appointment" },
  compliance_alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Alert" },
  milestone_reached: { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50", label: "Milestone" },
  protocol_assigned: { icon: ClipboardList, color: "text-gold", bg: "bg-gold/10", label: "Protocol" },
  system: { icon: Info, color: "text-muted-foreground", bg: "bg-muted", label: "System" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/** Resolve patient-side navigation URL for a notification */
function resolvePatientUrl(notif: any): string | null {
  const { relatedEntityType, type } = notif;
  if (relatedEntityType === "message" || type === "message") return "/patient/messages";
  if (relatedEntityType === "appointment" || type === "appointment_reminder") return "/patient/schedule";
  if (relatedEntityType === "assignment" || type === "protocol_assigned") return "/patient/protocols";
  if (relatedEntityType === "clientTask" || type === "task_reminder" || type === "task_overdue") return "/patient/protocols";
  return null;
}

const PAGE_SIZE = 15;

function NotificationCard({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: any;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [, navigate] = useLocation();
  const config = getTypeConfig(notif.type);
  const Icon = config.icon;
  const targetUrl = resolvePatientUrl(notif);

  const handleClick = () => {
    if (targetUrl) {
      if (!notif.isRead) onMarkRead(notif.id);
      navigate(targetUrl);
    }
  };

  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-150 group ${
        !notif.isRead
          ? "border-gold/20 bg-gold/[0.03]"
          : "border-border bg-card"
      } ${targetUrl ? "cursor-pointer hover:shadow-sm" : ""}`}
      onClick={handleClick}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
        <Icon className={`h-[18px] w-[18px] ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-sm leading-tight ${!notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                {notif.title}
              </p>
              {!notif.isRead && <span className="h-2 w-2 rounded-full bg-gold shrink-0" />}
            </div>
            {notif.body && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {notif.body}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="h-5 text-[10px] font-medium px-1.5 border-border/50">
                {config.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground/70">{formatDate(notif.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notif.isRead && (
              <button
                className="p-1.5 rounded-md hover:bg-gold/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                title="Mark as read"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
              </button>
            )}
            <button
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientNotifications() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const utils = trpc.useUtils();

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const queryInput = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...(unreadOnly ? { unreadOnly: true } : {}),
    }),
    [unreadOnly, page]
  );

  const { data, isLoading } = trpc.notification.listPaginated.useQuery(queryInput);
  const { data: unreadCount = 0 } = trpc.notification.unreadCount.useQuery();

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.invalidate(),
  });

  const markAllReadMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
      toast.success("Notification removed");
    },
  });

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="px-5 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/patient/profile")}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/10"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Browser notification banner */}
      {notifPermission === "default" && (
        <div className="bg-gold/5 border border-gold/15 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified about new messages, appointments, and protocol updates even when you're not looking at this page.
            </p>
            <button
              onClick={requestNotifPermission}
              className="mt-2 px-3 py-1.5 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold-light transition-colors"
            >
              Enable Notifications
            </button>
          </div>
        </div>
      )}
      {notifPermission === "denied" && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Notifications Blocked</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browser notifications are blocked. To receive alerts, open your browser settings and allow notifications for this site.
            </p>
          </div>
        </div>
      )}
      {notifPermission === "granted" && (
        <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
          <p className="text-xs text-gold font-medium">Browser notifications are enabled. You'll be alerted about new messages and updates.</p>
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setUnreadOnly(false); setPage(0); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !unreadOnly ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setUnreadOnly(true); setPage(0); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            unreadOnly ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gold" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
            {unreadOnly ? "No Unread Notifications" : "No Notifications Yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {unreadOnly
              ? "You've read all your notifications. Nice work!"
              : "You'll receive notifications here for messages, appointments, protocol updates, and more."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onMarkRead={(id) => markReadMutation.mutate({ id })}
              onDelete={(id) => deleteMutation.mutate({ id })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
