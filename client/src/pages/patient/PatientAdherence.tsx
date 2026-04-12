// PatientAdherence.tsx — Black Label Medicine Adherence Detail
// Design: The Row — Quiet luxury, editorial minimalism
// Calendar view showing daily adherence with step-level detail
import { trpc } from "@/lib/trpc";
import { useViewAs } from "@/contexts/ViewAsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Calendar,
  Syringe,
  Pill,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const GROUP_LABELS: Record<string, string> = {
  peptides: "Peptides & Hormones",
  supplements: "Supplements",
  lifestyle: "Lifestyle",
};

// Map protocol category → adherence group (mirrors server logic)
const CATEGORY_TO_GROUP: Record<string, string> = {
  peptides: "peptides",
  hormone: "peptides",
  supplement: "supplements",
  nutrition: "supplements",
  exercise: "lifestyle",
  sleep: "lifestyle",
  stress: "lifestyle",
  lifestyle: "lifestyle",
  lab_work: "lifestyle",
  other: "lifestyle",
};

const GROUP_ICONS: Record<string, typeof Syringe> = {
  peptides: Syringe,
  supplements: Pill,
  lifestyle: Sparkles,
};

const GROUP_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  peptides: { dot: "bg-orange-400", text: "text-orange-500", bg: "bg-orange-50" },
  supplements: { dot: "bg-blue-400", text: "text-blue-500", bg: "bg-blue-50" },
  lifestyle: { dot: "bg-emerald-400", text: "text-emerald-500", bg: "bg-emerald-50" },
};

function getLocalDateStr(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function PatientAdherence() {
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const patientId = myRecordQuery.data?.id;

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

  // Date range for current month
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

  // Adherence stats for the summary header
  const statsQuery = trpc.assignment.adherenceStats.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  // Mutations for retroactive editing
  const utils = trpc.useUtils();
  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      if (patientId) {
        utils.task.completionHistory.invalidate({ patientId, startDate: monthStart, endDate: monthEnd });
        utils.assignment.listForPatient.invalidate({ patientId });
        utils.assignment.adherenceStats.invalidate({ patientId });
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const uncompleteMutation = trpc.task.uncomplete.useMutation({
    onSuccess: () => {
      if (patientId) {
        utils.task.completionHistory.invalidate({ patientId, startDate: monthStart, endDate: monthEnd });
        utils.assignment.listForPatient.invalidate({ patientId });
        utils.assignment.adherenceStats.invalidate({ patientId });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const assignments = assignmentsQuery.data || [];
  const completionHistory = completionHistoryQuery.data || [];
  const stats = statsQuery.data;
  const now = new Date();
  const todayStr = getLocalDateStr(now);

  // Build completion map: date -> set of completed step IDs
  const completionsByDate = useMemo(() => {
    const map: Record<string, { total: number; stepIds: Set<number> }> = {};
    completionHistory.forEach((c: any) => {
      if (!map[c.taskDate]) map[c.taskDate] = { total: 0, stepIds: new Set() };
      map[c.taskDate].total++;
      map[c.taskDate].stepIds.add(c.stepId);
    });
    return map;
  }, [completionHistory]);

  // Helper: determine which steps are active on a given date
  function getActiveStepsForDate(steps: any[], dateStr: string) {
    const dateObj = new Date(dateStr + "T12:00:00");
    const dayOfWeek = dateObj.getDay();
    const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return steps.filter((step: any) => {
      if (step.frequency === "once") return true;
      if (step.frequency === "daily") return true;
      if (step.frequency === "as_needed") return false;
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

  // For each day in the month, compute expected vs completed for calendar coloring
  const dailyAdherence = useMemo(() => {
    const map: Record<string, { expected: number; completed: number; pct: number }> = {};
    if (assignments.length === 0) return map;

    // Build all dates in the visible month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = getLocalDateStr(d);
      // Only compute for past/today
      if (d > now && dateStr !== todayStr) continue;

      let expected = 0;
      let completed = 0;
      const doneSet = completionsByDate[dateStr]?.stepIds || new Set<number>();

      for (const row of assignments) {
        if (row.assignment.status !== "active") continue;
        const assignedDate = getLocalDateStr(new Date(row.assignment.startDate));
        if (assignedDate > dateStr) continue;

        const activeSteps = getActiveStepsForDate(row.steps || [], dateStr);
        expected += activeSteps.length;
        completed += activeSteps.filter((s: any) => doneSet.has(s.id)).length;
      }

      if (expected > 0) {
        map[dateStr] = { expected, completed, pct: Math.round((completed / expected) * 100) };
      }
    }
    return map;
  }, [assignments, currentMonth, completionsByDate, now, todayStr]);

  // Day detail for selected date
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;

    const dayCompletions = completionHistory.filter((c: any) => c.taskDate === selectedDate);
    const completedByAssignment: Record<number, Set<number>> = {};
    dayCompletions.forEach((c: any) => {
      if (!completedByAssignment[c.assignmentId]) completedByAssignment[c.assignmentId] = new Set();
      completedByAssignment[c.assignmentId].add(c.stepId);
    });

    const selectedDateObj = new Date(selectedDate + "T12:00:00");
    const isPastOrToday = selectedDateObj <= now || selectedDate === todayStr;

    const protocolSummaries = assignments
      .filter((row: any) => {
        if (row.assignment.status !== "active") return false;
        const assignedDate = getLocalDateStr(new Date(row.assignment.startDate));
        return assignedDate <= selectedDate;
      })
      .map((row: any) => {
        const activeSteps = getActiveStepsForDate(row.steps || [], selectedDate);
        if (activeSteps.length === 0) return null;
        const completedStepIds = completedByAssignment[row.assignment.id] || new Set();
        const completedCount = activeSteps.filter((s: any) => completedStepIds.has(s.id)).length;

        // Group steps by derived group (from protocol category)
        const derivedGroup = CATEGORY_TO_GROUP[row.protocol.category] || "lifestyle";
        const byGroup: Record<string, { steps: any[]; completedIds: Set<number> }> = {};
        for (const step of activeSteps) {
          const grp = step.stepGroup || derivedGroup;
          if (!byGroup[grp]) byGroup[grp] = { steps: [], completedIds: new Set() };
          byGroup[grp].steps.push(step);
          if (completedStepIds.has(step.id)) byGroup[grp].completedIds.add(step.id);
        }

        return {
          protocol: row.protocol,
          assignment: row.assignment,
          steps: activeSteps,
          completedStepIds,
          completedCount,
          totalActive: activeSteps.length,
          byGroup,
        };
      })
      .filter(Boolean);

    return { protocolSummaries, isPastOrToday };
  }, [selectedDate, completionHistory, assignments, todayStr, now]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date: d, dateStr: getLocalDateStr(d), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: getLocalDateStr(d), isCurrentMonth: true });
    }
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

  const toggleStep = (assignmentId: number, stepId: number, dateStr: string, isCompleted: boolean) => {
    if (completeMutation.isPending || uncompleteMutation.isPending) return;
    if (isCompleted) {
      uncompleteMutation.mutate({ assignmentId, stepId, taskDate: dateStr });
    } else {
      completeMutation.mutate({ assignmentId, stepId, patientId: patientId!, taskDate: dateStr });
    }
  };

  const isLoading = myRecordQuery.isLoading || assignmentsQuery.isLoading;
  const isMutating = completeMutation.isPending || uncompleteMutation.isPending;
  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  // Overall ring color
  const overallPct = stats?.overall?.pct ?? 0;
  const ringColor =
    overallPct >= 85 ? "text-gold" :
    overallPct >= 70 ? "text-amber-400" :
    "text-red-400";

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Header with back link */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <Link href="/patient">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase cursor-pointer mb-3">
            <ArrowLeft className="w-3 h-3" strokeWidth={1.4} /> Dashboard
          </span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl tracking-tight">Adherence</h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed max-w-xl">
              Review your protocol adherence by day. Tap any past date to see which steps were completed or missed.
            </p>
          </div>
          {stats && stats.overall.expected > 0 && (
            <div className="text-right hidden md:block">
              <span className={`font-heading text-4xl tracking-tight ${ringColor}`}>
                {overallPct}%
              </span>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">30-Day Average</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Category summary bars */}
      {stats && stats.categories.length > 0 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.categories.map((cat: any) => {
              const colors = GROUP_COLORS[cat.name] || GROUP_COLORS.lifestyle;
              const Icon = GROUP_ICONS[cat.name] || Sparkles;
              return (
                <div key={cat.name} className="bg-card rounded-sm border border-border/40 p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-md ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${colors.text}`} strokeWidth={1.6} />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {GROUP_LABELS[cat.name] || cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${colors.dot}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      cat.pct >= 85 ? "text-foreground" :
                      cat.pct >= 70 ? "text-amber-500" :
                      "text-red-400"
                    }`}>
                      {cat.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Calendar + Day Detail */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-sm border border-border/40 overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border/30">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <h2 className="font-heading text-sm md:text-base font-medium text-foreground tracking-wide">
                  {monthLabel}
                </h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border/30">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid — color-coded by adherence */}
              <div className="grid grid-cols-7">
                {calendarDays.map(({ date, dateStr, isCurrentMonth }, idx) => {
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const adherence = dailyAdherence[dateStr];
                  const isPastOrToday = date <= now || isToday;
                  const isClickable = isCurrentMonth && isPastOrToday && !!adherence;

                  // Color by adherence percentage
                  let bgColor = "";
                  if (adherence && isCurrentMonth) {
                    if (adherence.pct >= 85) bgColor = "bg-gold/15";
                    else if (adherence.pct >= 50) bgColor = "bg-amber-400/15";
                    else if (adherence.pct > 0) bgColor = "bg-red-400/15";
                    else bgColor = "bg-red-400/10";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isClickable) setSelectedDate(isSelected ? null : dateStr);
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors border-b border-r border-border/20 ${
                        !isCurrentMonth
                          ? "text-muted-foreground/25"
                          : isSelected
                            ? "ring-2 ring-inset ring-gold/50 bg-gold/10 text-foreground"
                            : isClickable
                              ? `${bgColor} hover:ring-1 hover:ring-inset hover:ring-gold/30 cursor-pointer text-foreground`
                              : adherence
                                ? `${bgColor} text-foreground`
                                : "text-foreground/50"
                      }`}
                    >
                      <span
                        className={`text-xs md:text-sm font-medium ${
                          isToday
                            ? "bg-foreground text-background w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {/* Adherence percentage indicator */}
                      {adherence && isCurrentMonth && (
                        <span className={`text-[8px] md:text-[9px] font-medium ${
                          adherence.pct >= 85 ? "text-gold" :
                          adherence.pct >= 50 ? "text-amber-500" :
                          "text-red-400"
                        }`}>
                          {adherence.pct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 md:px-5 py-2.5 border-t border-border/30 bg-muted/10 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gold/20 border border-gold/30" />
                  <span className="text-[10px] text-muted-foreground">85%+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400/20 border border-amber-400/30" />
                  <span className="text-[10px] text-muted-foreground">50–84%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-400/20 border border-red-400/30" />
                  <span className="text-[10px] text-muted-foreground">&lt;50%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-muted/30 border border-border/30" />
                  <span className="text-[10px] text-muted-foreground">No data</span>
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
                  className="bg-card rounded-sm border border-border/40 overflow-hidden"
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                      <h3 className="font-heading text-lg font-medium text-foreground">
                        {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {dailyAdherence[selectedDate] && (
                        <span className={`text-lg font-heading font-medium ${
                          dailyAdherence[selectedDate].pct >= 85 ? "text-gold" :
                          dailyAdherence[selectedDate].pct >= 50 ? "text-amber-500" :
                          "text-red-400"
                        }`}>
                          {dailyAdherence[selectedDate].pct}%
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="p-1.5 rounded hover:bg-muted/50 transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {selectedDayData.protocolSummaries.length > 0 ? (
                      selectedDayData.protocolSummaries.map((summary: any) => (
                        <div key={summary.assignment.id} className="space-y-3">
                          {/* Protocol header */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground">{summary.protocol.name}</p>
                            <span className={`text-[10px] font-medium ${
                              summary.completedCount === summary.totalActive ? "text-gold" : "text-muted-foreground"
                            }`}>
                              {summary.completedCount}/{summary.totalActive}
                            </span>
                          </div>

                          {/* Steps grouped by category */}
                          {Object.entries(summary.byGroup).map(([groupName, group]: [string, any]) => {
                            const colors = GROUP_COLORS[groupName] || GROUP_COLORS.lifestyle;
                            const Icon = GROUP_ICONS[groupName] || Sparkles;
                            return (
                              <div key={groupName} className="space-y-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Icon className={`w-3 h-3 ${colors.text}`} strokeWidth={1.6} />
                                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                                    {GROUP_LABELS[groupName] || groupName}
                                  </span>
                                </div>
                                {group.steps.map((step: any) => {
                                  const done = summary.completedStepIds.has(step.id);
                                  const canEdit = selectedDayData.isPastOrToday;
                                  return (
                                    <button
                                      key={step.id}
                                      onClick={() => {
                                        if (canEdit) toggleStep(summary.assignment.id, step.id, selectedDate, done);
                                      }}
                                      disabled={isMutating || !canEdit}
                                      className={`flex items-center gap-2 py-1.5 px-2 w-full text-left rounded transition-colors ${
                                        canEdit ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
                                      } ${isMutating ? "opacity-60" : ""}`}
                                    >
                                      {done ? (
                                        <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-red-400/50 shrink-0" strokeWidth={1.4} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <span className={`text-xs ${done ? "text-gold" : "text-foreground"}`}>
                                          {step.title}
                                        </span>
                                        {(step.dosageAmount || step.dosageUnit) && (
                                          <span className="text-[10px] text-muted-foreground ml-1.5">
                                            {[step.dosageAmount, step.dosageUnit].filter(Boolean).join(" ")}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}

                          {/* Progress bar */}
                          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                summary.completedCount === summary.totalActive ? "bg-gold" : "bg-gold/50"
                              }`}
                              style={{ width: `${summary.totalActive > 0 ? Math.round((summary.completedCount / summary.totalActive) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No protocols active on this day</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-sm border border-border/40 p-6 md:p-8 text-center"
                >
                  <div className="w-12 h-12 rounded-md bg-gold/10 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-heading text-base font-medium text-foreground mb-1">
                    Daily Breakdown
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Tap any day on the calendar to see exactly which steps were completed or missed. You can also edit past entries.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Flagged items from stats */}
      {stats && stats.flagged.length > 0 && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-card rounded-sm border border-border/40 p-5">
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-3">
              Needs Attention (Last 14 Days)
            </p>
            <div className="space-y-1.5">
              {stats.flagged.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded bg-muted/30 border border-border/30"
                >
                  <span className="text-xs text-foreground truncate flex-1 mr-3">{item.title}</span>
                  <span className="text-[10px] text-red-400 font-medium shrink-0">
                    {item.pct}% · {item.missed}/{item.outOf} missed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
