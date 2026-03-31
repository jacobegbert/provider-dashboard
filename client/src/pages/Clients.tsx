/*
 * Clients Page — Full CRUD with Notes, Tasks, Profile Editing, Documents
 * Design: Warm Command Center — Scandinavian Functionalism
 */
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Users, Search, X, Mail, Phone, Calendar, ClipboardList,
  TrendingUp, Clock, ChevronRight, MessageSquare,
  Plus, Trash2, Edit3, Upload, FileText, Download,
  AlertTriangle, Loader2, CheckSquare, ListTodo,
  StickyNote, Tag, Save, Link2, Copy, Check, Eye,
  ArrowUpDown, ArrowUp, ArrowDown, Crown, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import IntakeViewer from "@/components/IntakeViewer";

type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  status: "active" | "paused" | "completed" | "new" | "inactive" | "prospective";
  subscriptionTier: "standard" | "premium" | "elite";
  healthGoals: string[] | null;
  conditions: string[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date | null;
  deletedAt: Date | null;
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  new: "bg-gold/10 text-gold border-gold/20",
  inactive: "bg-zinc-700/30 text-zinc-400 border-zinc-600/20",
  prospective: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const statusDot: Record<string, string> = {
  active: "bg-emerald-400",
  paused: "bg-amber-400",
  completed: "bg-primary",
  new: "bg-gold",
  inactive: "bg-zinc-500",
  prospective: "bg-sky-400",
};

/** Format a lastActive timestamp into a human-readable relative string */
function formatLastActive(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(date).toLocaleDateString();
}

const priorityStyles: Record<string, string> = {
  low: "bg-zinc-700/30 text-zinc-400 border-zinc-600/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
};

const taskStatusStyles: Record<string, string> = {
  pending: "bg-zinc-700/30 text-zinc-400",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-gold/10 text-gold",
  cancelled: "bg-red-50 text-red-500",
};

const noteCategoryLabels: Record<string, string> = {
  general: "General",
  clinical: "Clinical",
  follow_up: "Follow-up",
  phone_call: "Phone Call",
  lab_review: "Lab Review",
  other: "Other",
};

const noteCategoryColors: Record<string, string> = {
  general: "bg-zinc-700/30 text-zinc-400",
  clinical: "bg-primary/10 text-primary",
  follow_up: "bg-gold/10 text-gold",
  phone_call: "bg-amber-50 text-amber-700",
  lab_review: "bg-purple-50 text-purple-600",
  other: "bg-zinc-700/30 text-zinc-400",
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const docCategoryLabels: Record<string, string> = {
  lab_results: "Lab Results",
  treatment_plan: "Treatment Plan",
  intake_form: "Intake Form",
  consent: "Consent",
  imaging: "Imaging",
  prescription: "Prescription",
  notes: "Notes",
  other: "Other",
};

function exportPatientsToCSV(patients: any[]) {
  const headers = ["First Name", "Last Name", "Email", "Phone", "Status", "Tier", "Date Added", "Last Active"];
  const rows = patients.map(p => [
    p.firstName,
    p.lastName,
    p.email || "",
    p.phone || "",
    p.status,
    p.subscriptionTier || "standard",
    p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
    p.lastActive ? new Date(p.lastActive).toLocaleDateString() : "",
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `black-label-medicine-clients-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Clients() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "tier" | "dateAdded" | "lastActive">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const searchParams = useSearch();
  const initialSelectedId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const sel = params.get("selected");
    return sel ? parseInt(sel) : null;
  }, []);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initialSelectedId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [quickAssignProtocolId, setQuickAssignProtocolId] = useState<string>("");
  const [quickAssignNotes, setQuickAssignNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk action state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showBulkMessageDialog, setShowBulkMessageDialog] = useState(false);
  const [bulkProtocolId, setBulkProtocolId] = useState<string>("");
  const [bulkProtocolNotes, setBulkProtocolNotes] = useState("");
  const [bulkMessageContent, setBulkMessageContent] = useState("");

  // tRPC queries
  const patientsQuery = trpc.patient.list.useQuery();
  const intakeStatusesQuery = trpc.patient.intakeStatuses.useQuery();
  const utils = trpc.useUtils();

  const patients = patientsQuery.data ?? [];
  const intakeStatuses = intakeStatusesQuery.data ?? [];
  const intakeStatusMap = useMemo(() => {
    const map = new Map<number, { status: string; reviewedByProvider: boolean | null }>();
    intakeStatuses.forEach((s) => map.set(s.patientId, { status: s.status, reviewedByProvider: s.reviewedByProvider }));
    return map;
  }, [intakeStatuses]);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? null;

  // Documents query for selected patient
  const documentsQuery = trpc.document.listForPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Notes query for selected patient
  const notesQuery = trpc.clientNote.list.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Tasks query for selected patient
  const tasksQuery = trpc.clientTask.list.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Assignments query for selected patient
  const assignmentsQuery = trpc.assignment.listForPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Appointments query for selected patient
  const appointmentsQuery = trpc.appointment.listForPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Biomarker entries query for selected patient
  const biomarkerEntriesQuery = trpc.biomarker.listEntries.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );
  const biomarkerCustomMetricsQuery = trpc.biomarker.listCustomMetrics.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Protocols query for quick assign
  const protocolsQuery = trpc.protocol.list.useQuery();
  const availableProtocols = protocolsQuery.data ?? [];

  const quickAssignMutation = trpc.assignment.create.useMutation({
    onSuccess: () => {
      utils.assignment.listForPatient.invalidate();
      utils.protocol.listAll.invalidate();
      setShowQuickAssign(false);
      setQuickAssignProtocolId("");
      setQuickAssignNotes("");
      toast.success("Protocol assigned successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const [removeAssignmentId, setRemoveAssignmentId] = useState<number | null>(null);
  const removeAssignmentMutation = trpc.assignment.remove.useMutation({
    onSuccess: () => {
      utils.assignment.listForPatient.invalidate();
      utils.protocol.listAll.invalidate();
      setRemoveAssignmentId(null);
      toast.success("Protocol removed from patient");
    },
    onError: (err) => toast.error(err.message),
  });

  // Bulk action mutations
  const bulkAssignMutation = trpc.assignment.bulkAssign.useMutation({
    onSuccess: (data) => {
      utils.patient.list.invalidate();
      utils.assignment.listForPatient.invalidate();
      utils.protocol.listAll.invalidate();
      setShowBulkAssignDialog(false);
      setBulkProtocolId("");
      setBulkProtocolNotes("");
      exitBulkMode();
      toast.success(`"${data.protocolName}" assigned to ${data.assigned} client${data.assigned !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkSendMutation = trpc.message.bulkSend.useMutation({
    onSuccess: (data) => {
      utils.patient.list.invalidate();
      utils.message.conversations.invalidate();
      setShowBulkMessageDialog(false);
      setBulkMessageContent("");
      exitBulkMode();
      toast.success(`Message sent to ${data.sent} client${data.sent !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── PER-PATIENT STEP EDITING ───
  const [editStepsAssignment, setEditStepsAssignment] = useState<any>(null);
  const [editStepsData, setEditStepsData] = useState<any[]>([]);

  const updateStepsMutation = trpc.assignment.updateSteps.useMutation({
    onSuccess: () => {
      utils.assignment.listForPatient.invalidate();
      setEditStepsAssignment(null);
      setEditStepsData([]);
      toast.success("Patient protocol steps updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function openEditSteps(row: any) {
    setEditStepsAssignment(row);
    const steps = (row.steps ?? []).map((s: any) => ({
      id: s.id,
      title: s.title || "",
      description: s.description || "",
      frequency: s.frequency || "daily",
      customDays: s.customDays || [],
      startDay: s.startDay ?? undefined,
      endDay: s.endDay ?? undefined,
      timeOfDay: s.timeOfDay || "any",
      dosageAmount: s.dosageAmount || "",
      dosageUnit: s.dosageUnit || "",
      route: s.route || "",
    }));
    setEditStepsData(steps);
  }

  function addEditStep() {
    setEditStepsData((prev) => [
      ...prev,
      { title: "", description: "", frequency: "daily", customDays: [], startDay: undefined, endDay: undefined, timeOfDay: "any", dosageAmount: "", dosageUnit: "", route: "" },
    ]);
  }

  function removeEditStep(index: number) {
    setEditStepsData((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEditStep(index: number, field: string, value: any) {
    setEditStepsData((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function saveEditSteps() {
    if (!editStepsAssignment) return;
    updateStepsMutation.mutate({
      assignmentId: editStepsAssignment.assignment.id,
      steps: editStepsData.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        title: s.title,
        description: s.description || undefined,
        frequency: s.frequency,
        customDays: s.customDays?.length ? s.customDays : undefined,
        startDay: s.startDay || null,
        endDay: s.endDay || null,
        timeOfDay: s.timeOfDay,
        dosageAmount: s.dosageAmount || null,
        dosageUnit: s.dosageUnit || null,
        route: s.route || null,
      })),
    });
  }

  // ─── MUTATIONS ───────────────────────────────

  const createPatient = trpc.patient.create.useMutation({
    onSuccess: () => {
      utils.patient.list.invalidate();
      setShowAddDialog(false);
      toast.success("Client added successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePatient = trpc.patient.update.useMutation({
    onSuccess: () => {
      utils.patient.list.invalidate();
      setShowStatusDialog(false);
      setShowEditDialog(false);
      toast.success("Client updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePatient = trpc.patient.delete.useMutation({
    onSuccess: () => {
      utils.patient.list.invalidate();
      setSelectedPatientId(null);
      setShowDeleteDialog(false);
      toast.success("Client moved to Trash");
    },
    onError: (err) => toast.error(err.message),
  });

  const restorePatient = trpc.patient.restore.useMutation({
    onSuccess: () => {
      utils.patient.list.invalidate();
      utils.patient.listDeleted.invalidate();
      toast.success("Client restored");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null);
  const permanentDeletePatient = trpc.patient.permanentDelete.useMutation({
    onSuccess: () => {
      utils.patient.listDeleted.invalidate();
      setShowPermanentDeleteDialog(false);
      setPermanentDeleteId(null);
      toast.success("Client permanently deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDocument = trpc.document.delete.useMutation({
    onSuccess: () => {
      utils.document.listForPatient.invalidate({ patientId: selectedPatientId! });
      toast.success("Document deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Notes mutations
  const createNote = trpc.clientNote.create.useMutation({
    onSuccess: () => {
      utils.clientNote.list.invalidate({ patientId: selectedPatientId! });
      setShowAddNoteDialog(false);
      setNewNote({ content: "", category: "general" });
      toast.success("Note added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteNote = trpc.clientNote.delete.useMutation({
    onSuccess: () => {
      utils.clientNote.list.invalidate({ patientId: selectedPatientId! });
      toast.success("Note deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Tasks mutations
  const createTask = trpc.clientTask.create.useMutation({
    onSuccess: () => {
      utils.clientTask.list.invalidate({ patientId: selectedPatientId! });
      setShowAddTaskDialog(false);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
      toast.success("Task assigned");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTask = trpc.clientTask.update.useMutation({
    onSuccess: () => {
      utils.clientTask.list.invalidate({ patientId: selectedPatientId! });
      toast.success("Task updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTask = trpc.clientTask.delete.useMutation({
    onSuccess: () => {
      utils.clientTask.list.invalidate({ patientId: selectedPatientId! });
      toast.success("Task removed");
    },
    onError: (err) => toast.error(err.message),
  });

  // Deleted patients query for Trash view
  const deletedPatientsQuery = trpc.patient.listDeleted.useQuery(undefined, { enabled: filter === "trash" });
  const deletedPatients = deletedPatientsQuery.data ?? [];

  // Status priority order for sorting
  const statusOrder: Record<string, number> = { active: 0, new: 1, prospective: 2, paused: 3, inactive: 4, completed: 5 };
  const tierOrder: Record<string, number> = { elite: 0, premium: 1, standard: 2 };

  // Filter & sort patients
  const filtered = useMemo(() => {
    if (filter === "trash") {
      return deletedPatients.filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) ||
          (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
      });
    }
    const list = patients.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase()) ||
        (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesFilter = filter === "all" || p.status === filter;
      const matchesTier = tierFilter === "all" || p.subscriptionTier === tierFilter;
      return matchesSearch && matchesFilter && matchesTier;
    });

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "tier":
          cmp = (tierOrder[a.subscriptionTier] ?? 99) - (tierOrder[b.subscriptionTier] ?? 99);
          break;
        case "dateAdded":
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "lastActive":
          cmp = (b.lastActive ? new Date(b.lastActive).getTime() : 0) - (a.lastActive ? new Date(a.lastActive).getTime() : 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [patients, deletedPatients, search, filter, tierFilter, sortBy, sortDir]);

  // ─── BULK SELECTION HELPERS ──────────────────
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
    setSelectedIds(new Set());
  }, []);

  // ─── FORM STATES ─────────────────────────────

  const [newClient, setNewClient] = useState({
    firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "",
    sex: "" as "" | "male" | "female",
    subscriptionTier: "standard" as "standard" | "premium" | "elite",
    notes: "",
  });

  const [editClient, setEditClient] = useState({
    firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "",
    sex: "" as "" | "male" | "female",
    subscriptionTier: "standard" as "standard" | "premium" | "elite",
    notes: "",
    healthGoals: "",
    conditions: "",
  });

  const [newNote, setNewNote] = useState({ content: "", category: "general" });
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ─── HANDLERS ────────────────────────────────

  const handleAddClient = useCallback(() => {
    createPatient.mutate({
      firstName: newClient.firstName,
      lastName: newClient.lastName,
      email: newClient.email || undefined,
      phone: newClient.phone || undefined,
      dateOfBirth: newClient.dateOfBirth || undefined,
      sex: newClient.sex || undefined,
      subscriptionTier: newClient.subscriptionTier,
      notes: newClient.notes || undefined,
    });
  }, [newClient, createPatient]);

  const handleEditClient = useCallback(() => {
    if (!selectedPatient) return;
    updatePatient.mutate({
      id: selectedPatient.id,
      firstName: editClient.firstName,
      lastName: editClient.lastName,
      email: editClient.email || null,
      phone: editClient.phone || null,
      dateOfBirth: editClient.dateOfBirth || null,
      sex: editClient.sex || null,
      subscriptionTier: editClient.subscriptionTier,
      notes: editClient.notes || null,
      healthGoals: editClient.healthGoals ? editClient.healthGoals.split(",").map((s) => s.trim()).filter(Boolean) : [],
      conditions: editClient.conditions ? editClient.conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
  }, [editClient, selectedPatient, updatePatient]);

  const openEditDialog = useCallback(() => {
    if (!selectedPatient) return;
    setEditClient({
      firstName: selectedPatient.firstName,
      lastName: selectedPatient.lastName,
      email: selectedPatient.email || "",
      phone: selectedPatient.phone || "",
      dateOfBirth: selectedPatient.dateOfBirth || "",
      sex: selectedPatient.sex || "",
      subscriptionTier: selectedPatient.subscriptionTier,
      notes: selectedPatient.notes || "",
      healthGoals: selectedPatient.healthGoals?.join(", ") || "",
      conditions: selectedPatient.conditions?.join(", ") || "",
    });
    setShowEditDialog(true);
  }, [selectedPatient]);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile || !selectedPatientId) return;
    setUploading(true);
    try {
      const MAX_SIZE = 16 * 1024 * 1024;
      if (selectedFile.size > MAX_SIZE) {
        toast.error("File too large. Maximum size is 16MB.");
        return;
      }

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          patientId: selectedPatientId,
          category: uploadCategory,
          description: uploadDescription || undefined,
          fileData: base64,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      utils.document.listForPatient.invalidate({ patientId: selectedPatientId });
      setShowUploadDialog(false);
      setSelectedFile(null);
      setUploadCategory("other");
      setUploadDescription("");
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, selectedPatientId, uploadCategory, uploadDescription, utils]);

  return (
    <div className="flex h-full">
      {/* Client list — collapses to narrow column when detail is open, hidden on mobile when detail shown */}
      <div className={`flex flex-col overflow-hidden transition-all duration-300 ${selectedPatient ? "hidden lg:flex w-[280px] shrink-0 border-r border-border" : "flex-1"}`}>
        <div className={`pb-4 ${selectedPatient ? "p-4" : "p-6"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`font-heading font-bold text-foreground ${selectedPatient ? "text-lg" : "text-2xl"}`}>Clients</h1>
              {!selectedPatient && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {patientsQuery.isLoading ? "Loading..." : `${patients.length} total clients`}
                </p>
              )}
            </div>
            {!selectedPatient && (
              <div className="flex items-center gap-2">
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  className={`h-9 text-sm gap-1.5 ${bulkMode ? "bg-charcoal text-white hover:bg-charcoal/90" : ""}`}
                  onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
                >
                  <CheckSquare className="h-4 w-4" />
                  {bulkMode ? "Cancel" : "Select"}
                </Button>
                <Button
                  className="bg-gold hover:bg-gold-light text-black h-9 text-sm gap-1.5"
                  onClick={() => {
                    setNewClient({ firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", subscriptionTier: "standard", notes: "" });
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Client
                </Button>
              </div>
            )}
            {selectedPatient && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setNewClient({ firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", subscriptionTier: "standard", notes: "" });
                  setShowAddDialog(true);
                }}
                title="Add Client"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search & Filter */}
          <div className={`flex items-center ${selectedPatient ? "" : "gap-3"}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={selectedPatient ? "Search..." : "Search by name or email..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/50 border-0 h-9 text-sm"
              />
            </div>
            {!selectedPatient && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 flex-wrap">
                {["all", "active", "new", "prospective", "paused", "inactive", "completed", "trash"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                      filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort & Tier Filter Controls */}
          {!selectedPatient && filter !== "trash" && (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sort:</span>
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                  {[
                    { key: "name" as const, label: "Name" },
                    { key: "status" as const, label: "Status" },
                    { key: "tier" as const, label: "Tier" },
                    { key: "dateAdded" as const, label: "Date Added" },
                    { key: "lastActive" as const, label: "Last Active" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        if (sortBy === s.key) {
                          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        } else {
                          setSortBy(s.key);
                          setSortDir(s.key === "dateAdded" || s.key === "lastActive" ? "desc" : "asc");
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                        sortBy === s.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label}
                      {sortBy === s.key && (
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Filter */}
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tier:</span>
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                  {["all", "elite", "premium", "standard"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
                        tierFilter === t
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filter count */}
              {(tierFilter !== "all" || sortBy !== "name") && (
                <button
                  onClick={() => { setTierFilter("all"); setSortBy("name"); setSortDir("asc"); }}
                  className="text-xs text-gold hover:text-gold-light flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Reset
                </button>
              )}

              {/* Export CSV Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPatientsToCSV(patients)}
                className="gap-2 ml-auto"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Action Toolbar */}
        {bulkMode && !selectedPatient && (
          <div className="mx-6 mb-3 px-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                className="border-charcoal/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
              />
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size === 0
                  ? "Select clients"
                  : `${selectedIds.size} of ${filtered.length} selected`}
              </span>
              {selectedIds.size > 0 && selectedIds.size < filtered.length && (
                <button
                  onClick={selectAll}
                  className="text-xs text-gold hover:text-gold-light transition-colors"
                >
                  Select all {filtered.length}
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setBulkProtocolId("");
                    setBulkProtocolNotes("");
                    setShowBulkAssignDialog(true);
                  }}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Assign Protocol
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setBulkMessageContent("");
                    setShowBulkMessageDialog(true);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Send Message
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Client list */}
        <div className={`flex-1 overflow-y-auto ${selectedPatient ? "px-3 pb-3" : "px-6 pb-6"}`}>
          {patientsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : filtered.length > 0 ? (
            filter === "trash" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((patient) => (
                <Card key={patient.id} className="border border-border opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shrink-0 ${getAvatarColor(patient.id)}`}>
                        {getInitials(patient.firstName, patient.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-sm text-foreground truncate">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {patient.email || "No email"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Deleted {patient.deletedAt ? new Date(patient.deletedAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7"
                        onClick={() => restorePatient.mutate({ id: patient.id })}
                        disabled={restorePatient.isPending}
                      >
                        {restorePatient.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs h-7"
                        onClick={() => { setPermanentDeleteId(patient.id); setShowPermanentDeleteDialog(true); }}
                      >
                        Delete Forever
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <div className={selectedPatient ? "space-y-1" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"}>
              {filtered.map((patient) => (
                selectedPatient ? (
                  /* ─── Compact single-column card ─── */
                  <div
                    key={patient.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                      selectedPatientId === patient.id
                        ? "bg-gold/10 border border-gold/20"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-heading shrink-0 ${getAvatarColor(patient.id)}`}>
                      {getInitials(patient.firstName, patient.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                    </div>
                    {(() => {
                      const intake = intakeStatusMap.get(patient.id);
                      if (!intake) return <span className="text-[9px] text-zinc-500">No Intake</span>;
                      if (intake.status === "submitted") return <span className="text-[9px] text-emerald-400">Intake ✓</span>;
                      return <span className="text-[9px] text-amber-400">Intake…</span>;
                    })()}
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[patient.status]}`} />
                  </div>
                ) : (
                  /* ─── Full card grid view ─── */
                  <Card
                    key={patient.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                      bulkMode && selectedIds.has(patient.id)
                        ? "border-gold ring-1 ring-gold/30 bg-gold/5"
                        : selectedPatientId === patient.id ? "border-gold ring-1 ring-sage/20" : "border-border"
                    }`}
                    onClick={() => bulkMode ? toggleSelect(patient.id) : setSelectedPatientId(patient.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {bulkMode && (
                          <Checkbox
                            checked={selectedIds.has(patient.id)}
                            onCheckedChange={() => toggleSelect(patient.id)}
                            className="mt-1 shrink-0 border-charcoal/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shrink-0 ${getAvatarColor(patient.id)}`}>
                          {getInitials(patient.firstName, patient.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-sm text-foreground truncate">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[patient.status]}`} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {patient.email || "No email"} · {patient.subscriptionTier}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] ${statusStyles[patient.status]}`}>
                            {patient.status}
                          </Badge>
                          {(() => {
                            const intake = intakeStatusMap.get(patient.id);
                            if (!intake) return (
                              <Badge variant="outline" className="text-[10px] bg-zinc-700/20 text-zinc-500 border-zinc-600/20">No Intake</Badge>
                            );
                            if (intake.status === "submitted" && intake.reviewedByProvider) return (
                              <Badge variant="outline" className="text-[10px] bg-gold/10 text-gold border-gold/20">Reviewed</Badge>
                            );
                            if (intake.status === "submitted") return (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Intake Done</Badge>
                            );
                            return (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">In Progress</Badge>
                            );
                          })()}
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          {patient.lastActive ? (
                            <>
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                Date.now() - new Date(patient.lastActive).getTime() < 24 * 60 * 60 * 1000
                                  ? "bg-gold" : Date.now() - new Date(patient.lastActive).getTime() < 7 * 24 * 60 * 60 * 1000
                                  ? "bg-amber-500" : "bg-gray-400"
                              }`} />
                              {formatLastActive(patient.lastActive)}
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-gray-300" />
                              No portal login
                            </>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter === "trash"
                  ? "No deleted clients. Items you delete will appear here."
                  : patients.length === 0 ? "No clients yet. Add your first client to get started." : "No clients match your search."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── DETAIL PANEL ─── */}
      {selectedPatient && (
        <div className="flex flex-1 lg:border-l border-border bg-card flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPatientId(null)}
                className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
                title="Back to list"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <h2 className="font-heading font-semibold text-sm">Client Details</h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={openEditDialog} className="text-muted-foreground hover:text-foreground p-1 rounded" title="Edit profile">
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setNewStatus(selectedPatient.status); setShowStatusDialog(true); }}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                title="Change status"
              >
                <Tag className="h-4 w-4" />
              </button>
              <button onClick={() => setShowDeleteDialog(true)} className="text-muted-foreground hover:text-red-500 p-1 rounded" title="Delete client">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setSelectedPatientId(null)} className="text-muted-foreground hover:text-foreground p-1 rounded" title="Back to list">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Profile header — horizontal layout for wider panel */}
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold font-heading shrink-0 ${getAvatarColor(selectedPatient.id)}`}>
                  {getInitials(selectedPatient.firstName, selectedPatient.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading font-bold text-xl">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
                      onClick={() => {
                        window.open(`/patient?viewAs=${selectedPatient.id}`, '_blank');
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      View as Patient
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-muted-foreground capitalize">{selectedPatient.subscriptionTier} tier</p>
                    <Badge variant="outline" className={`${statusStyles[selectedPatient.status]}`}>
                      {selectedPatient.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-10 px-4 overflow-x-auto flex-nowrap">
                <TabsTrigger value="overview" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Overview</TabsTrigger>
                <TabsTrigger value="notes" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Notes</TabsTrigger>
                <TabsTrigger value="tasks" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Tasks</TabsTrigger>
                <TabsTrigger value="documents" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Documents</TabsTrigger>
                <TabsTrigger value="protocols" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Protocols</TabsTrigger>
                <TabsTrigger value="appointments" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Appointments</TabsTrigger>
                <TabsTrigger value="biomarkers" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Biomarkers</TabsTrigger>
                <TabsTrigger value="intake" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none px-4">Intake</TabsTrigger>
              </TabsList>

              {/* ─── OVERVIEW TAB ─── */}
              <TabsContent value="overview" className="p-6 space-y-4 mt-0 max-w-3xl">
                <div className="space-y-3">
                  {selectedPatient.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedPatient.email}</span>
                    </div>
                  )}
                  {selectedPatient.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedPatient.phone}</span>
                    </div>
                  )}
                  {selectedPatient.dateOfBirth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">DOB: {selectedPatient.dateOfBirth}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Joined {new Date(selectedPatient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`h-2 w-2 rounded-full ml-1 ${
                      selectedPatient.lastActive
                        ? Date.now() - new Date(selectedPatient.lastActive).getTime() < 24 * 60 * 60 * 1000
                          ? "bg-gold" : Date.now() - new Date(selectedPatient.lastActive).getTime() < 7 * 24 * 60 * 60 * 1000
                          ? "bg-amber-500" : "bg-gray-400"
                        : "bg-gray-300"
                    }`} />
                    <span className="text-muted-foreground">
                      {selectedPatient.lastActive
                        ? `Last active ${formatLastActive(selectedPatient.lastActive)}`
                        : "No portal account yet"}
                    </span>
                  </div>
                </div>

                {selectedPatient.conditions && selectedPatient.conditions.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Conditions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.conditions.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPatient.healthGoals && selectedPatient.healthGoals.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Health Goals</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.healthGoals.map((g) => (
                        <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons — all functional */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={() => navigate(`/provider/messages?patient=${selectedPatient.id}`)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={() => navigate("/provider/schedule")}
                  >
                    <Calendar className="h-3.5 w-3.5" /> Schedule
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={() => navigate("/provider/protocols")}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Protocols
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8"
                    onClick={openEditDialog}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </Button>
                </div>
                {/* Invite button */}
                <InviteButton patientId={selectedPatient.id} patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`} patientEmail={selectedPatient.email} />
              </TabsContent>

              {/* ─── NOTES TAB ─── */}
              <TabsContent value="notes" className="p-6 space-y-3 mt-0 max-w-3xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 mb-1"
                  onClick={() => {
                    setNewNote({ content: "", category: "general" });
                    setShowAddNoteDialog(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Note
                </Button>

                {notesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (notesQuery.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(notesQuery.data ?? []).map((note: any) => (
                      <div key={note.id} className="p-3 rounded-xl bg-muted/40 group">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${noteCategoryColors[note.category] || ""}`}>
                              {noteCategoryLabels[note.category] || note.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                                hour: "numeric", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteNote.mutate({ id: note.id })}
                            className="p-0.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete note"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StickyNote className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add your first note to track client interactions</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── TASKS TAB ─── */}
              <TabsContent value="tasks" className="p-6 space-y-3 mt-0 max-w-3xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 mb-1"
                  onClick={() => {
                    setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
                    setShowAddTaskDialog(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </Button>

                {tasksQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (tasksQuery.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(tasksQuery.data ?? []).map((task: any) => (
                      <div key={task.id} className="p-3 rounded-xl bg-muted/40 group">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              const newStatus = task.status === "completed" ? "pending" : "completed";
                              updateTask.mutate({ id: task.id, status: newStatus });
                            }}
                            className={`mt-0.5 shrink-0 ${task.status === "completed" ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityStyles[task.priority]}`}>
                                {task.priority}
                              </Badge>
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${taskStatusStyles[task.status]}`}>
                                {task.status.replace("_", " ")}
                              </Badge>
                              {task.dueDate && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingTask({
                                id: task.id,
                                title: task.title,
                                description: task.description || "",
                                priority: task.priority,
                                status: task.status,
                                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                              });
                              setShowEditTaskDialog(true);
                            }}
                            className="p-0.5 text-muted-foreground hover:text-gold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Edit task"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteTask.mutate({ id: task.id })}
                            className="p-0.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Delete task"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ListTodo className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No tasks assigned</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Assign tasks for this client to track</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── DOCUMENTS TAB ─── */}
              <TabsContent value="documents" className="p-6 space-y-3 mt-0 max-w-3xl">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 mb-1"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadCategory("other");
                    setUploadDescription("");
                    setShowUploadDialog(true);
                  }}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Document
                </Button>

                {documentsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (documentsQuery.data ?? []).length > 0 ? (
                  (documentsQuery.data ?? []).map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 group">
                      <FileText className="h-5 w-5 text-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {docCategoryLabels[doc.category] || doc.category} · {formatFileSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="View/Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument.mutate({ id: doc.id });
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents yet</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── PROTOCOLS TAB ─── */}
              <TabsContent value="protocols" className="p-6 space-y-3 mt-0 max-w-4xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Assigned Protocols</p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 gap-1 border-gold/20 text-gold hover:bg-gold/10"
                      onClick={() => setShowQuickAssign(true)}
                    >
                      <Plus className="h-3 w-3" /> Assign Protocol
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => navigate("/provider/protocols")}
                    >
                      <ClipboardList className="h-3 w-3" /> Library
                    </Button>
                  </div>
                </div>
                {assignmentsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (assignmentsQuery.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(assignmentsQuery.data ?? []).map((row: any) => (
                      <Card key={row.assignment.id} className="border-border/60">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-gold" />
                              <span className="text-sm font-heading font-semibold text-foreground">
                                {row.protocol.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  row.assignment.status === "active"
                                    ? "text-gold border-gold/20"
                                    : row.assignment.status === "completed"
                                    ? "text-primary border-primary/20"
                                    : row.assignment.status === "paused"
                                    ? "text-amber-600 border-amber-200"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {row.assignment.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-gold"
                                onClick={() => openEditSteps(row)}
                                title="Personalize steps for this patient"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                                onClick={() => setRemoveAssignmentId(row.assignment.id)}
                                title="Remove protocol"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {row.protocol.description && (
                            <p className="text-xs text-muted-foreground mb-2">{row.protocol.description}</p>
                          )}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Started {new Date(row.assignment.startDate).toLocaleDateString()}</span>
                              {row.assignment.endDate && (
                                <span>Ends {new Date(row.assignment.endDate).toLocaleDateString()}</span>
                              )}
                            </div>
                            {row.protocol.category && (
                              <Badge variant="secondary" className="text-[10px] mt-1">{row.protocol.category}</Badge>
                            )}
                            {row.assignment.providerNotes && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                {row.assignment.providerNotes}
                              </p>
                            )}
                            {/* Per-patient steps summary */}
                            {(row.steps ?? []).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/40">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Steps ({row.steps.length})</p>
                                <div className="space-y-0.5">
                                  {row.steps.slice(0, 3).map((step: any, idx: number) => (
                                    <div key={step.id || idx} className="flex items-center gap-1.5 text-xs text-foreground/80">
                                      <div className="h-1 w-1 rounded-full bg-gold/60 shrink-0" />
                                      <span className="truncate">{step.title}</span>
                                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{step.frequency}</span>
                                    </div>
                                  ))}
                                  {row.steps.length > 3 && (
                                    <p className="text-[10px] text-muted-foreground">+{row.steps.length - 3} more</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No protocols assigned</p>
                    <Button
                      size="sm"
                      className="mt-3 text-xs gap-1 bg-gold hover:bg-gold-light text-black"
                      onClick={() => setShowQuickAssign(true)}
                    >
                      <Plus className="h-3 w-3" /> Assign a Protocol
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ─── APPOINTMENTS TAB ─── */}
              <TabsContent value="appointments" className="p-6 space-y-3 mt-0 max-w-4xl">
                {appointmentsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (appointmentsQuery.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(appointmentsQuery.data ?? [])
                      .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                      .map((apt: any) => {
                        const isPast = new Date(apt.scheduledAt) < new Date();
                        const typeLabels: Record<string, string> = {
                          initial: "Initial", follow_up: "Follow-up", check_in: "Check-in",
                          lab_work: "Lab Work", urgent: "Urgent",
                        };
                        const typeColors: Record<string, string> = {
                          initial: "bg-primary/10 text-primary",
                          follow_up: "bg-gold/10 text-gold",
                          check_in: "bg-amber-50 text-amber-700",
                          lab_work: "bg-purple-50 text-purple-600",
                          urgent: "bg-red-50 text-red-600",
                        };
                        return (
                          <div key={apt.id} className={`p-3 rounded-xl bg-muted/40 ${isPast ? "opacity-60" : ""}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-foreground truncate">{apt.title}</p>
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[apt.type] || ""}`}>
                                    {typeLabels[apt.type] || apt.type}
                                  </Badge>
                                  {apt.status === "cancelled" && <Badge variant="secondary" className="text-[10px]">Cancelled</Badge>}
                                  {apt.status === "completed" && <Badge variant="secondary" className="text-[10px] bg-gold/10 text-gold">Done</Badge>}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(apt.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(apt.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                  </span>
                                  <span>{apt.durationMinutes || 30} min</span>
                                </div>
                                {apt.assistantNotes && (
                                  <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{apt.assistantNotes}</p>
                                )}
                                {apt.location && (
                                  <p className="text-[10px] text-muted-foreground mt-1 truncate">📍 {apt.location}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No appointments</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs gap-1"
                      onClick={() => navigate("/provider/schedule")}
                    >
                      <Plus className="h-3 w-3" /> Schedule Appointment
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ─── BIOMARKERS TAB ─── */}
              <TabsContent value="biomarkers" className="p-6 space-y-3 mt-0 max-w-4xl">
                {biomarkerEntriesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                  </div>
                ) : (() => {
                  const entries = biomarkerEntriesQuery.data ?? [];
                  const customMetrics = biomarkerCustomMetricsQuery.data ?? [];
                  // Group entries by metric name
                  const grouped: Record<string, any[]> = {};
                  entries.forEach((e: any) => {
                    if (!grouped[e.metricName]) grouped[e.metricName] = [];
                    grouped[e.metricName].push(e);
                  });
                  const metricNames = Object.keys(grouped);
                  const defaultMetrics = ["Weight", "Height", "Body Fat"];
                  const allMetrics = [...new Set([...defaultMetrics.filter(m => grouped[m]), ...metricNames])];

                  if (allMetrics.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No biomarker data</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Client hasn't logged any biomarkers yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {allMetrics.map((metricName) => {
                        const metricEntries = grouped[metricName] || [];
                        const latest = metricEntries[0];
                        const previous = metricEntries[1];
                        const trend = latest && previous ? parseFloat(latest.value) - parseFloat(previous.value) : null;
                        return (
                          <div key={metricName} className="p-3 rounded-xl bg-muted/40">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{metricName}</p>
                              {latest && (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-bold text-foreground">{latest.value}</span>
                                  <span className="text-[10px] text-muted-foreground">{latest.unit}</span>
                                  {trend !== null && trend !== 0 && (
                                    <span className={`text-[10px] font-medium ${trend > 0 ? "text-red-500" : "text-gold"}`}>
                                      {trend > 0 ? "↑" : "↓"}{Math.abs(trend).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {latest && (
                              <p className="text-[10px] text-muted-foreground">
                                Last updated: {new Date(latest.measuredAt).toLocaleDateString()}
                              </p>
                            )}
                            {metricEntries.length > 1 && (
                              <div className="mt-2 pt-2 border-t border-border/40">
                                <p className="text-[10px] text-muted-foreground mb-1">History ({metricEntries.length} entries)</p>
                                <div className="space-y-0.5">
                                  {metricEntries.slice(0, 5).map((e: any) => (
                                    <div key={e.id} className="flex items-center justify-between text-[10px]">
                                      <span className="text-muted-foreground">{new Date(e.measuredAt).toLocaleDateString()}</span>
                                      <span className="text-foreground font-medium">{e.value} {e.unit}</span>
                                    </div>
                                  ))}
                                  {metricEntries.length > 5 && (
                                    <p className="text-[10px] text-muted-foreground/60">+{metricEntries.length - 5} more</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </TabsContent>

              {/* ─── INTAKE TAB ─── */}
              <TabsContent value="intake" className="p-6 space-y-3 mt-0 max-w-4xl">
                {(() => {
                  if (!selectedPatient) return null;
                  return <IntakeViewer patientId={selectedPatient.id} patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`} />;
                })()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* ─── ADD CLIENT DIALOG ─── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New Client</DialogTitle>
            <DialogDescription>Enter the client's information below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First Name *</Label>
                <Input value={newClient.firstName} onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })} placeholder="First name" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Last Name *</Label>
                <Input value={newClient.lastName} onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })} placeholder="Last name" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="client@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="(555) 123-4567" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date of Birth</Label>
                <Input type="date" value={newClient.dateOfBirth} onChange={(e) => setNewClient({ ...newClient, dateOfBirth: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Sex</Label>
                <Select value={newClient.sex} onValueChange={(v) => setNewClient({ ...newClient, sex: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Subscription Tier</Label>
              <Select value={newClient.subscriptionTier} onValueChange={(v) => setNewClient({ ...newClient, subscriptionTier: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} placeholder="Initial notes..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={handleAddClient} disabled={!newClient.firstName || !newClient.lastName || createPatient.isPending}>
              {createPatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT CLIENT DIALOG ─── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Client Profile</DialogTitle>
            <DialogDescription>Update {selectedPatient?.firstName}'s information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First Name *</Label>
                <Input value={editClient.firstName} onChange={(e) => setEditClient({ ...editClient, firstName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Last Name *</Label>
                <Input value={editClient.lastName} onChange={(e) => setEditClient({ ...editClient, lastName: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={editClient.email} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={editClient.phone} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date of Birth</Label>
                <Input type="date" value={editClient.dateOfBirth} onChange={(e) => setEditClient({ ...editClient, dateOfBirth: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Sex</Label>
                <Select value={editClient.sex} onValueChange={(v) => setEditClient({ ...editClient, sex: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Subscription Tier</Label>
              <Select value={editClient.subscriptionTier} onValueChange={(v) => setEditClient({ ...editClient, subscriptionTier: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Health Goals <span className="text-muted-foreground">(comma-separated)</span></Label>
              <Input value={editClient.healthGoals} onChange={(e) => setEditClient({ ...editClient, healthGoals: e.target.value })} placeholder="Weight loss, Better sleep, Gut health" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Conditions <span className="text-muted-foreground">(comma-separated)</span></Label>
              <Input value={editClient.conditions} onChange={(e) => setEditClient({ ...editClient, conditions: e.target.value })} placeholder="Hypothyroid, SIBO, Adrenal fatigue" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={editClient.notes} onChange={(e) => setEditClient({ ...editClient, notes: e.target.value })} className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={handleEditClient} disabled={!editClient.firstName || !editClient.lastName || updatePatient.isPending}>
              {updatePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Archive Client
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>{selectedPatient?.firstName} {selectedPatient?.lastName}</strong>? They will be moved to the Trash and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedPatient && deletePatient.mutate({ id: selectedPatient.id })} disabled={deletePatient.isPending}>
              {deletePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── PERMANENT DELETE CONFIRMATION DIALOG ─── */}
      <Dialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Permanently Delete Client
            </DialogTitle>
            <DialogDescription>
              This action <strong>cannot be undone</strong>. All patient data, assignments, notes, tasks, documents, messages, and biomarker entries will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermanentDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => permanentDeleteId && permanentDeletePatient.mutate({ id: permanentDeleteId })} disabled={permanentDeletePatient.isPending}>
              {permanentDeletePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── STATUS UPDATE DIALOG ─── */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Update Client Status</DialogTitle>
            <DialogDescription>Change the status for {selectedPatient?.firstName} {selectedPatient?.lastName}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="prospective">Prospective</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={() => { if (selectedPatient && newStatus) updatePatient.mutate({ id: selectedPatient.id, status: newStatus as any }); }} disabled={updatePatient.isPending || !newStatus}>
              {updatePatient.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ADD NOTE DIALOG ─── */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Note</DialogTitle>
            <DialogDescription>Add a timestamped note for {selectedPatient?.firstName} {selectedPatient?.lastName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={newNote.category} onValueChange={(v) => setNewNote({ ...newNote, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="lab_review">Lab Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Note *</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Enter your note..."
                className="mt-1"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNoteDialog(false)}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black"
              onClick={() => {
                if (selectedPatientId && newNote.content.trim()) {
                  createNote.mutate({
                    patientId: selectedPatientId,
                    content: newNote.content.trim(),
                    category: newNote.category as any,
                  });
                }
              }}
              disabled={!newNote.content.trim() || createNote.isPending}
            >
              {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <StickyNote className="h-4 w-4 mr-1" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ADD TASK DIALOG ─── */}
      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Assign Task</DialogTitle>
            <DialogDescription>Create a task for {selectedPatient?.firstName} {selectedPatient?.lastName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Complete intake questionnaire"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Additional details..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black"
              onClick={() => {
                if (selectedPatientId && newTask.title.trim()) {
                  createTask.mutate({
                    patientId: selectedPatientId,
                    title: newTask.title.trim(),
                    description: newTask.description || undefined,
                    priority: newTask.priority as any,
                    dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
                  });
                }
              }}
              disabled={!newTask.title.trim() || createTask.isPending}
            >
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ListTodo className="h-4 w-4 mr-1" />}
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT TASK DIALOG ─── */}
      <Dialog open={showEditTaskDialog} onOpenChange={(open) => { setShowEditTaskDialog(open); if (!open) setEditingTask(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Task Title *</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={editingTask.priority} onValueChange={(v) => setEditingTask({ ...editingTask, priority: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editingTask.status} onValueChange={(v) => setEditingTask({ ...editingTask, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditTaskDialog(false); setEditingTask(null); }}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black"
              onClick={() => {
                if (editingTask) {
                  updateTask.mutate({
                    id: editingTask.id,
                    title: editingTask.title.trim(),
                    description: editingTask.description || undefined,
                    priority: editingTask.priority as any,
                    status: editingTask.status as any,
                    dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
                  });
                  setShowEditTaskDialog(false);
                  setEditingTask(null);
                }
              }}
              disabled={!editingTask?.title?.trim() || updateTask.isPending}
            >
              {updateTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── UPLOAD DOCUMENT DIALOG ─── */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Upload Document</DialogTitle>
            <DialogDescription>Upload a PDF, DOC, or other file to {selectedPatient?.firstName}'s portal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">File *</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-gold/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    <FileText className="h-8 w-8 text-gold" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, DOCX, images up to 16MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.txt,.csv,.xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_results">Lab Results</SelectItem>
                  <SelectItem value="treatment_plan">Treatment Plan</SelectItem>
                  <SelectItem value="intake_form">Intake Form</SelectItem>
                  <SelectItem value="consent">Consent</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description (optional)</Label>
              <Input value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Brief description..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={handleFileUpload} disabled={!selectedFile || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── QUICK ASSIGN PROTOCOL DIALOG ─── */}
      <Dialog open={showQuickAssign} onOpenChange={(open) => { setShowQuickAssign(open); if (!open) { setQuickAssignProtocolId(""); setQuickAssignNotes(""); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Assign Protocol to {selectedPatient?.firstName} {selectedPatient?.lastName}</DialogTitle>
            <DialogDescription>Select a protocol from your library to assign to this client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Protocol *</Label>
              <Select value={quickAssignProtocolId} onValueChange={setQuickAssignProtocolId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a protocol..." /></SelectTrigger>
                <SelectContent>
                  {availableProtocols.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <span className="flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-[10px]">({p.category})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Protocol preview */}
            {quickAssignProtocolId && (
              <QuickAssignPreview protocolId={parseInt(quickAssignProtocolId)} />
            )}

            <div>
              <Label className="text-xs font-medium">Provider Notes (optional)</Label>
              <Textarea
                value={quickAssignNotes}
                onChange={(e) => setQuickAssignNotes(e.target.value)}
                placeholder="Notes specific to this patient's assignment..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAssign(false)}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black gap-1.5"
              onClick={() => {
                if (!quickAssignProtocolId || !selectedPatientId) return toast.error("Select a protocol");
                quickAssignMutation.mutate({
                  protocolId: parseInt(quickAssignProtocolId),
                  patientId: selectedPatientId,
                  startDate: new Date(),
                  providerNotes: quickAssignNotes || undefined,
                });
              }}
              disabled={quickAssignMutation.isPending || !quickAssignProtocolId}
            >
              {quickAssignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              {quickAssignMutation.isPending ? "Assigning..." : "Assign Protocol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT PER-PATIENT STEPS DIALOG ─── */}
      <Dialog open={editStepsAssignment !== null} onOpenChange={(open) => { if (!open) { setEditStepsAssignment(null); setEditStepsData([]); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Personalize Steps — {editStepsAssignment?.protocol?.name}
            </DialogTitle>
            <DialogDescription>
              Edit the steps for this patient's protocol. Changes only affect this patient, not the library template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {editStepsData.map((step, idx) => (
              <div key={idx} className="rounded-lg border border-border/60 p-3 space-y-2 relative">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[10px] font-bold text-gold">
                    {idx + 1}
                  </span>
                  <Input
                    value={step.title}
                    onChange={(e) => updateEditStep(idx, "title", e.target.value)}
                    placeholder="Step title (e.g., Testosterone Cypionate 0.3mL IM)"
                    className="flex-1 text-sm h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 shrink-0"
                    onClick={() => removeEditStep(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={step.description || ""}
                  onChange={(e) => updateEditStep(idx, "description", e.target.value)}
                  placeholder="Description / instructions..."
                  className="text-xs min-h-[60px]"
                />
                {/* Dosage & Route */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Dosage Amount</Label>
                    <Input
                      value={step.dosageAmount || ""}
                      onChange={(e) => updateEditStep(idx, "dosageAmount", e.target.value)}
                      placeholder="e.g., 250"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Unit</Label>
                    <Select value={step.dosageUnit || "_none"} onValueChange={(v) => updateEditStep(idx, "dosageUnit", v === "_none" ? "" : v)}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
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
                    <Label className="text-[10px] text-muted-foreground">Route</Label>
                    <Select value={step.route || "_none"} onValueChange={(v) => updateEditStep(idx, "route", v === "_none" ? "" : v)}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
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
                {/* Frequency, Time, Day Range */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Frequency</Label>
                    <Select value={step.frequency} onValueChange={(v) => updateEditStep(idx, "frequency", v)}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Biweekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="as_needed">As Needed</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Time of Day</Label>
                    <Select value={step.timeOfDay} onValueChange={(v) => updateEditStep(idx, "timeOfDay", v)}>
                      <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
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
                      <Label className="text-[10px] text-muted-foreground">Start Day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={step.startDay || ""}
                        onChange={(e) => updateEditStep(idx, "startDay", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="—"
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">End Day</Label>
                      <Input
                        type="number"
                        min={1}
                        value={step.endDay || ""}
                        onChange={(e) => updateEditStep(idx, "endDay", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="—"
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </div>
                </div>
                {step.frequency === "custom" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Select Days</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[
                        { key: "mon", label: "M", full: "Monday" },
                        { key: "tue", label: "T", full: "Tuesday" },
                        { key: "wed", label: "W", full: "Wednesday" },
                        { key: "thu", label: "Th", full: "Thursday" },
                        { key: "fri", label: "F", full: "Friday" },
                        { key: "sat", label: "Sa", full: "Saturday" },
                        { key: "sun", label: "Su", full: "Sunday" },
                      ].map((day) => {
                        const isSelected = (step.customDays || []).includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            title={day.full}
                            onClick={() => {
                              const currentDays = step.customDays || [];
                              const newDays = isSelected
                                ? currentDays.filter((d: string) => d !== day.key)
                                : [...currentDays, day.key];
                              updateEditStep(idx, "customDays", newDays);
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-all border ${
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
                  </div>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1 border-dashed border-gold/20 text-gold hover:bg-gold/10"
              onClick={addEditStep}
            >
              <Plus className="h-3 w-3" /> Add Step
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditStepsAssignment(null); setEditStepsData([]); }}>Cancel</Button>
            <Button
              className="gap-1.5 bg-gold hover:bg-gold-light text-black"
              onClick={saveEditSteps}
              disabled={updateStepsMutation.isPending || editStepsData.some((s) => !s.title.trim())}
            >
              {updateStepsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateStepsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── BULK ASSIGN PROTOCOL DIALOG ─── */}
      <Dialog open={showBulkAssignDialog} onOpenChange={(open) => { if (!open) setShowBulkAssignDialog(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Assign Protocol to {selectedIds.size} Client{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>Select a protocol from your library. It will be assigned to all selected clients.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Protocol</Label>
              <Select value={bulkProtocolId} onValueChange={setBulkProtocolId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose a protocol..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProtocols.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — {p.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bulkProtocolId && <QuickAssignPreview protocolId={Number(bulkProtocolId)} />}
            <div>
              <Label className="text-sm">Provider Notes (optional)</Label>
              <Textarea
                value={bulkProtocolNotes}
                onChange={(e) => setBulkProtocolNotes(e.target.value)}
                placeholder="Notes visible only to you..."
                className="mt-1.5 h-20 text-sm"
              />
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Selected Clients</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedIds).map((id) => {
                  const p = patients.find((pt: any) => pt.id === id);
                  return p ? (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {p.firstName} {p.lastName}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBulkAssignDialog(false)}>Cancel</Button>
            <Button
              className="gap-1.5 bg-gold hover:bg-gold-light text-black"
              onClick={() => {
                if (!bulkProtocolId) return;
                bulkAssignMutation.mutate({
                  patientIds: Array.from(selectedIds),
                  protocolId: Number(bulkProtocolId),
                  startDate: new Date(),
                  providerNotes: bulkProtocolNotes || undefined,
                  origin: window.location.origin,
                });
              }}
              disabled={!bulkProtocolId || bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4" />
              )}
              {bulkAssignMutation.isPending ? "Assigning..." : `Assign to ${selectedIds.size} Client${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── BULK SEND MESSAGE DIALOG ─── */}
      <Dialog open={showBulkMessageDialog} onOpenChange={(open) => { if (!open) setShowBulkMessageDialog(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Message {selectedIds.size} Client{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>Compose a message that will be sent to all selected clients individually.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Message</Label>
              <Textarea
                value={bulkMessageContent}
                onChange={(e) => setBulkMessageContent(e.target.value)}
                placeholder="Type your message here..."
                className="mt-1.5 h-32 text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Each client will receive this as a direct message. They will also be notified via email and SMS.</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Recipients</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedIds).map((id) => {
                  const p = patients.find((pt: any) => pt.id === id);
                  return p ? (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {p.firstName} {p.lastName}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBulkMessageDialog(false)}>Cancel</Button>
            <Button
              className="gap-1.5 bg-gold hover:bg-gold-light text-black"
              onClick={() => {
                if (!bulkMessageContent.trim()) return;
                bulkSendMutation.mutate({
                  patientIds: Array.from(selectedIds),
                  content: bulkMessageContent.trim(),
                  origin: window.location.origin,
                });
              }}
              disabled={!bulkMessageContent.trim() || bulkSendMutation.isPending}
            >
              {bulkSendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {bulkSendMutation.isPending ? "Sending..." : `Send to ${selectedIds.size} Client${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── REMOVE ASSIGNMENT CONFIRMATION ─── */}
      <Dialog open={removeAssignmentId !== null} onOpenChange={(open) => { if (!open) setRemoveAssignmentId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Remove Protocol</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this protocol from the patient? This will also delete all associated task completions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveAssignmentId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => {
                if (removeAssignmentId) removeAssignmentMutation.mutate({ id: removeAssignmentId });
              }}
              disabled={removeAssignmentMutation.isPending}
            >
              {removeAssignmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {removeAssignmentMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Protocol preview in the quick assign dialog */
function QuickAssignPreview({ protocolId }: { protocolId: number }) {
  const { data, isLoading } = trpc.protocol.get.useQuery({ id: protocolId });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-2/3 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">{data.name}</p>
        <Badge variant="secondary" className="text-[10px] capitalize">{data.category}</Badge>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground">{data.description}</p>
      )}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{data.durationDays ? `${data.durationDays} days` : "Ongoing"}</span>
        <span>{data.steps?.length || 0} step{(data.steps?.length || 0) !== 1 ? "s" : ""}</span>
      </div>
      {data.steps && data.steps.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/40">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Steps</p>
          {data.steps.map((step: any, i: number) => (
            <div key={step.id || i} className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/10 text-[9px] font-semibold text-gold mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-xs text-foreground">{step.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {step.dosageAmount && <span>{step.dosageAmount}{step.dosageUnit ? ` ${step.dosageUnit}` : ""} · </span>}
                  {step.route && <span>{step.route} · </span>}
                  {step.frequency?.replace("_", " ")}
                  {step.timeOfDay && step.timeOfDay !== "any" && ` · ${step.timeOfDay}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline component for generating and copying patient invite links + email */
function InviteButton({ patientId, patientName, patientEmail }: { patientId: number; patientName: string; patientEmail: string | null }) {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const generateInvite = trpc.invite.generate.useMutation({
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.inviteUrl);
        setCopied(true);
        const msg = data.existing
          ? `Existing invite link copied for ${patientName}`
          : `New invite link created and copied for ${patientName}`;
        toast.success(data.emailSent ? `${msg} — email notification sent!` : msg);
        if (data.emailSent) setEmailSent(true);
        setTimeout(() => { setCopied(false); setEmailSent(false); }, 4000);
      } catch {
        window.prompt("Copy this invite link:", data.inviteUrl);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 text-xs gap-1.5 h-8 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
        onClick={() => generateInvite.mutate({ patientId, origin: window.location.origin, sendEmail: false })}
        disabled={generateInvite.isPending}
      >
        {generateInvite.isPending && !emailSent ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      {patientEmail && (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs gap-1.5 h-8 border-gold/20 text-gold hover:bg-gold/10"
          onClick={() => generateInvite.mutate({ patientId, origin: window.location.origin, sendEmail: true })}
          disabled={generateInvite.isPending}
        >
          {generateInvite.isPending && emailSent ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : emailSent ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {emailSent ? "Sent!" : "Email Invite"}
        </Button>
      )}
    </div>
  );
}
