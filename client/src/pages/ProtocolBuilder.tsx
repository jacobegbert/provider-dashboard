/**
 * Protocol Builder — Create and manage protocol templates
 * Provider can create protocols with steps, frequencies, milestones, and lab checkpoints
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  ClipboardList,
  GripVertical,
  Trash2,
  Edit,
  Archive,
  Clock,
  Calendar,
  Beaker,
  Target,
  ChevronDown,
  ChevronUp,
  Pill,
  Dumbbell,
  Moon,
  Brain,
  Leaf,
  FlaskConical,
  Heart,
  Utensils,
  MoreHorizontal,
  Syringe,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  nutrition: { label: "Nutrition", icon: Utensils, color: "bg-green-100 text-green-700" },
  supplement: { label: "Supplement", icon: Pill, color: "bg-purple-100 text-purple-700" },
  lifestyle: { label: "Lifestyle", icon: Heart, color: "bg-pink-100 text-pink-700" },
  lab_work: { label: "Lab Work", icon: FlaskConical, color: "bg-primary/15 text-primary" },
  exercise: { label: "Exercise", icon: Dumbbell, color: "bg-orange-100 text-orange-700" },
  sleep: { label: "Sleep", icon: Moon, color: "bg-indigo-100 text-indigo-700" },
  stress: { label: "Stress", icon: Brain, color: "bg-amber-100 text-amber-700" },
  peptides: { label: "Peptides", icon: Syringe, color: "bg-orange-100 text-orange-700" },
  hormone: { label: "Hormone", icon: Beaker, color: "bg-rose-100 text-rose-700" },
  other: { label: "Other", icon: ClipboardList, color: "bg-zinc-800/50 text-gray-700" },
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  once: "Once",
  as_needed: "As needed",
  custom: "Custom Days",
};

const DAYS_OF_WEEK = [
  { key: "mon", label: "M", full: "Monday" },
  { key: "tue", label: "T", full: "Tuesday" },
  { key: "wed", label: "W", full: "Wednesday" },
  { key: "thu", label: "Th", full: "Thursday" },
  { key: "fri", label: "F", full: "Friday" },
  { key: "sat", label: "Sa", full: "Saturday" },
  { key: "sun", label: "Su", full: "Sunday" },
] as const;

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  any: "Any time",
};

interface StepForm {
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "once" | "as_needed" | "custom";
  customDays: string[];
  startDay: number | null;
  endDay: number | null;
  timeOfDay: "morning" | "afternoon" | "evening" | "any";
  dosageAmount: string;
  dosageUnit: string;
  route: string;
}

interface MilestoneForm {
  day: number;
  label: string;
}

interface LabCheckpointForm {
  day: number;
  labName: string;
}

const emptyStep: StepForm = {
  title: "",
  description: "",
  frequency: "daily",
  customDays: [],
  startDay: null,
  endDay: null,
  timeOfDay: "any",
  dosageAmount: "",
  dosageUnit: "",
  route: "",
};

export default function ProtocolBuilder() {
  const utils = trpc.useUtils();
  const { data: protocols, isLoading } = trpc.protocol.listAll.useQuery();
  const createProtocol = trpc.protocol.create.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      toast.success("Protocol created successfully");
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateProtocol = trpc.protocol.update.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      toast.success("Protocol updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [isOngoing, setIsOngoing] = useState(false);
  const [steps, setSteps] = useState<StepForm[]>([{ ...emptyStep }]);
  const [milestones, setMilestones] = useState<MilestoneForm[]>([]);
  const [labCheckpoints, setLabCheckpoints] = useState<LabCheckpointForm[]>([]);

  function resetForm() {
    setName("");
    setDescription("");
    setCategory("other");
    setDurationDays(30);
    setIsOngoing(false);
    setSteps([{ ...emptyStep }]);
    setMilestones([]);
    setLabCheckpoints([]);
  }

  function addStep() {
    setSteps([...steps, { ...emptyStep }]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof StepForm, value: unknown) {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  }

  function addMilestone() {
    setMilestones([...milestones, { day: 7, label: "" }]);
  }

  function addLabCheckpoint() {
    setLabCheckpoints([...labCheckpoints, { day: 14, labName: "" }]);
  }

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Protocol name is required");
      return;
    }
    if (steps.some((s) => !s.title.trim())) {
      toast.error("All steps must have a title");
      return;
    }
    createProtocol.mutate({
      name,
      description: description || undefined,
      category: category as any,
      durationDays: isOngoing ? null : durationDays,
      milestones: milestones.filter((m) => m.label.trim()),
      labCheckpoints: labCheckpoints.filter((l) => l.labName.trim()),
      steps: steps.map((s) => ({
        title: s.title,
        description: s.description || undefined,
        frequency: s.frequency,
        customDays: s.frequency === "custom" ? s.customDays as ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] : undefined,
        startDay: s.startDay ?? null,
        endDay: s.endDay ?? null,
        timeOfDay: s.timeOfDay,
        dosageAmount: s.dosageAmount || null,
        dosageUnit: s.dosageUnit || null,
        route: s.route || null,
      })),
    });
  }

  const activeProtocols = protocols?.filter((p: any) => !p.isArchived) ?? [];
  const archivedProtocols = protocols?.filter((p: any) => p.isArchived) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-gold" />
            Protocol Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage reusable treatment protocols for your patients
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold-light text-black gap-2">
              <Plus className="h-4 w-4" /> New Protocol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Create New Protocol</DialogTitle>
              <DialogDescription>
                Define a reusable protocol template with steps, milestones, and lab checkpoints.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Protocol Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Gut Restoration Protocol"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the protocol's purpose and goals..."
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_META).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <meta.icon className="h-3.5 w-3.5" />
                              {meta.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Duration</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={isOngoing ? "" : durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                        min={1}
                        disabled={isOngoing}
                        placeholder={isOngoing ? "Ongoing" : "e.g., 30"}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 disabled:opacity-50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOngoing(!isOngoing)}
                      className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isOngoing
                          ? "bg-gold text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Ongoing
                    </button>
                    {isOngoing && (
                      <p className="text-[11px] text-muted-foreground mt-1">No fixed end date — protocol continues indefinitely.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">Protocol Steps</label>
                  <Button variant="outline" size="sm" onClick={addStep} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Step
                  </Button>
                </div>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(i, "title", e.target.value)}
                            placeholder={`Step ${i + 1} title *`}
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                          />
                          <input
                            type="text"
                            value={step.description}
                            onChange={(e) => updateStep(i, "description", e.target.value)}
                            placeholder="Optional description..."
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage/50"
                          />
                          <div className="space-y-2">
                            {/* Dosage & Route */}
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={step.dosageAmount}
                                onChange={(e) => updateStep(i, "dosageAmount", e.target.value)}
                                placeholder="Dosage (e.g., 250)"
                                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                              />
                              <Select
                                value={step.dosageUnit || "_none"}
                                onValueChange={(v) => updateStep(i, "dosageUnit", v === "_none" ? "" : v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">No unit</SelectItem>
                                  <SelectItem value="mg">mg</SelectItem>
                                  <SelectItem value="mcg">mcg</SelectItem>
                                  <SelectItem value="g">g</SelectItem>
                                  <SelectItem value="mL">mL</SelectItem>
                                  <SelectItem value="IU">IU</SelectItem>
                                  <SelectItem value="units">units</SelectItem>
                                  <SelectItem value="capsules">capsules</SelectItem>
                                  <SelectItem value="tablets">tablets</SelectItem>
                                  <SelectItem value="drops">drops</SelectItem>
                                  <SelectItem value="tsp">tsp</SelectItem>
                                  <SelectItem value="tbsp">tbsp</SelectItem>
                                  <SelectItem value="oz">oz</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={step.route || "_none"}
                                onValueChange={(v) => updateStep(i, "route", v === "_none" ? "" : v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Route" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">No route</SelectItem>
                                  <SelectItem value="oral">Oral</SelectItem>
                                  <SelectItem value="sublingual">Sublingual</SelectItem>
                                  <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                                  <SelectItem value="intramuscular">Intramuscular</SelectItem>
                                  <SelectItem value="intravenous">Intravenous</SelectItem>
                                  <SelectItem value="topical">Topical</SelectItem>
                                  <SelectItem value="transdermal">Transdermal</SelectItem>
                                  <SelectItem value="nasal">Nasal</SelectItem>
                                  <SelectItem value="rectal">Rectal</SelectItem>
                                  <SelectItem value="inhalation">Inhalation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Frequency, Time, Day Range */}
                            <div className="grid grid-cols-3 gap-2">
                              <Select
                                value={step.frequency}
                                onValueChange={(v) => updateStep(i, "frequency", v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={step.timeOfDay}
                                onValueChange={(v) => updateStep(i, "timeOfDay", v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(TIME_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={step.startDay ?? ""}
                                  onChange={(e) => updateStep(i, "startDay", e.target.value ? parseInt(e.target.value) : null)}
                                  min={1}
                                  placeholder="—"
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                                  title="Start day (optional)"
                                />
                                <span className="text-xs text-muted-foreground">-</span>
                                <input
                                  type="number"
                                  value={step.endDay ?? ""}
                                  onChange={(e) =>
                                    updateStep(i, "endDay", e.target.value ? parseInt(e.target.value) : null)
                                  }
                                  placeholder="—"
                                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                                  title="End day (optional)"
                                />
                              </div>
                            </div>
                            {/* Custom days selector — shown when frequency is 'custom' */}
                            {step.frequency === "custom" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-muted-foreground mr-1">Days:</span>
                                {DAYS_OF_WEEK.map((day) => {
                                  const isSelected = step.customDays?.includes(day.key);
                                  return (
                                    <button
                                      key={day.key}
                                      type="button"
                                      title={day.full}
                                      onClick={() => {
                                        const currentDays = step.customDays || [];
                                        const newDays = isSelected
                                          ? currentDays.filter((d) => d !== day.key)
                                          : [...currentDays, day.key];
                                        updateStep(i, "customDays", newDays);
                                      }}
                                      className={`w-7 h-7 rounded-full text-[10px] font-semibold transition-all duration-200 border ${
                                        isSelected
                                          ? "bg-gold text-white border-gold shadow-sm"
                                          : "bg-background text-muted-foreground border-border hover:border-gold/50 hover:text-gold"
                                      }`}
                                    >
                                      {day.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        {steps.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(i)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-gold" /> Milestones
                  </label>
                  <Button variant="outline" size="sm" onClick={addMilestone} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No milestones — add checkpoints to track progress</p>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">Day</span>
                        <input
                          type="number"
                          value={m.day}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[i].day = parseInt(e.target.value) || 1;
                            setMilestones(updated);
                          }}
                          min={1}
                          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                        />
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[i].label = e.target.value;
                            setMilestones(updated);
                          }}
                          placeholder="Milestone label..."
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Checkpoints */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-primary" /> Lab Checkpoints
                  </label>
                  <Button variant="outline" size="sm" onClick={addLabCheckpoint} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>
                {labCheckpoints.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No lab checkpoints — add labs to schedule during the protocol</p>
                ) : (
                  <div className="space-y-2">
                    {labCheckpoints.map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">Day</span>
                        <input
                          type="number"
                          value={l.day}
                          onChange={(e) => {
                            const updated = [...labCheckpoints];
                            updated[i].day = parseInt(e.target.value) || 1;
                            setLabCheckpoints(updated);
                          }}
                          min={1}
                          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                        />
                        <input
                          type="text"
                          value={l.labName}
                          onChange={(e) => {
                            const updated = [...labCheckpoints];
                            updated[i].labName = e.target.value;
                            setLabCheckpoints(updated);
                          }}
                          placeholder="Lab name (e.g., Comprehensive Metabolic Panel)..."
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sage/50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLabCheckpoints(labCheckpoints.filter((_, j) => j !== i))}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-gold hover:bg-gold-light text-black"
                  onClick={handleCreate}
                  disabled={createProtocol.isPending}
                >
                  {createProtocol.isPending ? "Creating..." : "Create Protocol"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{activeProtocols.length}</p>
            <p className="text-xs text-muted-foreground">Active Protocols</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{archivedProtocols.length}</p>
            <p className="text-xs text-muted-foreground">Archived</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">
              {new Set(activeProtocols.map((p: any) => p.category)).size}
            </p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Protocol list */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading protocols...</p>
        </div>
      ) : activeProtocols.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">No protocols yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first protocol template to start assigning treatment plans to patients.
            </p>
            <Button
              className="bg-gold hover:bg-gold-light text-black gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" /> Create First Protocol
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeProtocols.map((protocol: any) => {
            const meta = CATEGORY_META[protocol.category] || CATEGORY_META.other;
            const isExpanded = expandedProtocol === protocol.id;
            return (
              <Card key={protocol.id} className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.color}`}>
                      <meta.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold text-sm text-foreground">{protocol.name}</h3>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${meta.color}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {protocol.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {protocol.durationDays ? `${protocol.durationDays}d` : "Ongoing"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchiveConfirm(protocol);
                        }}
                      >
                        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {isExpanded && <ProtocolDetail protocolId={protocol.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Archived section */}
      {archivedProtocols.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Archive className="h-4 w-4" /> Archived ({archivedProtocols.length})
          </h2>
          <div className="space-y-2">
            {archivedProtocols.map((protocol: any) => {
              const meta = CATEGORY_META[protocol.category] || CATEGORY_META.other;
              return (
                <Card key={protocol.id} className="border-border/40 opacity-60">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.color}`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{protocol.name}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => updateProtocol.mutate({ id: protocol.id, isArchived: false })}
                    >
                      Restore
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!archiveConfirm} onOpenChange={(open) => !open && setArchiveConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Archive Protocol</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>{archiveConfirm?.name}</strong>? It will be hidden from the active list but can be restored later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setArchiveConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateProtocol.mutate({ id: archiveConfirm.id, isArchived: true });
                setArchiveConfirm(null);
              }}
            >
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Expanded detail view for a protocol — shows steps, milestones, lab checkpoints */
function ProtocolDetail({ protocolId }: { protocolId: number }) {
  const { data, isLoading } = trpc.protocol.get.useQuery({ id: protocolId });

  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const steps = data.steps || [];
  const milestones = (data.milestones as any[]) || [];
  const labCheckpoints = (data.labCheckpoints as any[]) || [];

  return (
    <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-4">
      {/* Steps */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Steps ({steps.length})
        </h4>
        {steps.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No steps defined</p>
        ) : (
          <div className="space-y-2">
            {steps.map((step: any, i: number) => (
              <div key={step.id || i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {step.dosageAmount && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {step.dosageAmount}{step.dosageUnit ? ` ${step.dosageUnit}` : ""}
                      </Badge>
                    )}
                    {step.route && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">
                        {step.route}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {step.frequency === "custom" && step.customDays?.length
                        ? step.customDays.map((d: string) => DAY_LABELS[d] || d).join(", ")
                        : FREQUENCY_LABELS[step.frequency] || step.frequency}
                    </Badge>
                    {step.timeOfDay && step.timeOfDay !== "any" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {TIME_LABELS[step.timeOfDay] || step.timeOfDay}
                      </Badge>
                    )}
                    {(step.startDay || step.endDay) && (
                      <span className="text-[10px] text-muted-foreground">
                        Day {step.startDay || "?"}{step.endDay ? `–${step.endDay}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Target className="h-3 w-3" /> Milestones
          </h4>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-gold/5 border-gold/15">
                Day {m.day}: {m.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lab Checkpoints */}
      {labCheckpoints.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Beaker className="h-3 w-3" /> Lab Checkpoints
          </h4>
          <div className="flex flex-wrap gap-2">
            {labCheckpoints.map((l: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-primary/10 border-primary/20 text-primary">
                Day {l.day}: {l.labName}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
