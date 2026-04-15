/*
 * Plans Page — Care plan / membership tracking for the provider dashboard
 */
import { useState } from "react";
import {
  CalendarDays, Plus, CheckCircle, Clock, XCircle, PauseCircle,
  RefreshCw, Users, AlertTriangle, Edit2, Trash2, Loader2, Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type PlanType = "annual" | "biannual" | "quarterly" | "monthly" | "custom" | "ongoing";
type PlanStatus = "active" | "expired" | "cancelled" | "paused" | "pending_renewal";

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  annual: "Annual (12 months)",
  biannual: "Bi-Annual (6 months)",
  quarterly: "Quarterly (3 months)",
  monthly: "Monthly (1 month)",
  custom: "Custom Duration",
  ongoing: "Ongoing (no end date)",
};

const PLAN_TYPE_MONTHS: Record<PlanType, number | null> = {
  annual: 12,
  biannual: 6,
  quarterly: 3,
  monthly: 1,
  custom: null,
  ongoing: null,
};

function calcEndDate(startDate: string, planType: PlanType, durationMonths?: number): string | null {
  if (planType === "ongoing") return null;
  const months =
    planType === "custom" ? (durationMonths ?? 1) : (PLAN_TYPE_MONTHS[planType] ?? 12);
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function statusBadge(status: PlanStatus, daysUntilExpiry: number | null) {
  if (status === "active" && daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
        <Bell className="h-3 w-3" /> Renews in {daysUntilExpiry}d
      </Badge>
    );
  }
  if (status === "active" && daysUntilExpiry !== null && daysUntilExpiry <= 0) {
    return <Badge className="bg-red-100 text-red-700 border-0 gap-1"><XCircle className="h-3 w-3" /> Expired</Badge>;
  }
  const map: Record<PlanStatus, { label: string; className: string; icon: React.ElementType }> = {
    active:          { label: "Active",           className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    expired:         { label: "Expired",          className: "bg-red-100 text-red-600",        icon: XCircle     },
    cancelled:       { label: "Cancelled",        className: "bg-muted text-muted-foreground",      icon: XCircle     },
    paused:          { label: "Paused",           className: "bg-blue-100 text-blue-600",      icon: PauseCircle },
    pending_renewal: { label: "Pending Renewal",  className: "bg-amber-100 text-amber-700",    icon: RefreshCw   },
  };
  const { label, className, icon: Icon } = map[status] ?? map.active;
  return (
    <Badge className={`${className} border-0 gap-1`}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const EMPTY_FORM = {
  id: undefined as number | undefined,
  patientId: "" as string,
  planType: "annual" as PlanType,
  startDate: new Date().toISOString().split("T")[0],
  durationMonths: "" as string,
  status: "active" as PlanStatus,
  notes: "",
  priceCents: "" as string,
};

export default function Plans() {
  const [filterStatus, setFilterStatus] = useState<"all" | PlanStatus>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: plans = [], refetch, isLoading } = trpc.plans.list.useQuery();
  const { data: patients = [] } = trpc.patient.list.useQuery();
  const upsert = trpc.plans.upsert.useMutation({ onSuccess: () => { refetch(); setShowDialog(false); } });
  const updateStatus = trpc.plans.updateStatus.useMutation({ onSuccess: () => refetch() });
  const deletePlan = trpc.plans.delete.useMutation({ onSuccess: () => { refetch(); setDeleteConfirm(null); } });

  const filtered = filterStatus === "all"
    ? plans
    : plans.filter(p => {
        if (filterStatus === "active") return p.status === "active" && (p.daysUntilExpiry === null || p.daysUntilExpiry > 0);
        return p.status === filterStatus;
      });

  // Counts
  const activeCount = plans.filter(p => p.status === "active").length;
  const renewingSoon = plans.filter(p => p.daysUntilExpiry !== null && p.daysUntilExpiry <= 30 && p.daysUntilExpiry > 0 && p.status === "active").length;
  const expiredCount = plans.filter(p => p.status === "expired" || (p.status === "active" && p.daysUntilExpiry !== null && p.daysUntilExpiry <= 0)).length;

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setShowDialog(true);
  }

  function openEdit(plan: typeof plans[0]) {
    setForm({
      id: plan.id,
      patientId: String(plan.patientId),
      planType: plan.planType as PlanType,
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      durationMonths: plan.durationMonths ? String(plan.durationMonths) : "",
      status: plan.status as PlanStatus,
      notes: plan.notes ?? "",
      priceCents: plan.priceCents ? String(plan.priceCents / 100) : "",
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.patientId) return;
    upsert.mutate({
      id: form.id,
      patientId: Number(form.patientId),
      planType: form.planType,
      startDate: form.startDate,
      durationMonths: form.planType === "custom" ? Number(form.durationMonths) : undefined,
      status: form.status,
      notes: form.notes || undefined,
      priceCents: form.priceCents ? Math.round(Number(form.priceCents) * 100) : undefined,
    });
  }

  const previewEnd = form.startDate
    ? calcEndDate(form.startDate, form.planType, form.durationMonths ? Number(form.durationMonths) : undefined)
    : null;

  const STATUS_FILTERS: Array<{ key: "all" | PlanStatus; label: string }> = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending_renewal", label: "Renewal Pending" },
    { key: "paused", label: "Paused" },
    { key: "expired", label: "Expired" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Care Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track membership and care plan dates for all clients</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Plans</p>
                <p className="text-3xl font-semibold mt-1">{activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Renewing Soon</p>
                <p className="text-3xl font-semibold mt-1">{renewingSoon}</p>
                <p className="text-xs text-muted-foreground mt-0.5">within 30 days</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${renewingSoon > 0 ? "bg-amber-100" : "bg-muted"}`}>
                <Bell className={`h-5 w-5 ${renewingSoon > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Expired / Lapsed</p>
                <p className="text-3xl font-semibold mt-1">{expiredCount}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${expiredCount > 0 ? "bg-red-100" : "bg-muted"}`}>
                <AlertTriangle className={`h-5 w-5 ${expiredCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal alert banner */}
      {renewingSoon > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Bell className="h-4 w-4 shrink-0" />
          <span>
            <strong>{renewingSoon} client{renewingSoon > 1 ? "s" : ""}</strong> {renewingSoon > 1 ? "have" : "has"} a plan expiring within the next 30 days.
          </span>
          <button
            className="ml-auto text-amber-600 underline underline-offset-2 text-xs font-medium"
            onClick={() => setFilterStatus("active")}
          >
            View
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              filterStatus === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Plans table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <CalendarDays className="h-8 w-8 opacity-30" />
              <p className="text-sm">No plans found</p>
              {filterStatus === "all" && (
                <Button variant="outline" size="sm" onClick={openNew} className="mt-2 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add first plan
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">End / Renewal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{plan.patientName ?? `Patient #${plan.patientId}`}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {PLAN_TYPE_LABELS[plan.planType as PlanType] ?? plan.planType}
                        {plan.durationMonths ? ` (${plan.durationMonths}mo)` : ""}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(plan.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {plan.endDate ? formatDate(plan.endDate) : <span className="italic">Ongoing</span>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(plan.status as PlanStatus, plan.daysUntilExpiry ?? null)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {plan.status === "active" && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => updateStatus.mutate({ id: plan.id, status: "pending_renewal" })}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(plan)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirm(plan.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Plan" : "Add Care Plan"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Client */}
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={form.patientId} onValueChange={(v) => setForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {(patients as any[]).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan type */}
            <div className="space-y-1.5">
              <Label>Plan Type</Label>
              <Select value={form.planType} onValueChange={(v) => setForm(f => ({ ...f, planType: v as PlanType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom duration */}
            {form.planType === "custom" && (
              <div className="space-y-1.5">
                <Label>Duration (months)</Label>
                <Input
                  type="number" min="1" max="120"
                  placeholder="e.g. 4"
                  value={form.durationMonths}
                  onChange={(e) => setForm(f => ({ ...f, durationMonths: e.target.value }))}
                />
              </div>
            )}

            {/* Start date */}
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>

            {/* End date preview */}
            <div className="rounded-lg bg-muted/40 border px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Auto-calculated end date
              </span>
              <span className="font-medium">
                {previewEnd ? formatDate(previewEnd) : "Ongoing — no end date"}
              </span>
            </div>

            {/* Status (edit only) */}
            {form.id && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as PlanStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price (optional) */}
            <div className="space-y-1.5">
              <Label>Plan Price (optional, for reference)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  className="pl-7"
                  type="number" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.priceCents}
                  onChange={(e) => setForm(f => ({ ...f, priceCents: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this plan…"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.patientId || upsert.isPending}
            >
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {form.id ? "Save Changes" : "Add Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the plan record. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm !== null && deletePlan.mutate({ id: deleteConfirm })}
              disabled={deletePlan.isPending}
            >
              {deletePlan.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
