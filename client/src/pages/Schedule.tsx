/*
 * Schedule Page — Full Calendar + List View with real tRPC data
 * Design: Warm Command Center — Scandinavian Functionalism
 */
import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon, Clock, Plus, Video, ChevronLeft, ChevronRight,
  LayoutGrid, List, X, CalendarPlus, Edit3, Save, Loader2,
} from "lucide-react";
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

/* ── Type Styles ─────────────────────────────── */
const typeStyles: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  initial: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", label: "Initial Consultation", dot: "bg-primary" },
  urgent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Urgent Follow-up", dot: "bg-red-500" },
  follow_up: { bg: "bg-gold/10", text: "text-gold", border: "border-gold/15", label: "Follow-up", dot: "bg-gold" },
  check_in: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Check-in", dot: "bg-amber-500" },
  lab_work: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "Lab Work", dot: "bg-violet-500" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function GoogleCalendarBanner() {
  const status = trpc.googleCalendar.status.useQuery();
  if (status.isLoading || status.data?.connected) return null;
  return (
    <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
      <CalendarPlus className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Google Calendar not connected</p>
        <p className="text-xs text-amber-600">Connect in Settings to auto-sync appointments to your Google Calendar.</p>
      </div>
      <a href="/provider/settings" className="text-xs font-medium text-amber-700 hover:text-amber-900 underline whitespace-nowrap">Connect</a>
    </div>
  );
}

export default function Schedule() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    new Date(now.getFullYear(), now.getMonth(), now.getDate())
  );

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showEditAppt, setShowEditAppt] = useState<any>(null);
  const [showCancel, setShowCancel] = useState<any>(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    patientId: "", title: "", type: "check_in" as string,
    date: new Date().toISOString().split("T")[0],
    time: "09:00", durationMinutes: "30",
    location: "", notes: "",
  });

  // Edit appointment form
  const [editApptForm, setEditApptForm] = useState({
    title: "", type: "check_in", date: "", time: "",
    durationMinutes: "30", location: "", notes: "", status: "scheduled",
  });

  // tRPC
  const utils = trpc.useUtils();
  const { data: appointments = [], isLoading } = trpc.appointment.listForProvider.useQuery();
  const { data: patients = [] } = trpc.patient.list.useQuery();

  const createMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      utils.appointment.listForProvider.invalidate();
      setShowCreate(false);
      setCreateForm({ patientId: "", title: "", type: "check_in", date: new Date().toISOString().split("T")[0], time: "09:00", durationMinutes: "30", location: "", notes: "" });
      toast.success("Appointment scheduled");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.appointment.update.useMutation({
    onSuccess: () => {
      utils.appointment.listForProvider.invalidate();
      utils.appointment.listForPatient.invalidate();
      setShowEditAppt(null);
      toast.success("Appointment updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.appointment.update.useMutation({
    onSuccess: () => {
      utils.appointment.listForProvider.invalidate();
      setShowCancel(null);
      toast.success("Appointment cancelled");
    },
    onError: (e) => toast.error(e.message),
  });

  // Parse appointments into resolved dates
  // listForProvider returns { appointment, patient } from a join, so flatten
  const resolved = useMemo(() => {
    return appointments
      .map((row: any) => {
        const apt = row.appointment || row;
        const patient = row.patient || null;
        return {
          ...apt,
          patient,
          resolvedDate: new Date(apt.scheduledAt),
        };
      })
      .filter((apt: any) => !isNaN(apt.resolvedDate.getTime()));
  }, [appointments]);

  // Calendar grid data
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const appointmentsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    resolved.forEach((apt: any) => {
      if (apt.resolvedDate.getFullYear() === currentYear && apt.resolvedDate.getMonth() === currentMonth) {
        const day = apt.resolvedDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(apt);
      }
    });
    return map;
  }, [resolved, currentYear, currentMonth]);

  const selectedAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return resolved
      .filter((apt: any) => isSameDay(apt.resolvedDate, selectedDate))
      .sort((a: any, b: any) => a.resolvedDate.getTime() - b.resolvedDate.getTime());
  }, [resolved, selectedDate]);

  const groupedByDate = useMemo(() => {
    const groups: { date: Date; label: string; apts: any[] }[] = [];
    const map = new Map<string, any[]>();
    const sorted = [...resolved].sort((a: any, b: any) => a.resolvedDate.getTime() - b.resolvedDate.getTime());
    sorted.forEach((apt: any) => {
      const key = `${apt.resolvedDate.getFullYear()}-${String(apt.resolvedDate.getMonth() + 1).padStart(2, "0")}-${String(apt.resolvedDate.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    });
    map.forEach((apts) => {
      groups.push({ date: apts[0].resolvedDate, label: formatDateLabel(apts[0].resolvedDate), apts });
    });
    return groups;
  }, [resolved]);

  // Navigation
  const goToPrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } };
  const goToNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } };
  const goToToday = () => { setCurrentYear(now.getFullYear()); setCurrentMonth(now.getMonth()); setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())); };
  const isToday = (day: number) => day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
  const isSelected = (day: number) => selectedDate ? day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear() : false;

  const handleCreate = () => {
    if (!createForm.patientId) return toast.error("Select a client");
    if (!createForm.title.trim()) return toast.error("Title is required");
    const scheduledAt = new Date(`${createForm.date}T${createForm.time}:00`);
    createMutation.mutate({
      patientId: parseInt(createForm.patientId),
      title: createForm.title,
      type: createForm.type as any,
      scheduledAt,
      durationMinutes: parseInt(createForm.durationMinutes) || 30,
      location: createForm.location || undefined,
      assistantNotes: createForm.notes || undefined,
      origin: window.location.origin,
    });
  };

  const handleEditAppt = () => {
    if (!showEditAppt || !editApptForm.date || !editApptForm.time) return;
    updateMutation.mutate({
      id: showEditAppt.id,
      title: editApptForm.title.trim() || undefined,
      type: editApptForm.type as any,
      scheduledAt: new Date(`${editApptForm.date}T${editApptForm.time}:00`),
      durationMinutes: parseInt(editApptForm.durationMinutes) || 30,
      location: editApptForm.location || undefined,
      assistantNotes: editApptForm.notes || undefined,
      status: editApptForm.status as any,
    });
  };

  const openEditAppt = (apt: any) => {
    const d = new Date(apt.scheduledAt);
    setEditApptForm({
      title: apt.title || "",
      type: apt.type || "check_in",
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
      durationMinutes: String(apt.durationMinutes || 30),
      location: apt.location || "",
      notes: apt.assistantNotes || "",
      status: apt.status || "scheduled",
    });
    setShowEditAppt(apt);
  };

  /** Generate and download an .ics file for an appointment */
  const downloadICS = (apt: any) => {
    const start = new Date(apt.scheduledAt);
    const end = new Date(start.getTime() + (apt.durationMinutes || 30) * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmtDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    const patientName = getPatientName(apt);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BlackLabelMedicine//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmtDate(start)}`,
      `DTEND:${fmtDate(end)}`,
      `SUMMARY:${apt.title || "Appointment"} — ${patientName}`,
      `DESCRIPTION:${(apt.assistantNotes || apt.patientNotes || "").replace(/\n/g, "\\n")}`,
      apt.location ? `LOCATION:${apt.location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment-${apt.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded — open it to add to your calendar");
  };

  const getPatientName = (apt: any) => {
    if (apt.patient) return `${apt.patient.firstName} ${apt.patient.lastName}`;
    const p = patients.find((p: any) => p.id === apt.patientId);
    return p ? `${p.firstName} ${p.lastName}` : "Unknown";
  };

  const getInitials = (apt: any) => {
    const name = getPatientName(apt);
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-[500px] bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const renderAppointmentCard = (apt: any, compact = false) => {
    const style = typeStyles[apt.type] || typeStyles.check_in;
    return (
      <div key={apt.id} className={`p-3 rounded-xl border-l-3 ${style.border} bg-muted/40 hover:bg-muted/60 transition-colors`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[10px] font-semibold font-heading text-gold">
            {getInitials(apt)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{getPatientName(apt)}</p>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${style.bg} ${style.text} ${style.border}`}>
              {style.label}
            </Badge>
          </div>
          {apt.status === "cancelled" && (
            <Badge variant="secondary" className="text-[9px]">Cancelled</Badge>
          )}
          {apt.status === "completed" && (
            <Badge variant="secondary" className="text-[9px] bg-gold/10 text-gold border-gold/20">Completed</Badge>
          )}
          {apt.status === "no_show" && (
            <Badge variant="secondary" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20">No Show</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(new Date(apt.scheduledAt))}</span>
          <span>{apt.durationMinutes || 30} min</span>
          {apt.location && <span>{apt.location}</span>}
        </div>

        {apt.title && <p className="text-xs font-medium text-foreground mb-1">{apt.title}</p>}
        {apt.assistantNotes && <p className="text-xs text-muted-foreground/80 mb-3">{apt.assistantNotes}</p>}

        {apt.status !== "cancelled" && apt.status !== "completed" && (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className={`${compact ? "h-6 text-[10px]" : "h-7 text-[11px]"} gap-1 px-2`}
              onClick={() => {
                if (apt.location?.toLowerCase().includes("http")) {
                  window.open(apt.location, "_blank");
                } else {
                  toast.info("Video call link not set for this appointment");
                }
              }}
            >
              <Video className="h-3 w-3" /> Join
            </Button>
            <Button variant="ghost" size="sm" className={`${compact ? "h-6 text-[10px]" : "h-7 text-[11px]"} px-2 gap-1`}
              onClick={() => openEditAppt(apt)}
            >
              <Edit3 className="h-3 w-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className={`${compact ? "h-6 text-[10px]" : "h-7 text-[11px]"} px-2 text-destructive hover:text-destructive`}
              onClick={() => setShowCancel(apt)}
            >
              Cancel
            </Button>
            <Button variant="ghost" size="sm" className={`${compact ? "h-6 text-[10px]" : "h-7 text-[11px]"} px-2 gap-1 ml-auto`}
              onClick={() => downloadICS(apt)}
              title="Add to calendar"
            >
              <CalendarPlus className="h-3 w-3" /> Add to Cal
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {resolved.filter((a: any) => a.status === "scheduled" && new Date(a.scheduledAt) > new Date()).length} upcoming appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode("calendar")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Calendar
            </button>
            <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <Button className="bg-gold hover:bg-gold-light text-black h-9 text-sm gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Google Calendar Banner */}
      <GoogleCalendarBanner />

      {/* ── Calendar View ─────────────────────── */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading font-bold text-xl text-foreground">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={goToToday}>Today</Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToPrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[88px] border-t border-border/30" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayApts = appointmentsByDay[day] || [];
                  const activeApts = dayApts.filter((a: any) => a.status !== "cancelled");
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                      className={`h-[88px] border-t border-border/30 p-1.5 text-left transition-colors hover:bg-muted/40 relative ${
                        isSelected(day) ? "bg-gold/5 ring-1 ring-sage/30" : ""
                      }`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday(day) ? "bg-gold text-white" : "text-foreground"
                      }`}>
                        {day}
                      </span>
                      {activeApts.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {activeApts.slice(0, 2).map((apt: any) => {
                            const style = typeStyles[apt.type] || typeStyles.check_in;
                            return (
                              <div key={apt.id} className={`text-[9px] px-1 py-0.5 rounded ${style.bg} ${style.text} truncate`}>
                                {formatTime(new Date(apt.scheduledAt))} {getPatientName(apt).split(" ")[0]}
                              </div>
                            );
                          })}
                          {activeApts.length > 2 && (
                            <div className="text-[9px] text-muted-foreground px-1">+{activeApts.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
                  {selectedDate ? formatDateLabel(selectedDate) : "Select a date"}
                </h3>
                {selectedAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No appointments</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">This day is open for scheduling</p>
                    <Button variant="outline" size="sm" className="mt-4 h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/5"
                      onClick={() => {
                        if (selectedDate) {
                          setCreateForm(f => ({ ...f, date: selectedDate.toISOString().split("T")[0] }));
                        }
                        setShowCreate(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Schedule Here
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAppointments.map((apt: any) => renderAppointmentCard(apt, true))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">{MONTH_NAMES[currentMonth]} Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(typeStyles).map(([key, style]) => {
                    const count = resolved.filter((a: any) => a.type === key && a.resolvedDate.getMonth() === currentMonth && a.resolvedDate.getFullYear() === currentYear && a.status !== "cancelled").length;
                    return (
                      <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                        <span className={`h-3 w-3 rounded-full ${style.dot}`} />
                        <div>
                          <p className="text-lg font-heading font-bold text-foreground leading-none">{count}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{style.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── List View ─────────────────────────── */}
      {viewMode === "list" && (
        <div className="max-w-3xl space-y-8">
          {groupedByDate.length === 0 ? (
            <div className="text-center py-16">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No appointments scheduled</p>
              <Button className="mt-4 bg-gold hover:bg-gold-light text-black" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Schedule First Appointment
              </Button>
            </div>
          ) : (
            groupedByDate.map(({ label, apts }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                    <CalendarIcon className="h-4 w-4 text-gold" />
                  </div>
                  <h2 className="font-heading font-semibold text-base text-foreground">{label}</h2>
                  <Badge variant="secondary" className="text-[10px] h-5">{apts.length} appointment{apts.length !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="space-y-3 ml-11">
                  {apts.map((apt: any) => {
                    const style = typeStyles[apt.type] || typeStyles.check_in;
                    return (
                      <Card key={apt.id} className={`border-l-4 ${style.border} shadow-sm hover:shadow-md transition-all`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="text-center shrink-0 w-16">
                              <p className="font-heading font-bold text-lg text-foreground leading-none">
                                {formatTime(new Date(apt.scheduledAt)).split(" ")[0]}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(new Date(apt.scheduledAt)).split(" ")[1]}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{apt.durationMinutes || 30} min</p>
                            </div>
                            <div className="w-px h-16 bg-border shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-[10px] font-semibold font-heading text-gold">
                                  {getInitials(apt)}
                                </div>
                                <h3 className="font-heading font-semibold text-sm text-foreground">{getPatientName(apt)}</h3>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${style.bg} ${style.text} ${style.border}`}>
                                  {style.label}
                                </Badge>
                                {apt.status === "cancelled" && <Badge variant="secondary" className="text-[10px]">Cancelled</Badge>}
                                {apt.status === "completed" && <Badge variant="secondary" className="text-[10px] bg-gold/10 text-gold border-gold/20">Completed</Badge>}
                                {apt.status === "no_show" && <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">No Show</Badge>}
                              </div>
                              {apt.title && <p className="text-xs font-medium text-foreground">{apt.title}</p>}
                              {apt.assistantNotes && <p className="text-xs text-muted-foreground mt-1">{apt.assistantNotes}</p>}

                              {apt.status !== "cancelled" && apt.status !== "completed" && (
                                <div className="flex items-center gap-2 mt-3">
                                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1"
                                    onClick={() => {
                                      if (apt.location?.toLowerCase().includes("http")) {
                                        window.open(apt.location, "_blank");
                                      } else {
                                        toast.info("Video call link not set for this appointment");
                                      }
                                    }}
                                  >
                                    <Video className="h-3 w-3" /> Start Call
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={() => openEditAppt(apt)}>
                                    <Edit3 className="h-3 w-3" /> Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => setShowCancel(apt)}>
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── New Appointment Dialog ────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">New Appointment</DialogTitle>
            <DialogDescription>Schedule an appointment with a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={createForm.patientId} onValueChange={v => setCreateForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Monthly Check-in" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={createForm.type} onValueChange={v => setCreateForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeStyles).map(([key, style]) => (
                      <SelectItem key={key} value={key}>{style.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={createForm.durationMinutes} onChange={e => setCreateForm(f => ({ ...f, durationMinutes: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Date *</Label>
                <Input type="date" value={createForm.date} onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Time *</Label>
                <Input type="time" value={createForm.time} onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Location / Video Link</Label>
              <Input value={createForm.location} onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g., https://zoom.us/j/... or Office" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Appointment notes..." className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* ── Edit Appointment Dialog ──────────── */}
      <Dialog open={showEditAppt !== null} onOpenChange={() => setShowEditAppt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Appointment</DialogTitle>
            <DialogDescription>
              {showEditAppt && `Editing appointment for ${getPatientName(showEditAppt)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={editApptForm.title} onChange={e => setEditApptForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={editApptForm.type} onValueChange={v => setEditApptForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeStyles).map(([key, style]) => (
                      <SelectItem key={key} value={key}>{style.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editApptForm.status} onValueChange={v => setEditApptForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={editApptForm.date} onChange={e => setEditApptForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={editApptForm.time} onChange={e => setEditApptForm(f => ({ ...f, time: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={editApptForm.durationMinutes} onChange={e => setEditApptForm(f => ({ ...f, durationMinutes: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Video Link / Location</Label>
                <Input value={editApptForm.location} onChange={e => setEditApptForm(f => ({ ...f, location: e.target.value }))} placeholder="https://zoom.us/j/... or Office" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes / Details</Label>
              <Textarea value={editApptForm.notes} onChange={e => setEditApptForm(f => ({ ...f, notes: e.target.value }))} placeholder="Appointment notes..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAppt(null)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black gap-1.5" onClick={handleEditAppt} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirmation Dialog ───────── */}
      <Dialog open={showCancel !== null} onOpenChange={() => setShowCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Cancel Appointment</DialogTitle>
            <DialogDescription>
              {showCancel && `Are you sure you want to cancel the appointment "${showCancel.title || "appointment"}" for ${getPatientName(showCancel)}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(null)}>Keep Appointment</Button>
            <Button variant="destructive" onClick={() => showCancel && cancelMutation.mutate({ id: showCancel.id, status: "cancelled" })} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
