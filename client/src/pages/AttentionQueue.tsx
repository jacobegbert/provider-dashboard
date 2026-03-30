/**
 * Attention Queue — Provider's prioritized action list
 * Supports persistent dismiss/resolve actions (stored in DB, expire after 7 days)
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Undo2,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type PriorityLevel = "critical" | "high" | "medium" | "low";
type Category = "overdue" | "message" | "appointment" | "new";

interface AttentionItem {
  id: string;
  patientName: string;
  initials: string;
  patientId: number;
  priority: PriorityLevel;
  reason: string;
  detail: string;
  category: Category;
  timeInfo: string;
  actionLabel: string;
  actionHref: string;
}

const priorityConfig: Record<PriorityLevel, { color: string; bg: string; label: string }> = {
  critical: { color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Critical" },
  high: { color: "text-red-400", bg: "bg-red-500/5 border-red-500/20", label: "High" },
  medium: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Medium" },
  low: { color: "text-primary", bg: "bg-primary/10 border-primary/20", label: "Low" },
};

const categoryIcons: Record<Category, typeof AlertTriangle> = {
  overdue: Clock,
  message: MessageSquare,
  appointment: Clock,
  new: Zap,
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function timeAgo(dateInput: string | Date): string {
  const ms = Date.now() - new Date(dateInput).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateInput).toLocaleDateString();
}

const avatarColors = [
  "bg-gold/15 text-gold",
  "bg-red-500/10 text-red-400",
  "bg-primary/15 text-primary",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
];

function getAvatarColor(id: number) {
  return avatarColors[id % avatarColors.length];
}

// ─── ITEM CARD ───────────────────────────────

function AttentionItemCard({
  item,
  onDismiss,
  onResolve,
}: {
  item: AttentionItem;
  onDismiss: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const config = priorityConfig[item.priority];
  const Icon = categoryIcons[item.category];

  return (
    <Card className={`border ${config.bg} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shrink-0 ${getAvatarColor(item.patientId)}`}>
            {item.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-semibold text-sm text-foreground">{item.patientName}</h3>
              <Badge variant="outline" className={`text-[10px] ${config.color} border-current/20`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80 mt-1">{item.reason}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">{item.timeInfo}</span>
            <Link href={item.actionHref}>
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                {item.actionLabel} <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Resolve / Dismiss buttons */}
        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1 text-gold hover:text-gold"
            onClick={(e) => { e.stopPropagation(); onResolve(item.id); }}
            title="Mark as resolved"
          >
            <Check className="h-3 w-3" /> Resolve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
            title="Dismiss this item"
          >
            <XCircle className="h-3 w-3" /> Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DISMISSED ITEM CARD ─────────────────────

function DismissedItemCard({
  item,
  action,
  onRestore,
}: {
  item: AttentionItem;
  action: "dismissed" | "resolved";
  onRestore: (id: string) => void;
}) {
  return (
    <Card className="border border-border/40 bg-muted/30 opacity-60 hover:opacity-80 transition-opacity">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-heading shrink-0 ${getAvatarColor(item.patientId)}`}>
            {item.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-xs text-foreground">{item.patientName}</h3>
            <p className="text-xs text-muted-foreground truncate">{item.reason}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${action === "resolved" ? "text-gold border-gold/20" : "text-muted-foreground"}`}>
            {action === "resolved" ? "Resolved" : "Dismissed"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1 shrink-0"
            onClick={() => onRestore(item.id)}
          >
            <Undo2 className="h-3 w-3" /> Restore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT ──────────────────────────

export default function AttentionQueue() {
  const [activeTab, setActiveTab] = useState("all");
  const [showDismissed, setShowDismissed] = useState(false);

  const attentionQuery = trpc.attention.queue.useQuery();
  const statsQuery = trpc.attention.stats.useQuery();
  const dismissedQuery = trpc.attention.dismissedItems.useQuery();

  const dismissMutation = trpc.attention.dismiss.useMutation({
    onSuccess: () => {
      dismissedQuery.refetch();
      toast.info("Item dismissed from queue");
    },
  });
  const resolveMutation = trpc.attention.resolve.useMutation({
    onSuccess: () => {
      dismissedQuery.refetch();
      toast.success("Item marked as resolved");
    },
  });
  const restoreMutation = trpc.attention.restore.useMutation({
    onSuccess: () => {
      dismissedQuery.refetch();
      toast.info("Item restored to queue");
    },
  });
  const restoreAllMutation = trpc.attention.restoreAll.useMutation({
    onSuccess: () => {
      dismissedQuery.refetch();
      setShowDismissed(false);
      toast.info("All items restored");
    },
  });

  const queueData = attentionQuery.data;
  const stats = statsQuery.data;
  const dismissedItems = dismissedQuery.data || [];
  const isLoading = attentionQuery.isLoading || statsQuery.isLoading;

  // Build a set of dismissed item keys
  const dismissedKeySet = useMemo(() => {
    return new Set(dismissedItems.map((d) => d.itemKey));
  }, [dismissedItems]);

  // Map of itemKey -> action for dismissed items
  const dismissedActionMap = useMemo(() => {
    const map = new Map<string, "dismissed" | "resolved">();
    for (const d of dismissedItems) {
      map.set(d.itemKey, d.action);
    }
    return map;
  }, [dismissedItems]);

  const handleDismiss = (id: string) => {
    dismissMutation.mutate({ itemKey: id });
  };

  const handleResolve = (id: string) => {
    resolveMutation.mutate({ itemKey: id });
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate({ itemKey: id });
  };

  // Build attention items from real data
  const attentionItems: AttentionItem[] = useMemo(() => {
    if (!queueData) return [];
    const items: AttentionItem[] = [];

    // Overdue patients (no recent interaction)
    for (const patient of queueData.overduePatients) {
      items.push({
        id: `overdue-${patient.id}`,
        patientName: `${patient.firstName} ${patient.lastName}`,
        initials: getInitials(patient.firstName, patient.lastName),
        patientId: patient.id,
        priority: "high",
        reason: "No recent interaction — needs follow-up",
        detail: `Last interaction: ${patient.lastProviderInteraction ? timeAgo(patient.lastProviderInteraction) : "never"} · Status: ${patient.status} · ${patient.subscriptionTier || "standard"} tier`,
        category: "overdue",
        timeInfo: patient.lastProviderInteraction ? timeAgo(patient.lastProviderInteraction) : "Never",
        actionLabel: "Review",
        actionHref: `/provider/clients?selected=${patient.id}`,
      });
    }

    // Unread messages
    for (const conv of queueData.unreadMessages) {
      items.push({
        id: `msg-${conv.patient.id}`,
        patientName: `${conv.patient.firstName} ${conv.patient.lastName}`,
        initials: getInitials(conv.patient.firstName, conv.patient.lastName),
        patientId: conv.patient.id,
        priority: conv.unreadCount >= 3 ? "high" : "medium",
        reason: `${conv.unreadCount} unread message${conv.unreadCount > 1 ? "s" : ""}`,
        detail: conv.lastMessage.content.substring(0, 150),
        category: "message",
        timeInfo: timeAgo(conv.lastMessage.createdAt),
        actionLabel: "Reply",
        actionHref: `/provider/messages?patient=${conv.patient.id}`,
      });
    }

    // New patients
    for (const patient of queueData.newPatients) {
      items.push({
        id: `new-${patient.id}`,
        patientName: `${patient.firstName} ${patient.lastName}`,
        initials: getInitials(patient.firstName, patient.lastName),
        patientId: patient.id,
        priority: "medium",
        reason: "New patient — needs onboarding",
        detail: patient.notes || `${patient.subscriptionTier || "standard"} tier · Joined ${new Date(patient.createdAt).toLocaleDateString()}`,
        category: "new",
        timeInfo: timeAgo(patient.createdAt),
        actionLabel: "Onboard",
        actionHref: `/provider/clients?selected=${patient.id}`,
      });
    }

    // Upcoming appointments
    for (const row of queueData.upcomingAppointments) {
      items.push({
        id: `apt-${row.appointment.id}`,
        patientName: `${row.patient.firstName} ${row.patient.lastName}`,
        initials: getInitials(row.patient.firstName, row.patient.lastName),
        patientId: row.patient.id,
        priority: row.appointment.type === "urgent" ? "critical" : "low",
        reason: `${row.appointment.type.replace("_", " ")} appointment`,
        detail: `${row.appointment.title} · ${new Date(row.appointment.scheduledAt).toLocaleDateString()} at ${new Date(row.appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${row.appointment.durationMinutes || 30}min`,
        category: "appointment",
        timeInfo: new Date(row.appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        actionLabel: "View",
        actionHref: "/provider/schedule",
      });
    }

    // Sort by priority
    const priorityOrder: Record<PriorityLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return items;
  }, [queueData]);

  // Filter out dismissed items for the active queue
  const visibleItems = attentionItems.filter((item) => !dismissedKeySet.has(item.id));
  // Dismissed items that still exist in the queue data
  const dismissedVisibleItems = attentionItems.filter((item) => dismissedKeySet.has(item.id));

  const filteredItems =
    activeTab === "all"
      ? visibleItems
      : visibleItems.filter((item) => {
          if (activeTab === "overdue") return item.category === "overdue";
          return item.category === activeTab;
        });

  const categoryCounts = {
    all: visibleItems.length,
    overdue: visibleItems.filter((i) => i.category === "overdue").length,
    message: visibleItems.filter((i) => i.category === "message").length,
    appointment: visibleItems.filter((i) => i.category === "appointment").length,
    new: visibleItems.filter((i) => i.category === "new").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-red-400" />
            Attention Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prioritized list of patients and tasks that need your attention right now
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dismissedVisibleItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
              onClick={() => setShowDismissed(!showDismissed)}
            >
              {showDismissed ? (
                <>Hide dismissed</>
              ) : (
                <>Show dismissed ({dismissedVisibleItems.length})</>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={() => {
              attentionQuery.refetch();
              dismissedQuery.refetch();
            }}
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <div className="text-right">
            <p className="text-2xl font-heading font-bold text-red-400">{categoryCounts.all}</p>
            <p className="text-xs text-muted-foreground">items need attention</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Patients", value: stats?.totalPatients ?? 0 },
          { label: "Active", value: stats?.activePatients ?? 0 },
          { label: "Active Protocols", value: stats?.activePatients ?? 0 },
          { label: "Unread Messages", value: stats?.totalUnread ?? 0 },
          { label: "Upcoming Appts", value: stats?.upcomingAppointments ?? 0 },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="text-xs">All ({categoryCounts.all})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs">Overdue ({categoryCounts.overdue})</TabsTrigger>
          <TabsTrigger value="message" className="text-xs">Messages ({categoryCounts.message})</TabsTrigger>
          <TabsTrigger value="appointment" className="text-xs">Appointments ({categoryCounts.appointment})</TabsTrigger>
          <TabsTrigger value="new" className="text-xs">New ({categoryCounts.new})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-gold/40 mx-auto mb-3" />
              <p className="text-lg font-heading font-semibold text-foreground">All clear!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "all"
                  ? "No patients need your attention right now."
                  : `No ${activeTab} items need attention.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <AttentionItemCard
                  key={item.id}
                  item={item}
                  onDismiss={handleDismiss}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dismissed/Resolved Items Section */}
      {showDismissed && dismissedVisibleItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-sm text-muted-foreground">
              Dismissed / Resolved ({dismissedVisibleItems.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => restoreAllMutation.mutate()}
              disabled={restoreAllMutation.isPending}
            >
              <Undo2 className="h-3 w-3" /> Restore all
            </Button>
          </div>
          <div className="space-y-2">
            {dismissedVisibleItems.map((item) => (
              <DismissedItemCard
                key={item.id}
                item={item}
                action={dismissedActionMap.get(item.id) || "dismissed"}
                onRestore={handleRestore}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Dismissed and resolved items expire automatically after 7 days
          </p>
        </div>
      )}
    </div>
  );
}
