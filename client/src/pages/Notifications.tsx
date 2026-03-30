/*
 * Notifications — Full notification center page
 * Shows all notifications with filtering, pagination, and bulk actions.
 * Clicking a notification navigates to the relevant page.
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
  CreditCard,
  Trophy,
  Info,
  Check,
  Trash2,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getNotificationFallbackUrl } from "@/lib/notificationUrl";

const NOTIFICATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "message", label: "Messages" },
  { value: "task_overdue", label: "Overdue Tasks" },
  { value: "task_reminder", label: "Task Reminders" },
  { value: "appointment_reminder", label: "Appointments" },
  { value: "compliance_alert", label: "Compliance Alerts" },
  { value: "subscription_expiring", label: "Subscriptions" },
  { value: "milestone_reached", label: "Milestones" },
  { value: "system", label: "System" },
] as const;

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string; label: string }
> = {
  message: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10", label: "Message" },
  task_overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Overdue" },
  task_reminder: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Reminder" },
  appointment_reminder: { icon: Calendar, color: "text-gold", bg: "bg-gold/10", label: "Appointment" },
  compliance_alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Compliance" },
  subscription_expiring: { icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50", label: "Subscription" },
  milestone_reached: { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50", label: "Milestone" },
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
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

const PAGE_SIZE = 15;

/** Individual notification card with click-to-navigate */
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

  // Resolve the deep-link URL via tRPC
  const { data: resolvedUrl } = trpc.notification.resolveUrl.useQuery(
    {
      relatedEntityType: notif.relatedEntityType ?? null,
      relatedEntityId: notif.relatedEntityId ?? null,
      type: notif.type,
    },
    { staleTime: 60000 }
  );

  const targetUrl = resolvedUrl ?? getNotificationFallbackUrl(
    notif.type,
    notif.relatedEntityType,
    notif.relatedEntityId
  );

  const handleClick = () => {
    if (targetUrl) {
      // Auto-mark as read when navigating
      if (!notif.isRead) {
        onMarkRead(notif.id);
      }
      navigate(targetUrl);
    }
  };

  return (
    <Card
      className={`group transition-all duration-150 hover:shadow-sm ${
        !notif.isRead
          ? "border-gold/20 bg-gold/[0.03]"
          : "border-border"
      } ${targetUrl ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      <CardContent className="flex items-start gap-3.5 p-4">
        {/* Type icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
        >
          <Icon className={`h-[18px] w-[18px] ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p
                  className={`text-sm leading-tight ${
                    !notif.isRead
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/80"
                  }`}
                >
                  {notif.title}
                </p>
                {!notif.isRead && (
                  <span className="h-2 w-2 rounded-full bg-gold shrink-0" />
                )}
              </div>
              {notif.body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.body}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] font-medium px-1.5 border-border/50"
                >
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground/70">
                  {formatDate(notif.createdAt)}
                </span>
                {notif.emailSent && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
                    <Mail className="h-2.5 w-2.5" />
                    Email sent
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {targetUrl && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-gold transition-colors" />
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(notif.id);
                    }}
                    title="Mark as read"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notif.id);
                  }}
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Notifications() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const queryInput = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...(typeFilter !== "all" ? { type: typeFilter as any } : {}),
      ...(unreadOnly ? { unreadOnly: true } : {}),
    }),
    [typeFilter, unreadOnly, page]
  );

  const { data, isLoading } = trpc.notification.listPaginated.useQuery(queryInput);
  const { data: unreadCount = 0 } = trpc.notification.unreadCount.useQuery();

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
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
      toast.success("Notification deleted");
    },
  });

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(0);
  };

  const toggleUnreadOnly = () => {
    setUnreadOnly(!unreadOnly);
    setPage(0);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
              className="h-8 text-xs gap-1.5"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          className={`h-8 text-xs gap-1.5 ${
            unreadOnly ? "bg-gold hover:bg-gold-light text-black" : ""
          }`}
          onClick={toggleUnreadOnly}
        >
          <Bell className="h-3.5 w-3.5" />
          Unread only
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          {total} notification{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No notifications
            </p>
            <p className="text-xs text-muted-foreground">
              {unreadOnly
                ? "No unread notifications. Try removing the filter."
                : typeFilter !== "all"
                ? "No notifications of this type."
                : "Notifications will appear here when events occur."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notif) => (
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
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
