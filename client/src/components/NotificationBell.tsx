/*
 * NotificationBell — Header bell icon with unread count badge
 * and dropdown popover showing recent notifications.
 * Clicking a notification navigates to the relevant page.
 * Polls unread count every 30 seconds for near-realtime updates.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getNotificationFallbackUrl } from "@/lib/notificationUrl";

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string }
> = {
  message: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
  task_overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  task_reminder: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  appointment_reminder: { icon: Calendar, color: "text-gold", bg: "bg-gold/10" },
  compliance_alert: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  subscription_expiring: { icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
  milestone_reached: { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
  system: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

function getTypeConfig(type: string) {
  return NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG.system;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

interface NotificationItemProps {
  notif: {
    id: number;
    type: string;
    title: string;
    body?: string | null;
    isRead: boolean;
    emailSent: boolean;
    createdAt: Date | string;
    relatedEntityType?: string | null;
    relatedEntityId?: number | null;
  };
  onMarkRead: (id: number, e: React.MouseEvent) => void;
  onNavigate: () => void;
}

function NotificationItem({ notif, onMarkRead, onNavigate }: NotificationItemProps) {
  const [, navigate] = useLocation();
  const config = getTypeConfig(notif.type);
  const Icon = config.icon;

  // Use tRPC to resolve the exact URL for this notification (handles message → patient lookup)
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
      onNavigate();
      navigate(targetUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50 ${
        !notif.isRead ? "bg-gold/5" : ""
      } ${targetUrl ? "cursor-pointer" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-tight ${
              !notif.isRead
                ? "font-semibold text-foreground"
                : "text-foreground/80"
            }`}
          >
            {notif.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {!notif.isRead && (
              <button
                onClick={(e) => onMarkRead(notif.id, e)}
                className="shrink-0 mt-0.5 text-muted-foreground hover:text-gold transition-colors"
                title="Mark as read"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
            {targetUrl && (
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5" />
            )}
          </div>
        </div>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notif.body}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/70">
            {formatTimeAgo(notif.createdAt)}
          </span>
          {notif.emailSent && (
            <span className="text-[10px] text-muted-foreground/50">
              · Email sent
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Poll unread count every 30 seconds
  const { data: unreadCount = 0 } = trpc.notification.unreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  // Fetch recent notifications when popover opens
  const { data: recentNotifications = [], isLoading } =
    trpc.notification.list.useQuery(undefined, {
      enabled: open,
    });

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const markAllReadMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.unreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const handleMarkRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 shadow-lg border-border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1.5 text-[10px] font-semibold bg-red-500/15 text-red-400 border-0"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gold hover:text-gold"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onMarkRead={handleMarkRead}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <Link href="/provider/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-gold hover:text-gold justify-center gap-1"
              onClick={() => setOpen(false)}
            >
              View all notifications
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
