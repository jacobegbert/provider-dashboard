/*
 * Patient Billing Page — View invoices and payment history
 */
import {
  DollarSign, CheckCircle, Clock, FileText, XCircle, ExternalLink, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { label: string; className: string; icon: React.ElementType }> = {
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    open: { label: "Payment Due", className: "bg-amber-100 text-amber-700", icon: Clock },
    draft: { label: "Pending", className: "bg-gray-100 text-gray-600", icon: FileText },
    void: { label: "Void", className: "bg-gray-100 text-gray-500", icon: XCircle },
    uncollectible: { label: "Void", className: "bg-gray-100 text-gray-500", icon: XCircle },
  };
  const { label, className, icon: Icon } = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function PatientBilling() {
  const invoicesQuery = trpc.billing.myInvoices.useQuery();
  const invoices: any[] = invoicesQuery.data ?? [];

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amountCents, 0);

  const outstanding = invoices
    .filter((i) => i.status === "open")
    .reduce((sum, i) => sum + i.amountCents, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your invoices and payment history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Paid</div>
              <div className="text-xl font-semibold text-foreground">{formatCents(totalPaid)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="text-xl font-semibold text-foreground">{formatCents(outstanding)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-base font-semibold">Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{inv.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {inv.status === "paid" && inv.paidAt
                        ? `Paid ${formatDate(inv.paidAt)}`
                        : inv.dueDate
                        ? `Due ${formatDate(inv.dueDate)}`
                        : formatDate(inv.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="font-semibold text-foreground">{formatCents(inv.amountCents)}</span>
                    {statusBadge(inv.status)}
                    {inv.hostedInvoiceUrl && inv.status === "open" && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground text-background rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Pay Now
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
