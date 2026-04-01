/*
 * Billing Page — Stripe-powered invoicing and membership management
 */
import { useState } from "react";
import {
  DollarSign, Plus, CheckCircle, Clock, XCircle, FileText,
  CreditCard, TrendingUp, Users, Send, Eye, Ban, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; className: string; icon: React.ElementType }> = {
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    open: { label: "Outstanding", className: "bg-amber-100 text-amber-700", icon: Clock },
    draft: { label: "Draft", className: "bg-gray-100 text-gray-600", icon: FileText },
    void: { label: "Void", className: "bg-red-100 text-red-600", icon: XCircle },
    uncollectible: { label: "Uncollectible", className: "bg-red-100 text-red-600", icon: Ban },
  };
  const { label, className, icon: Icon } = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function formatCents(cents: number | string | null | undefined) {
  const n = Number(cents);
  if (isNaN(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Billing() {
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sendNow, setSendNow] = useState(false);

  const summaryQuery = trpc.billing.summary.useQuery();
  const invoicesQuery = trpc.billing.listInvoices.useQuery({});
  const patientsQuery = trpc.patient.list.useQuery();
  const utils = trpc.useUtils();

  const createInvoiceMutation = trpc.billing.createInvoice.useMutation({
    onSuccess: () => {
      utils.billing.listInvoices.invalidate();
      utils.billing.summary.invalidate();
      setShowCreateInvoice(false);
      setSelectedPatientId("");
      setAmount("");
      setDescription("");
      setDueDate("");
      setSendNow(false);
    },
  });

  const markPaidMutation = trpc.billing.markPaid.useMutation({
    onSuccess: () => {
      utils.billing.listInvoices.invalidate();
      utils.billing.summary.invalidate();
    },
  });

  const voidMutation = trpc.billing.voidInvoice.useMutation({
    onSuccess: () => {
      utils.billing.listInvoices.invalidate();
      utils.billing.summary.invalidate();
    },
  });

  const allInvoices: any[] = invoicesQuery.data ?? [];
  const filtered = filter === "all" ? allInvoices : allInvoices.filter((i) => i.status === filter);
  const summary = summaryQuery.data;
  const patients = patientsQuery.data ?? [];

  function handleCreateInvoice() {
    if (!selectedPatientId || !amount || !description) return;
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents < 50) return;
    createInvoiceMutation.mutate({
      patientId: parseInt(selectedPatientId),
      amountCents: cents,
      description,
      dueDate: dueDate || undefined,
      sendNow,
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage invoices and membership payments</p>
        </div>
        <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: summary ? formatCents(summary.totalRevenue) : "—",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Outstanding",
            value: summary ? formatCents(summary.outstanding) : "—",
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Total Invoices",
            value: summary ? String(summary.invoiceCount) : "—",
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Paid",
            value: summary ? String(summary.paidCount) : "—",
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-lg font-semibold text-foreground">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "paid", "draft", "void"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoices table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-base font-semibold">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No invoices yet</p>
              <button
                onClick={() => setShowCreateInvoice(true)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Due</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">
                        {inv.firstName} {inv.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{inv.description}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCents(inv.amountCents)}</td>
                      <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {inv.hostedInvoiceUrl && (
                            <a
                              href={inv.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Stripe invoice"
                            >
                              <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </a>
                          )}
                          {inv.status === "open" && (
                            <button
                              onClick={() => markPaidMutation.mutate({ invoiceId: inv.id })}
                              title="Mark as paid"
                              className="p-1.5 rounded hover:bg-emerald-50 transition-colors text-muted-foreground hover:text-emerald-600"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(inv.status === "draft" || inv.status === "open") && (
                            <button
                              onClick={() => voidMutation.mutate({ invoiceId: inv.id })}
                              title="Void invoice"
                              className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient…" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  className="pl-7"
                  placeholder="0.00"
                  type="number"
                  min="0.50"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Monthly membership – Elite tier"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="sendNow"
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={sendNow}
                onChange={(e) => setSendNow(e.target.checked)}
              />
              <label htmlFor="sendNow" className="text-sm text-muted-foreground cursor-pointer">
                Send via Stripe immediately (requires patient email & Stripe configured)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoice(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={!selectedPatientId || !amount || !description || createInvoiceMutation.isPending}
              className="gap-2"
            >
              {createInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sendNow ? (
                <Send className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {sendNow ? "Send Invoice" : "Save as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
