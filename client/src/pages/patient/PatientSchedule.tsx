// PatientSchedule.tsx — Black Label Medicine Patient Schedule
// Calendar with protocol completion history + upcoming appointments
// Supports retroactive editing of protocol completions on past dates
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  CalendarPlus,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Circle,
  Leaf,
  Dumbbell,
  Moon,
  Pill,
  Sparkles,
  Flame,
  Beaker,
  Brain,
  Syringe,
  Droplets,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useViewAs } from "@/contexts/ViewAsContext";

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  follow_up: { color: "text-gold", bg: "bg-gold/10", label: "Follow-up" },
  check_in: { color: "text-gold", bg: "bg-gold/10", label: "Check-in" },
  lab_work: { color: "text-red-400", bg: "bg-red-500/10", label: "Lab Work" },
  initial: { color: "text-violet-600", bg: "bg-violet-50", label: "Initial" },
  urgent: { color: "text-red-600", bg: "bg-red-50", label: "Urgent" },
};

const categoryConfig: Record<string, { icon: typeof Leaf; color: string; bg: string }> = {
  nutrition: { icon: Leaf, color: "text-gold", bg: "bg-gold/10" },
  peptides: { icon: Syringe, color: "text-orange-600", bg: "bg-orange-50" },
  exercise: { icon: Dumbbell, color: "text-red-400", bg: "bg-red-500/10" },
  movement: { icon: Dumbbell, color: "text-red-400", bg: "bg-red-500/10" },
  lifestyle: { icon: Sparkles, color: "text-gold", bg: "bg-gold/10" },
  sleep: { icon: Moon, color: "text-gold", bg: "bg-gold/10" },
  supplement: { icon: Pill, color: "text-violet-600", bg: "bg-violet-50" },
  hormone: { icon: Flame, color: "text-amber-600", bg: "bg-amber-50" },
  lab_work: { icon: Beaker, color: "text-pink-600", bg: "bg-pink-50" },
  stress: { icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
  other: { icon: Leaf, color: "text-gold", bg: "bg-gold/10" },
};

function getLocalDateStr(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function PatientSchedule() {
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const patientId = myRecordQuery.data?.id;

  const appointmentsQuery = trpc.appointment.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const assignmentsQuery = trpc.assignment.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate date range for the visible month (for completion history query)
  const monthStart = useMemo(() => {
    const d = new Date(currentMonth);
    d.setDate(1);
    return getLocalDateStr(d);
  }, [currentMonth]);
  const monthEnd = useMemo(() => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return getLocalDateStr(d);
  }, [currentMonth]);

  const completionHistoryQuery = trpc.task.completionHistory.useQuery(
    { patientId: patientId!, startDate: monthStart, endDate: monthEnd },
    { enabled: !!patientId }
  );

  // Mutations for retroactive editing
  const utils = trpc.useUtils();
  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      if (patientId) {
        utils.task.completionHistory.invalidate({ patientId, startDate: monthStart, endDate: monthEnd });
        utils.assignment.listForPatient.invalidate({ patientId });
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const uncompleteMutation = trpc.task.uncomplete.useMutation({
    onSuccess: () => {
      if (patientId) {
        utils.task.completionHistory.invalidate({ patientId, startDate: monthStart, endDate: monthEnd });
        utils.assignment.listForPatient.invalidate({ patientId });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const appointments = appointmentsQuery.data || [];
  const assignments = assignmentsQuery.data || [];
  const completionHistory = completionHistoryQuery.data || [];
  const isLoading = myRecordQuery.isLoading || appointmentsQuery.isLoading;

  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const upcoming = appointments
    .filter((a: any) => {
      const isScheduled = a.status === "scheduled" || a.status === "confirmed";
      const isFuture = new Date(a.scheduledAt).getTime() > now.getTime();
      return isScheduled && isFuture;
    })
    .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Build a map of date -> completion data for the calendar
  const completionsByDate = useMemo(() => {
    const map: Record<string, { total: number; stepIds: Set<number>; assignmentIds: Set<number> }> = {};
    completionHistory.forEach((c: any) => {
      if (!map[c.taskDate]) {
        map[c.taskDate] = { total: 0, stepIds: new Set(), assignmentIds: new Set() };
      }
      map[c.taskDate].total++;
      map[c.taskDate].stepIds.add(c.stepId);
      map[c.taskDate].assignmentIds.add(c.assignmentId);
    });
    return map;
  }, [completionHistory]);

  // Build appointment map by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((a: any) => {
      const dateStr = getLocalDateStr(new Date(a.scheduledAt));
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(a);
    });
    return map;
  }, [appointments]);

  // Helper: determine which steps are active on a given date for an assignment
  function getActiveStepsForDate(steps: any[], dateStr: string) {
    const dateObj = new Date(dateStr + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return steps.filter((step: any) => {
      if (step.frequency === "once") return true;
      if (step.frequency === "daily") return true;
      if (step.frequency === "as_needed") return true;
      if (step.frequency === "weekly") return dayOfWeek === 1;
      if (step.frequency === "monthly") return dateObj.getDate() === 1;
      if (step.frequency === "custom" && step.customDays) {
        const days = typeof step.customDays === "string" ? JSON.parse(step.customDays) : step.customDays;
        return days.some(
          (d: string) =>
            d.toLowerCase() === dayNames[dayOfWeek].toLowerCase() ||
            d.toLowerCase() === shortDayNames[dayOfWeek]
        );
      }
      return true;
    });
  }

  // Build day detail data for the selected date — now shows ALL assigned protocols, not just ones with completions
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;

    const dayCompletions = completionHistory.filter((c: any) => c.taskDate === selectedDate);
    const dayAppointments = appointmentsByDate[selectedDate] || [];

    // Build a set of completed step IDs per assignment for this date
    const completedByAssignment: Record<number, Set<number>> = {};
    dayCompletions.forEach((c: any) => {
      if (!completedByAssignment[c.assignmentId]) {
        completedByAssignment[c.assignmentId] = new Set();
      }
      completedByAssignment[c.assignmentId].add(c.stepId);
    });

    // Show ALL active assignments (not just ones with completions)
    const selectedDateObj = new Date(selectedDate + "T12:00:00");
    const isPastOrToday = selectedDateObj <= now || selectedDate === todayStr;

    const protocolSummaries = assignments
      .filter((row: any) => {
        // Only show active assignments that were assigned before or on the selected date
        if (row.assignment.status !== "active") return false;
        const assignedDate = getLocalDateStr(new Date(row.assignment.assignedAt));
        return assignedDate <= selectedDate;
      })
      .map((row: any) => {
        const activeSteps = getActiveStepsForDate(row.steps || [], selectedDate);
        if (activeSteps.length === 0) return null;

        const completedStepIds = completedByAssignment[row.assignment.id] || new Set();
        const completedCount = activeSteps.filter((s: any) => completedStepIds.has(s.id)).length;

        return {
          protocol: row.protocol,
          assignment: row.assignment,
          steps: activeSteps,
          completedStepIds,
          completedCount,
          totalActive: activeSteps.length,
        };
      })
      .filter(Boolean);

    return { protocolSummaries, appointments: dayAppointments, isPastOrToday };
  }, [selectedDate, completionHistory, appointmentsByDate, assignments, todayStr]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, dateStr: getLocalDateStr(d), isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: getLocalDateStr(d), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, dateStr: getLocalDateStr(d), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDate(null);
  };

  /** Toggle a step completion for a given date */
  const toggleStep = (assignmentId: number, stepId: number, dateStr: string, isCompleted: boolean) => {
    if (completeMutation.isPending || uncompleteMutation.isPending) return;
    if (isCompleted) {
      uncompleteMutation.mutate({ assignmentId, stepId, taskDate: dateStr });
    } else {
      completeMutation.mutate({
        assignmentId,
        stepId,
        patientId: patientId!,
        taskDate: dateStr,
      });
    }
  };

  /** Generate and download an .ics file for an appointment */
  const downloadICS = (apt: any) => {
    const start = new Date(apt.scheduledAt);
    const end = new Date(start.getTime() + (apt.durationMinutes || 30) * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmtDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BlackLabelMedicine//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmtDate(start)}`,
      `DTEND:${fmtDate(end)}`,
      `SUMMARY:${apt.title || "Appointment"} — Black Label Medicine`,
      `DESCRIPTION:${(apt.assistantNotes || apt.patientNotes || apt.notes || "").replace(/\n/g, "\\n")}`,
      apt.location ? `LOCATION:${apt.location}` : null,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment-${apt.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded");
  };

  /** Open Google Calendar with pre-filled event */
  const openGoogleCalendar = (apt: any) => {
    const start = new Date(apt.scheduledAt);
    const end = new Date(start.getTime() + (apt.durationMinutes || 30) * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmtGCal = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    const title = encodeURIComponent(apt.title || "Appointment — Black Label Medicine");
    const details = encodeURIComponent(apt.assistantNotes || apt.patientNotes || apt.notes || "");
    const location = encodeURIComponent(apt.location || "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmtGCal(start)}/${fmtGCal(end)}&details=${details}&location=${location}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isMutating = completeMutation.isPending || uncompleteMutation.isPending;

  return (
    <div className="px-5 md:px-8 py-5 md:py-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Schedule</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Your appointments and protocol history
        </p>
      </div>

      {/* Upcoming Appointments */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-heading text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wider mb-3 md:mb-4">
            Upcoming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {upcoming.slice(0, 4).map((apt: any, i: number) => {
              const tc = typeConfig[apt.type] || typeConfig.follow_up;
              const scheduledDate = new Date(apt.scheduledAt);
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="bg-card rounded-xl border border-border p-4 md:p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full ${tc.bg} ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                      <h3 className="font-heading text-base md:text-lg font-semibold text-foreground mt-1.5">
                        {scheduledDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
                        {apt.durationMinutes} min
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Black Label Medicine</span>
                    </div>
                  </div>
                  {apt.title && <p className="text-sm font-medium text-foreground">{apt.title}</p>}
                  {apt.location && (
                    <div className="flex items-center gap-2">
                      {apt.location.toLowerCase().includes("http") ? (
                        <a
                          href={apt.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-gold hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Video Call
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" /> {apt.location}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8 border-gold/20 text-gold hover:bg-gold/10"
                      onClick={() => openGoogleCalendar(apt)}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> Google Calendar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => downloadICS(apt)}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> Download .ics
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar + Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">{monthLabel}</h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, dateStr, isCurrentMonth }, idx) => {
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayCompletion = completionsByDate[dateStr];
                const dayAppts = appointmentsByDate[dateStr];
                const isPastOrToday = date <= now || isToday;
                const hasData = !!dayCompletion || !!dayAppts;

                // Any past/today date in the current month is clickable (for retroactive editing)
                const isClickable = isCurrentMonth && isPastOrToday;

                // Determine completion indicator color
                let dotColor = "";
                if (dayCompletion && isCurrentMonth) {
                  dotColor = "bg-gold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isClickable) {
                        setSelectedDate(isSelected ? null : dateStr);
                      }
                    }}
                    className={`relative aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors border-b border-r border-border/30 ${
                      !isCurrentMonth
                        ? "text-muted-foreground/30"
                        : isSelected
                          ? "bg-gold/10 text-gold"
                          : isToday
                            ? "bg-gold/5 text-foreground"
                            : isClickable
                              ? "hover:bg-muted/50 text-foreground cursor-pointer"
                              : "text-foreground/60"
                    }`}
                  >
                    <span
                      className={`text-xs md:text-sm font-medium ${
                        isToday ? "bg-gold text-black w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center" : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {/* Indicators row */}
                    <div className="flex items-center gap-0.5 h-2">
                      {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
                      {dayAppts && isCurrentMonth && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 md:px-5 py-2.5 border-t border-border bg-muted/20">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold" />
                <span className="text-[10px] text-muted-foreground">Protocol completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60" />
                <span className="text-[10px] text-muted-foreground">Appointment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Tap past dates to edit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedDate && selectedDayData ? (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDayData.isPastOrToday && selectedDayData.protocolSummaries.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-gold bg-gold/10 px-2 py-1 rounded-full">
                        <Pencil className="w-2.5 h-2.5" /> Editable
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Protocol summaries with interactive checkboxes */}
                  {selectedDayData.protocolSummaries.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Protocols — tap steps to update
                      </p>
                      {selectedDayData.protocolSummaries.map((summary: any) => {
                        const cat = categoryConfig[summary.protocol.category] || categoryConfig.other;
                        const CatIcon = cat.icon;
                        const allDone = summary.completedCount === summary.totalActive && summary.totalActive > 0;
                        const pct =
                          summary.totalActive > 0
                            ? Math.round((summary.completedCount / summary.totalActive) * 100)
                            : 0;

                        return (
                          <div
                            key={summary.assignment.id}
                            className="rounded-lg border border-border/50 overflow-hidden"
                          >
                            {/* Protocol header */}
                            <div className="flex items-center gap-3 p-3 bg-muted/20">
                              <div
                                className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}
                              >
                                <CatIcon className={`w-4 h-4 ${cat.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {summary.protocol.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[10px] font-semibold ${allDone ? "text-gold" : "text-muted-foreground"}`}
                                  >
                                    {summary.completedCount}/{summary.totalActive} steps
                                  </span>
                                  {allDone && (
                                    <span className="text-[10px] font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                                      100%
                                    </span>
                                  )}
                                  {!allDone && pct > 0 && (
                                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                                  )}
                                </div>
                              </div>
                              {allDone && <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />}
                            </div>

                            {/* Interactive step list */}
                            <div className="px-3 py-2 space-y-0.5">
                              {summary.steps.map((step: any) => {
                                const done = summary.completedStepIds.has(step.id);
                                const canEdit = selectedDayData.isPastOrToday;
                                return (
                                  <button
                                    key={step.id}
                                    onClick={() => {
                                      if (canEdit) {
                                        toggleStep(summary.assignment.id, step.id, selectedDate, done);
                                      }
                                    }}
                                    disabled={isMutating || !canEdit}
                                    className={`flex items-center gap-2 py-1.5 px-1 w-full text-left rounded-md transition-colors ${
                                      canEdit
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "cursor-default"
                                    } ${isMutating ? "opacity-60" : ""}`}
                                  >
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs ${done ? "text-gold" : "text-muted-foreground"}`}
                                    >
                                      {step.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Progress bar */}
                            <div className="px-3 pb-2.5">
                              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${allDone ? "bg-gold" : "bg-gold/50"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Appointments for this day */}
                  {selectedDayData.appointments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Appointments
                      </p>
                      {selectedDayData.appointments.map((apt: any) => {
                        const tc = typeConfig[apt.type] || typeConfig.follow_up;
                        return (
                          <div
                            key={apt.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                              <Calendar className={`w-4 h-4 ${tc.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {apt.title || tc.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(apt.scheduledAt).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}{" "}
                                · {apt.durationMinutes} min
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                apt.status === "completed"
                                  ? "bg-gold/10 text-gold"
                                  : apt.status === "cancelled"
                                    ? "bg-red-50 text-red-500"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {selectedDayData.protocolSummaries.length === 0 &&
                    selectedDayData.appointments.length === 0 && (
                      <div className="text-center py-6">
                        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No active protocols on this day</p>
                      </div>
                    )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-xl border border-border p-6 md:p-8 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground mb-1">Protocol History</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Tap any past or current date to view and edit your protocol completions. Forgot to log a day? You can update it here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
