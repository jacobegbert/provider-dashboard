/*
 * Protocols Page — Protocol library with real tRPC data
 * Design: Warm Command Center — Scandinavian Functionalism
 * Includes: create, full edit (reuses create form), assign, archive/unarchive, archived section, ongoing duration
 */
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ClipboardList, Search, Plus, Users, Clock, ChevronDown, ChevronUp,
  Apple, Dumbbell, Pill, Brain, Heart, FlaskConical, Moon, Beaker, Syringe,
  Edit, Archive, X, ArchiveRestore, Infinity, Loader2, Copy, BookOpen, Download, Check, ArrowLeft, Flag,
} from "lucide-react";
import { PROTOCOL_TEMPLATES, type ProtocolTemplate } from "@shared/protocolTemplates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  nutrition: Apple,
  exercise: Dumbbell,
  supplement: Pill,
  lifestyle: Heart,
  sleep: Moon,
  stress: Brain,
  peptides: Syringe,
  hormone: FlaskConical,
  lab_work: Beaker,
  other: ClipboardList,
};

const categoryStyles: Record<string, string> = {
  nutrition: "bg-emerald-50 text-emerald-700 border-emerald-200",
  exercise: "bg-primary/10 text-primary border-primary/20",
  supplement: "bg-violet-50 text-violet-700 border-violet-200",
  lifestyle: "bg-rose-50 text-rose-700 border-rose-200",
  sleep: "bg-indigo-50 text-indigo-700 border-indigo-200",
  stress: "bg-amber-50 text-amber-700 border-amber-200",
  peptides: "bg-orange-50 text-orange-700 border-orange-200",
  hormone: "bg-pink-50 text-pink-700 border-pink-200",
  lab_work: "bg-cyan-50 text-cyan-700 border-cyan-200",
  other: "bg-zinc-800/30 text-gray-700 border-gray-200",
};

const CATEGORIES = [
  "nutrition", "supplement", "lifestyle", "lab_work", "exercise",
  "sleep", "stress", "peptides", "hormone", "other",
] as const;

const DAY_LABELS = [
  { key: "mon" as const, label: "M" },
  { key: "tue" as const, label: "T" },
  { key: "wed" as const, label: "W" },
  { key: "thu" as const, label: "Th" },
  { key: "fri" as const, label: "F" },
  { key: "sat" as const, label: "Sa" },
  { key: "sun" as const, label: "Su" },
];

type StepForm = {
  id?: number; // existing step id for edit mode
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "once" | "as_needed" | "custom";
  customDays: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  timeOfDay: "morning" | "afternoon" | "evening" | "any";
  startDay: string;
  endDay: string;
  dosageAmount: string;
  dosageUnit: string;
  route: string;
};

type ProtocolFormData = {
  name: string;
  description: string;
  category: typeof CATEGORIES[number];
  durationDays: string;
  isOngoing: boolean;
  steps: StepForm[];
};

const emptyStep: StepForm = {
  title: "", description: "", frequency: "daily",
  customDays: [], timeOfDay: "any", startDay: "", endDay: "",
  dosageAmount: "", dosageUnit: "", route: "",
};

const emptyForm: ProtocolFormData = {
  name: "", description: "", category: "nutrition",
  durationDays: "", isOngoing: false, steps: [{ ...emptyStep }],
};

export default function Protocols() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [, navigate] = useLocation();

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [editProtocolId, setEditProtocolId] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState<number | null>(null);
  const [viewProtocolId, setViewProtocolId] = useState<number | null>(null);

  // Unified form for create and edit
  const [form, setForm] = useState<ProtocolFormData>({ ...emptyForm });

  // Assign form
  const [assignForm, setAssignForm] = useState({
    patientId: "", startDate: new Date().toISOString().split("T")[0],
    endDate: "", providerNotes: "",
  });

  // tRPC queries
  const utils = trpc.useUtils();
  const { data: allProtocols = [], isLoading } = trpc.protocol.listAll.useQuery();
  const { data: patients = [] } = trpc.patient.list.useQuery();

  // Fetch full protocol data (with steps) when editing
  const editProtocolQuery = trpc.protocol.get.useQuery(
    { id: editProtocolId! },
    { enabled: editProtocolId !== null }
  );

  // Fetch full protocol data for detail view
  const viewProtocolQuery = trpc.protocol.get.useQuery(
    { id: viewProtocolId! },
    { enabled: viewProtocolId !== null }
  );

  // Populate form when edit data arrives
  useEffect(() => {
    if (editProtocolId !== null && editProtocolQuery.data) {
      const p = editProtocolQuery.data;
      setForm({
        name: p.name,
        description: p.description || "",
        category: p.category as typeof CATEGORIES[number],
        durationDays: p.durationDays?.toString() || "",
        isOngoing: !p.durationDays,
        steps: p.steps && p.steps.length > 0
          ? p.steps.map((s: any) => ({
              id: s.id,
              title: s.title,
              description: s.description || "",
              frequency: s.frequency || "daily",
              customDays: Array.isArray(s.customDays) ? s.customDays : [],
              timeOfDay: s.timeOfDay || "any",
              startDay: s.startDay?.toString() || "",
              endDay: s.endDay?.toString() || "",
              dosageAmount: s.dosageAmount || "",
              dosageUnit: s.dosageUnit || "",
              route: s.route || "",
            }))
          : [{ ...emptyStep }],
      });
    }
  }, [editProtocolId, editProtocolQuery.data]);

  const activeProtocols = allProtocols.filter((p: any) => !p.isArchived);
  const archivedProtocols = allProtocols.filter((p: any) => p.isArchived);

  const createMutation = trpc.protocol.create.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      setShowCreate(false);
      setForm({ ...emptyForm });
      toast.success("Protocol created");
    },
    onError: (e) => toast.error(e.message),
  });

  const fullUpdateMutation = trpc.protocol.fullUpdate.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      utils.protocol.get.invalidate();
      setEditProtocolId(null);
      setForm({ ...emptyForm });
      toast.success("Protocol updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const archiveMutation = trpc.protocol.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      setShowDelete(null);
      toast.success(variables.isArchived ? "Protocol archived" : "Protocol restored");
    },
    onError: (e) => toast.error(e.message),
  });

  const cloneMutation = trpc.protocol.clone.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      toast.success("Protocol cloned");
    },
    onError: (e) => toast.error(e.message),
  });

  const seedTemplateMutation = trpc.protocol.seedTemplate.useMutation({
    onSuccess: (data) => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      setShowTemplateLibrary(false);
      toast.success(`"${data.name}" added to your library`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<ProtocolTemplate | null>(null);

  // Track which templates are already in the library by name
  const existingProtocolNames = useMemo(
    () => new Set(allProtocols.map((p: any) => p.name.toLowerCase())),
    [allProtocols]
  );

  const assignMutation = trpc.assignment.create.useMutation({
    onSuccess: () => {
      utils.protocol.listAll.invalidate();
      utils.protocol.list.invalidate();
      utils.assignment.listActiveForProvider.invalidate();
      setShowAssign(null);
      setAssignForm({ patientId: "", startDate: new Date().toISOString().split("T")[0], endDate: "", providerNotes: "" });
      toast.success("Protocol assigned to client");
    },
    onError: (e) => toast.error(e.message),
  });

  // Filter
  const allCategories = useMemo(() => {
    const cats = new Set(activeProtocols.map((p: any) => p.category));
    return ["all", ...Array.from(cats)];
  }, [activeProtocols]);

  const filtered = activeProtocols.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    if (!form.name.trim()) return toast.error("Protocol name is required");
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      durationDays: form.isOngoing ? null : (form.durationDays ? parseInt(form.durationDays) : undefined),
      steps: form.steps.filter(s => s.title.trim()).map(s => ({
        title: s.title,
        description: s.description || undefined,
        frequency: s.frequency,
        customDays: s.frequency === "custom" ? s.customDays : undefined,
        timeOfDay: s.timeOfDay,
        startDay: s.startDay ? parseInt(s.startDay) : null,
        endDay: s.endDay ? parseInt(s.endDay) : null,
        dosageAmount: s.dosageAmount || null,
        dosageUnit: s.dosageUnit || null,
        route: s.route || null,
      })),
    });
  };

  const handleFullUpdate = () => {
    if (!editProtocolId || !form.name.trim()) return toast.error("Protocol name is required");
    fullUpdateMutation.mutate({
      id: editProtocolId,
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      durationDays: form.isOngoing ? null : (form.durationDays ? parseInt(form.durationDays) : undefined),
      steps: form.steps.filter(s => s.title.trim()).map(s => ({
        id: s.id, // preserve existing step ids
        title: s.title,
        description: s.description || undefined,
        frequency: s.frequency,
        customDays: s.frequency === "custom" ? s.customDays : undefined,
        timeOfDay: s.timeOfDay,
        startDay: s.startDay ? parseInt(s.startDay) : null,
        endDay: s.endDay ? parseInt(s.endDay) : null,
        dosageAmount: s.dosageAmount || null,
        dosageUnit: s.dosageUnit || null,
        route: s.route || null,
      })),
    });
  };

  const handleAssign = () => {
    if (!showAssign || !assignForm.patientId) return toast.error("Select a client");
    assignMutation.mutate({
      protocolId: showAssign,
      patientId: parseInt(assignForm.patientId),
      startDate: new Date(assignForm.startDate),
      endDate: assignForm.endDate ? new Date(assignForm.endDate) : undefined,
      providerNotes: assignForm.providerNotes || undefined,
    });
  };

  const openEdit = (protocol: any) => {
    setForm({ ...emptyForm }); // reset first
    setEditProtocolId(protocol.id);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setShowCreate(true);
  };

  // Step helpers — work on the shared form state
  const addStep = () => {
    setForm(f => ({ ...f, steps: [...f.steps, { ...emptyStep }] }));
  };

  const removeStep = (idx: number) => {
    setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));
  };

  const updateStep = (idx: number, field: keyof StepForm, value: any) => {
    setForm(f => ({
      ...f,
      steps: f.steps.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

  const toggleCustomDay = (idx: number, day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun") => {
    setForm(f => ({
      ...f,
      steps: f.steps.map((s, i) => {
        if (i !== idx) return s;
        const days = s.customDays.includes(day)
          ? s.customDays.filter(d => d !== day)
          : [...s.customDays, day];
        return { ...s, customDays: days };
      }),
    }));
  };

  // Whether the form dialog is open (create or edit)
  const isFormOpen = showCreate || editProtocolId !== null;
  const isEditMode = editProtocolId !== null;
  const isMutating = createMutation.isPending || fullUpdateMutation.isPending;

  const closeForm = () => {
    setShowCreate(false);
    setEditProtocolId(null);
    setForm({ ...emptyForm });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-10 w-full max-w-md bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const renderProtocolCard = (protocol: any, isArchivedView = false) => {
    const Icon = categoryIcons[protocol.category] || ClipboardList;
    const isExpanded = expandedId === protocol.id;
    const style = categoryStyles[protocol.category] || categoryStyles.other;

    return (
      <Card
        key={protocol.id}
        className={`border-border/60 shadow-sm hover:shadow-md transition-all cursor-pointer ${isArchivedView ? "opacity-75" : ""}`}
        onClick={() => setViewProtocolId(protocol.id)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.split(" ")[0]} ${style.split(" ")[1]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-semibold text-base text-foreground">{protocol.name}</h3>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 capitalize ${style}`}>
                  {protocol.category.replace("_", " ")}
                </Badge>
                {protocol.isArchived && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Archived</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{protocol.description || "No description"}</p>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {protocol.durationDays ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {protocol.durationDays} days
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Infinity className="h-3.5 w-3.5" /> Ongoing
                  </span>
                )}
                {protocol.stepCount != null && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" /> {protocol.stepCount} step{protocol.stepCount !== 1 ? "s" : ""}
                  </span>
                )}
                {protocol.activeAssignments != null && protocol.activeAssignments > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-gold">
                    <Users className="h-3.5 w-3.5" /> {protocol.activeAssignments} active
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                {!isArchivedView && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setShowAssign(protocol.id)}
                    >
                      <Users className="h-3 w-3" /> Assign to Client
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => openEdit(protocol)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => cloneMutation.mutate({ id: protocol.id })}
                      disabled={cloneMutation.isPending}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Clone
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-destructive hover:text-destructive"
                      onClick={() => setShowDelete(protocol.id)}
                    >
                      <Archive className="h-3 w-3 mr-1" /> Archive
                    </Button>
                  </>
                )}
                {isArchivedView && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => openEdit(protocol)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1 text-gold hover:text-gold"
                      onClick={() => archiveMutation.mutate({ id: protocol.id, isArchived: false })}
                      disabled={archiveMutation.isPending}
                    >
                      <ArchiveRestore className="h-3 w-3" /> Restore Protocol
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Protocols</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activeProtocols.length} active protocols in your library</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-9 text-sm gap-1.5"
            onClick={() => { setTemplatePreview(null); setShowTemplateLibrary(true); }}
          >
            <BookOpen className="h-4 w-4" /> Template Library
          </Button>
          <Button
            className="bg-gold hover:bg-gold-light text-black h-9 text-sm gap-1.5"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" /> Create Protocol
          </Button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search protocols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 overflow-x-auto">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Template Library Dialog */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold" /> Protocol Template Library
            </DialogTitle>
            <DialogDescription>
              Pre-built protocols with dosage, schedule, and lab checkpoints. Add to your library and customize per patient.
            </DialogDescription>
          </DialogHeader>

          {templatePreview ? (
            /* ── Template Detail View ── */
            <div className="space-y-4">
              <button
                onClick={() => setTemplatePreview(null)}
                className="text-xs text-gold hover:text-gold flex items-center gap-1"
              >
                <ChevronUp className="h-3 w-3 rotate-[-90deg]" /> Back to templates
              </button>

              <div className="flex items-start gap-3">
                {(() => { const Icon = categoryIcons[templatePreview.category] || ClipboardList; const style = categoryStyles[templatePreview.category] || categoryStyles.other; return (
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.split(" ")[0]} ${style.split(" ")[1]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                ); })()}
                <div>
                  <h3 className="font-heading font-semibold text-lg">{templatePreview.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{templatePreview.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">{templatePreview.category.replace("_", " ")}</Badge>
                    {templatePreview.durationDays ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {templatePreview.durationDays} days</span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Infinity className="h-3 w-3" /> Ongoing</span>
                    )}
                    <span className="text-xs text-muted-foreground">{templatePreview.steps.length} steps</span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Steps</h4>
                <div className="space-y-2">
                  {templatePreview.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[10px] font-semibold text-gold mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.title}</p>
                        {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {step.dosageAmount && (
                            <Badge variant="secondary" className="text-[9px] h-4">{step.dosageAmount}{step.dosageUnit ? ` ${step.dosageUnit}` : ""}</Badge>
                          )}
                          {step.route && (
                            <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.route}</Badge>
                          )}
                          <Badge variant="secondary" className="text-[9px] h-4 capitalize">
                            {step.frequency === "custom" && step.customDays
                              ? step.customDays.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")
                              : step.frequency?.replace("_", " ")}
                          </Badge>
                          {step.timeOfDay && step.timeOfDay !== "any" && (
                            <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.timeOfDay}</Badge>
                          )}
                          {(step.startDay || step.endDay) && (
                            <Badge variant="outline" className="text-[9px] h-4">Day {step.startDay || "?"}{step.endDay ? `–${step.endDay}` : ""}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {templatePreview.milestones.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Milestones</h4>
                  <div className="flex flex-wrap gap-2">
                    {templatePreview.milestones.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-gold/5 border-gold/15">Day {m.day}: {m.label}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Checkpoints */}
              {templatePreview.labCheckpoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lab Checkpoints</h4>
                  <div className="flex flex-wrap gap-2">
                    {templatePreview.labCheckpoints.map((l, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-primary/10 border-primary/20 text-primary">Day {l.day}: {l.label}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border/40">
                {existingProtocolNames.has(templatePreview.name.toLowerCase()) ? (
                  <Button variant="outline" disabled className="gap-1.5">
                    <Check className="h-4 w-4" /> Already in Library
                  </Button>
                ) : (
                  <Button
                    className="bg-gold hover:bg-gold-light text-black gap-1.5"
                    onClick={() => seedTemplateMutation.mutate({ templateKey: templatePreview.key })}
                    disabled={seedTemplateMutation.isPending}
                  >
                    {seedTemplateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      <><Download className="h-4 w-4" /> Add to My Library</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* ── Template Grid ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROTOCOL_TEMPLATES.map((tmpl) => {
                const Icon = categoryIcons[tmpl.category] || ClipboardList;
                const style = categoryStyles[tmpl.category] || categoryStyles.other;
                const alreadyAdded = existingProtocolNames.has(tmpl.name.toLowerCase());

                return (
                  <div
                    key={tmpl.key}
                    className="border border-border/60 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setTemplatePreview(tmpl)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.split(" ")[0]} ${style.split(" ")[1]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-semibold text-sm truncate">{tmpl.name}</h4>
                          {alreadyAdded && (
                            <Badge variant="secondary" className="text-[9px] h-4 shrink-0"><Check className="h-2.5 w-2.5 mr-0.5" /> Added</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px] h-4 capitalize">{tmpl.category.replace("_", " ")}</Badge>
                          <span className="text-[10px] text-muted-foreground">{tmpl.steps.length} steps</span>
                          {tmpl.durationDays ? (
                            <span className="text-[10px] text-muted-foreground">{tmpl.durationDays}d</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Ongoing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Protocol Detail View Dialog ── */}
      <Dialog open={viewProtocolId !== null} onOpenChange={(open) => { if (!open) setViewProtocolId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewProtocolQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              <span className="ml-2 text-sm text-muted-foreground">Loading protocol...</span>
            </div>
          ) : viewProtocolQuery.data ? (() => {
            const p = viewProtocolQuery.data;
            const Icon = categoryIcons[p.category] || ClipboardList;
            const style = categoryStyles[p.category] || categoryStyles.other;
            const milestones = Array.isArray(p.milestones) ? p.milestones : [];
            const labCheckpoints = Array.isArray(p.labCheckpoints) ? p.labCheckpoints : [];
            const steps = Array.isArray(p.steps) ? p.steps : [];

            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.split(" ")[0]} ${style.split(" ")[1]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="font-heading text-lg">{p.name}</DialogTitle>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="outline" className={`text-xs capitalize ${style}`}>{p.category.replace("_", " ")}</Badge>
                        {p.durationDays ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {p.durationDays} days</span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Infinity className="h-3 w-3" /> Ongoing</span>
                        )}
                        <span className="text-xs text-muted-foreground">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <DialogDescription className="mt-2">
                    {p.description || "No description provided."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Steps */}
                  {steps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Steps</h4>
                      <div className="space-y-2.5">
                        {steps.map((step: any, i: number) => (
                          <div key={step.id || i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[11px] font-semibold text-gold mt-0.5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{step.title}</p>
                              {step.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {step.dosageAmount && (
                                  <Badge variant="secondary" className="text-[9px] h-4">
                                    {step.dosageAmount}{step.dosageUnit ? ` ${step.dosageUnit}` : ""}
                                  </Badge>
                                )}
                                {step.route && (
                                  <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.route}</Badge>
                                )}
                                <Badge variant="secondary" className="text-[9px] h-4 capitalize">
                                  {step.frequency === "custom" && step.customDays
                                    ? (step.customDays as string[]).map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")
                                    : step.frequency?.replace("_", " ")}
                                </Badge>
                                {step.timeOfDay && step.timeOfDay !== "any" && (
                                  <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.timeOfDay}</Badge>
                                )}
                                {(step.startDay || step.endDay) && (
                                  <Badge variant="outline" className="text-[9px] h-4">
                                    {step.startDay ? `Day ${step.startDay}` : "Start"}
                                    {" \u2014 "}
                                    {step.endDay ? `Day ${step.endDay}` : "End"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {milestones.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Milestones</h4>
                      <div className="space-y-1.5">
                        {milestones.map((m: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Flag className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                            <span className="text-muted-foreground"><span className="font-medium text-foreground">Day {m.day}:</span> {m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Checkpoints */}
                  {labCheckpoints.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lab Checkpoints</h4>
                      <div className="space-y-1.5">
                        {labCheckpoints.map((l: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Beaker className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground"><span className="font-medium text-foreground">Day {l.day}:</span> {l.labName || l.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/40 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 gap-1"
                    onClick={() => { setShowAssign(viewProtocolId); setViewProtocolId(null); }}
                  >
                    <Users className="h-3.5 w-3.5" /> Assign to Client
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      const proto = allProtocols.find((pr: any) => pr.id === viewProtocolId);
                      if (proto) { openEdit(proto); setViewProtocolId(null); }
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => { if (viewProtocolId) cloneMutation.mutate({ id: viewProtocolId }); setViewProtocolId(null); }}
                    disabled={cloneMutation.isPending}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Clone
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-destructive hover:text-destructive"
                    onClick={() => { setShowDelete(viewProtocolId); setViewProtocolId(null); }}
                  >
                    <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                  </Button>
                </div>
              </>
            );
          })() : (
            <div className="text-center py-12 text-muted-foreground text-sm">Protocol not found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Active Protocol cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No protocols found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create your first protocol to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((protocol: any) => renderProtocolCard(protocol, false))}
        </div>
      )}

      {/* Patient-Created Protocols Section */}
      <PatientCreatedProtocols onEdit={(protocol: any) => {
        setEditingProtocolId(protocol.id);
        setIsFormOpen(true);
      }} />

      {/* Archived Protocols Section */}
      {archivedProtocols.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <Archive className="h-4 w-4" />
            Archived Protocols ({archivedProtocols.length})
            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {archivedProtocols.map((protocol: any) => renderProtocolCard(protocol, true))}
            </div>
          )}
        </div>
      )}

      {/* ── Unified Create / Edit Protocol Dialog ── */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isEditMode ? "Edit Protocol" : "Create Protocol"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update all protocol details including steps"
                : "Define a new treatment protocol with steps"}
            </DialogDescription>
          </DialogHeader>

          {/* Loading state for edit mode while fetching steps */}
          {isEditMode && editProtocolQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              <span className="ml-2 text-sm text-muted-foreground">Loading protocol data...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Protocol Name *</Label>
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Gut Restoration Protocol"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Protocol overview and goals..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Duration with Ongoing toggle */}
                <div>
                  <Label className="text-xs">Duration</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      type="number"
                      value={form.isOngoing ? "" : form.durationDays}
                      onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))}
                      placeholder="e.g., 90"
                      className="w-32"
                      disabled={form.isOngoing}
                    />
                    <span className="text-xs text-muted-foreground">days</span>
                    <Button
                      type="button"
                      variant={form.isOngoing ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs gap-1.5 ${form.isOngoing ? "bg-gold hover:bg-gold-light text-black" : ""}`}
                      onClick={() => setForm(f => ({ ...f, isOngoing: !f.isOngoing, durationDays: "" }))}
                    >
                      <Infinity className="h-3.5 w-3.5" /> Ongoing
                    </Button>
                  </div>
                  {form.isOngoing && (
                    <p className="text-[11px] text-muted-foreground mt-1">This protocol has no fixed end date and will continue indefinitely.</p>
                  )}
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold">Protocol Steps</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addStep}>
                      <Plus className="h-3 w-3" /> Add Step
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.steps.map((step, idx) => (
                      <div key={step.id ?? `new-${idx}`} className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {idx + 1}
                            {step.id && <span className="text-[10px] text-muted-foreground/50 ml-1">(existing)</span>}
                          </span>
                          {form.steps.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={step.title}
                          onChange={e => updateStep(idx, "title", e.target.value)}
                          placeholder="Step title (e.g., Take probiotics)"
                          className="text-sm"
                        />
                        <Input
                          value={step.description}
                          onChange={e => updateStep(idx, "description", e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm"
                        />
                        {/* Dosage & Route */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Dosage Amount</Label>
                            <Input
                              value={step.dosageAmount}
                              onChange={e => updateStep(idx, "dosageAmount", e.target.value)}
                              placeholder="e.g., 250"
                              className="h-8 text-xs mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Unit</Label>
                            <Select value={step.dosageUnit || "_none"} onValueChange={v => updateStep(idx, "dosageUnit", v === "_none" ? "" : v)}>
                              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">None</SelectItem>
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
                          </div>
                          <div>
                            <Label className="text-[10px]">Route</Label>
                            <Select value={step.route || "_none"} onValueChange={v => updateStep(idx, "route", v === "_none" ? "" : v)}>
                              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">None</SelectItem>
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
                        </div>
                        {/* Frequency, Time of Day, Day Range */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Frequency</Label>
                            <Select value={step.frequency} onValueChange={v => updateStep(idx, "frequency", v)}>
                              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Biweekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="once">Once</SelectItem>
                                <SelectItem value="as_needed">As Needed</SelectItem>
                                <SelectItem value="custom">Custom Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Time of Day</Label>
                            <Select value={step.timeOfDay} onValueChange={v => updateStep(idx, "timeOfDay", v)}>
                              <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="afternoon">Afternoon</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                                <SelectItem value="any">Any</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <Label className="text-[10px]">Start Day</Label>
                              <Input
                                type="number"
                                value={step.startDay}
                                onChange={e => updateStep(idx, "startDay", e.target.value)}
                                placeholder="—"
                                className="h-8 text-xs mt-0.5"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px]">End Day</Label>
                              <Input
                                type="number"
                                value={step.endDay}
                                onChange={e => updateStep(idx, "endDay", e.target.value)}
                                placeholder="—"
                                className="h-8 text-xs mt-0.5"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Custom days selector */}
                        {step.frequency === "custom" && (
                          <div className="flex items-center gap-1.5 pt-1">
                            {DAY_LABELS.map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleCustomDay(idx, key)}
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                                  step.customDays.includes(key)
                                    ? "bg-gold text-white shadow-sm"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeForm}>Cancel</Button>
                <Button
                  className="bg-gold hover:bg-gold-light text-black"
                  onClick={isEditMode ? handleFullUpdate : handleCreate}
                  disabled={isMutating}
                >
                  {isMutating
                    ? (isEditMode ? "Saving..." : "Creating...")
                    : (isEditMode ? "Save Changes" : "Create Protocol")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Archive Confirmation Dialog ────────── */}
      <Dialog open={showDelete !== null} onOpenChange={() => setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Archive Protocol</DialogTitle>
            <DialogDescription>
              This will archive the protocol. It will move to the "Archived" section below but existing assignments will continue. You can restore it anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => showDelete && archiveMutation.mutate({ id: showDelete, isArchived: true })}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? "Archiving..." : "Archive Protocol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign to Client Dialog ────────────── */}
      <Dialog open={showAssign !== null} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Assign Protocol to Client</DialogTitle>
            <DialogDescription>Select a client and set the start date for this protocol</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={assignForm.patientId} onValueChange={v => setAssignForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Start Date *</Label>
                <Input
                  type="date"
                  value={assignForm.startDate}
                  onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End Date (optional)</Label>
                <Input
                  type="date"
                  value={assignForm.endDate}
                  onChange={e => setAssignForm(f => ({ ...f, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Provider Notes</Label>
              <Textarea
                value={assignForm.providerNotes}
                onChange={e => setAssignForm(f => ({ ...f, providerNotes: e.target.value }))}
                placeholder="Notes for this assignment..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black"
              onClick={handleAssign}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Protocol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Protocol Steps Sub-component ────────────── */
function ProtocolSteps({ protocolId }: { protocolId: number }) {
  const { data, isLoading } = trpc.protocol.get.useQuery({ id: protocolId });

  if (isLoading) return <div className="mt-3 text-xs text-muted-foreground">Loading steps...</div>;
  if (!data?.steps?.length) return <div className="mt-3 text-xs text-muted-foreground">No steps defined</div>;

  return (
    <div className="mt-3 space-y-2 pl-1">
      {data.steps.map((step: any, i: number) => (
        <div key={step.id || i} className="flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[10px] font-semibold text-gold mt-0.5">
            {i + 1}
          </span>
          <div>
            <p className="text-sm text-foreground font-medium">{step.title}</p>
            {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {step.dosageAmount && (
                <Badge variant="secondary" className="text-[9px] h-4">
                  {step.dosageAmount}{step.dosageUnit ? ` ${step.dosageUnit}` : ""}
                </Badge>
              )}
              {step.route && (
                <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.route}</Badge>
              )}
              <Badge variant="secondary" className="text-[9px] h-4 capitalize">
                {step.frequency === "custom" && step.customDays
                  ? (step.customDays as string[]).map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")
                  : step.frequency?.replace("_", " ")}
              </Badge>
              {step.timeOfDay && step.timeOfDay !== "any" && (
                <Badge variant="outline" className="text-[9px] h-4 capitalize">{step.timeOfDay}</Badge>
              )}
              {(step.startDay || step.endDay) && (
                <Badge variant="outline" className="text-[9px] h-4">
                  {step.startDay ? `Day ${step.startDay}` : "Start"}
                  {" — "}
                  {step.endDay ? `Day ${step.endDay}` : "End"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatientCreatedProtocols({ onEdit }: { onEdit: (protocol: any) => void }) {
  const { data: patientProtocols, isLoading } = trpc.protocol.listPatientCreated.useQuery();
  const [showSection, setShowSection] = useState(true);

  if (isLoading || !patientProtocols || patientProtocols.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setShowSection(!showSection)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <Users className="h-4 w-4" />
        Patient-Created Protocols ({patientProtocols.length})
        {showSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showSection && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {patientProtocols.map((protocol: any) => {
            const CatIcon = categoryIcons[protocol.category] || ClipboardList;
            const catStyle = categoryStyles[protocol.category] || categoryStyles.other;
            return (
              <Card
                key={protocol.id}
                className="border-border/60 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary"
                onClick={() => onEdit(protocol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${catStyle.split(" ").slice(0, 2).join(" ")}`}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-heading text-sm font-semibold text-foreground truncate">{protocol.name}</h3>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 shrink-0">
                          Patient Created
                        </Badge>
                      </div>
                      {protocol.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{protocol.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> By: {protocol.patientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> {protocol.stepCount} steps
                        </span>
                        <span>
                          {new Date(protocol.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(protocol);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
