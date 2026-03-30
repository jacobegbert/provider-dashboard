/**
 * Biomarkers — Patient-tracked health metrics
 * Weight, Height, Body Fat %, plus unlimited custom metrics
 * Design: Warm Scandinavian — sage green, terracotta, stone palette
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Ruler,
  Percent,
  BarChart3,
  X,
  Edit3,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { useViewAs } from "@/contexts/ViewAsContext";

// Default (built-in) metrics
const DEFAULT_METRICS = [
  { name: "Weight", unit: "lbs", icon: Scale },
  { name: "Height", unit: "in", icon: Ruler },
  { name: "Body Fat", unit: "%", icon: Percent },
];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTrend(entries: any[], metricName: string): { direction: "up" | "down" | "stable"; latest: string; previous?: string } | null {
  const filtered = entries
    .filter((e: any) => e.metricName === metricName)
    .sort((a: any, b: any) => b.measuredAt.localeCompare(a.measuredAt));
  if (filtered.length === 0) return null;
  const latest = filtered[0].value;
  if (filtered.length < 2) return { direction: "stable", latest };
  const previous = filtered[1].value;
  const diff = parseFloat(latest) - parseFloat(previous);
  if (Math.abs(diff) < 0.01) return { direction: "stable", latest, previous };
  return { direction: diff > 0 ? "up" : "down", latest, previous };
}

export default function PatientVitals() {
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [addMetricOpen, setAddMetricOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{ name: string; unit: string } | null>(null);
  const [entryValue, setEntryValue] = useState("");
  const [entryDate, setEntryDate] = useState(todayStr());
  const [entryNote, setEntryNote] = useState("");
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState("");
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");

  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const patientId = myRecordQuery.data?.id;
  const effectivePatientId = patientId ?? 0;

  const entriesQuery = trpc.biomarker.listEntries.useQuery(
    { patientId: patientId ?? 0 },
    { enabled: patientId != null }
  );
  const customMetricsQuery = trpc.biomarker.listCustomMetrics.useQuery(
    { patientId: patientId ?? 0 },
    { enabled: patientId != null }
  );

  const entries = entriesQuery.data ?? [];
  const customMetrics = customMetricsQuery.data ?? [];

  // Combine default + custom metrics
  const allMetrics = useMemo(() => {
    const defaults = DEFAULT_METRICS.map((m) => ({ ...m, isCustom: false, id: 0 }));
    const customs = customMetrics.map((m: any) => ({
      name: m.name,
      unit: m.unit,
      icon: BarChart3,
      isCustom: true,
      id: m.id,
    }));
    return [...defaults, ...customs];
  }, [customMetrics]);

  const addEntryMutation = trpc.biomarker.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry logged");
      setAddEntryOpen(false);
      setEntryValue("");
      setEntryDate(todayStr());
      setEntryNote("");
      setSelectedMetric(null);
      entriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEntryMutation = trpc.biomarker.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      entriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateEntryMutation = trpc.biomarker.updateEntry.useMutation({
    onSuccess: () => {
      toast.success("Entry updated");
      setEditingEntry(null);
      entriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const openEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditValue(entry.value);
    setEditDate(entry.measuredAt);
    setEditNote(entry.note || "");
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !editValue) return;
    updateEntryMutation.mutate({
      id: editingEntry.id,
      patientId: effectivePatientId,
      value: editValue,
      measuredAt: editDate,
      note: editNote || undefined,
    });
  };

  const addCustomMetricMutation = trpc.biomarker.addCustomMetric.useMutation({
    onSuccess: () => {
      toast.success("Custom metric added");
      setAddMetricOpen(false);
      setNewMetricName("");
      setNewMetricUnit("");
      customMetricsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCustomMetricMutation = trpc.biomarker.deleteCustomMetric.useMutation({
    onSuccess: () => {
      toast.success("Metric removed");
      customMetricsQuery.refetch();
      entriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddEntry = () => {
    if (!selectedMetric || !entryValue) return;
    addEntryMutation.mutate({
      patientId: effectivePatientId,
      metricName: selectedMetric.name,
      value: entryValue,
      unit: selectedMetric.unit,
      measuredAt: entryDate,
      note: entryNote || undefined,
    });
  };

  const handleAddCustomMetric = () => {
    if (!newMetricName.trim() || !newMetricUnit.trim()) return;
    addCustomMetricMutation.mutate({
      patientId: effectivePatientId,
      name: newMetricName.trim(),
      unit: newMetricUnit.trim(),
    });
  };

  const openAddEntry = (metric: { name: string; unit: string }) => {
    setSelectedMetric(metric);
    setEntryValue("");
    setEntryDate(todayStr());
    setEntryNote("");
    setAddEntryOpen(true);
  };

  if (myRecordQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/15">
            <Activity className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Biomarkers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your health metrics over time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/patient/biomarker-guide">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-gold"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Guide</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddMetricOpen(true)}
            className="gap-2 text-gold border-gold/20 hover:bg-gold/10"
          >
            <Plus className="h-4 w-4" />
            Add Metric
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMetrics.map((metric) => {
          const trend = getTrend(entries, metric.name);
          const metricEntries = entries
            .filter((e: any) => e.metricName === metric.name)
            .sort((a: any, b: any) => b.measuredAt.localeCompare(a.measuredAt));
          const isExpanded = expandedMetric === metric.name;
          const Icon = metric.icon;

          return (
            <Card
              key={metric.name}
              className="border-border/60 shadow-sm hover:shadow-md transition-all"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-heading font-semibold">
                        {metric.name}
                      </CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                        {metric.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.isCustom && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${metric.name}" and all its entries?`)) {
                            deleteCustomMetricMutation.mutate({ id: metric.id, patientId: effectivePatientId });
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                        title="Remove metric"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {/* Latest value */}
                {trend ? (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-heading font-bold text-foreground">
                      {trend.latest}
                    </span>
                    <span className="text-xs text-muted-foreground">{metric.unit}</span>
                    {trend.previous && (
                      <div
                        className={`flex items-center gap-0.5 text-xs ${
                          trend.direction === "stable"
                            ? "text-muted-foreground"
                            : trend.direction === "down"
                            ? "text-emerald-600"
                            : "text-red-400"
                        }`}
                      >
                        {trend.direction === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : trend.direction === "down" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="font-mono text-[10px]">prev: {trend.previous}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground italic">No entries yet</p>
                  </div>
                )}

                {/* Add entry + history toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8 flex-1"
                    onClick={() => openAddEntry(metric)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Log Entry
                  </Button>
                  {metricEntries.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() =>
                        setExpandedMetric(isExpanded ? null : metric.name)
                      }
                    >
                      {isExpanded ? "Hide" : `History (${metricEntries.length})`}
                    </Button>
                  )}
                </div>

                {/* History list */}
                {isExpanded && metricEntries.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3 space-y-2 max-h-48 overflow-y-auto">
                    {metricEntries.map((entry: any) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-semibold text-foreground w-16 shrink-0">
                            {entry.value}
                            <span className="text-xs text-muted-foreground ml-1">{entry.unit}</span>
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDate(entry.measuredAt)}
                          </span>
                          {entry.note && (
                            <span className="text-xs text-muted-foreground/60 truncate max-w-[120px]">
                              — {entry.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => openEditEntry(entry)}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gold/10 transition-all"
                            title="Edit entry"
                          >
                            <Edit3 className="h-3 w-3 text-muted-foreground hover:text-gold" />
                          </button>
                          <button
                            onClick={() => deleteEntryMutation.mutate({ id: entry.id, patientId: effectivePatientId })}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                            title="Delete entry"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Track your progress consistently for the best insights. Discuss trends with your provider.
      </p>

      {/* Add Entry Dialog */}
      <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Log {selectedMetric?.name}
            </DialogTitle>
            <DialogDescription>
              Record a new measurement for {selectedMetric?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Value ({selectedMetric?.unit})
              </Label>
              <Input
                type="number"
                step="any"
                placeholder={`Enter value in ${selectedMetric?.unit}`}
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Date</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Note (optional)</Label>
              <Textarea
                placeholder="Any context about this measurement..."
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                className="resize-none h-16 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddEntryOpen(false)}
                disabled={addEntryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddEntry}
                disabled={!entryValue || addEntryMutation.isPending}
                className="bg-gold hover:bg-gold-light text-black gap-2"
              >
                {addEntryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editingEntry !== null} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Entry</DialogTitle>
            <DialogDescription>
              Update the value, date, or note for this entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Value ({editingEntry?.unit})
              </Label>
              <Input
                type="number"
                step="any"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Note (optional)</Label>
              <Textarea
                placeholder="Any context about this measurement..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="resize-none h-16 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingEntry(null)}
                disabled={updateEntryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateEntry}
                disabled={!editValue || updateEntryMutation.isPending}
                className="bg-gold hover:bg-gold-light text-black gap-2"
              >
                {updateEntryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Custom Metric Dialog */}
      <Dialog open={addMetricOpen} onOpenChange={setAddMetricOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Custom Metric</DialogTitle>
            <DialogDescription>
              Create a new metric to track. You can add as many as you like.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Metric Name</Label>
              <Input
                placeholder='e.g., "Waist Circumference", "Resting Heart Rate"'
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Unit</Label>
              <Input
                placeholder='e.g., "in", "bpm", "mmHg"'
                value={newMetricUnit}
                onChange={(e) => setNewMetricUnit(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddMetricOpen(false)}
                disabled={addCustomMetricMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddCustomMetric}
                disabled={
                  !newMetricName.trim() ||
                  !newMetricUnit.trim() ||
                  addCustomMetricMutation.isPending
                }
                className="bg-gold hover:bg-gold-light text-black gap-2"
              >
                {addCustomMetricMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Metric
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
