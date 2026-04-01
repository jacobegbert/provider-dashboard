// PatientProtocols.tsx — Black Label Medicine Patient Protocols
// Full protocol view with step-by-step completion tracking
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Leaf,
  Dumbbell,
  Moon,
  Pill,
  Loader2,
  Beaker,
  Brain,
  Sparkles,
  Flame,
  Droplets,
  Syringe,
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PenLine, FileText, CheckCheck } from "lucide-react";
import { useViewAs } from "@/contexts/ViewAsContext";

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

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-gold/15 text-gold" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

function getLocalDateStr(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PatientProtocols() {
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const patientId = myRecordQuery.data?.id;
  const assignmentsQuery = trpc.assignment.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const utils = trpc.useUtils();
  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      if (patientId) utils.assignment.listForPatient.invalidate({ patientId });
    },
    onError: (err) => toast.error(err.message),
  });
  const uncompleteMutation = trpc.task.uncomplete.useMutation({
    onSuccess: () => {
      if (patientId) utils.assignment.listForPatient.invalidate({ patientId });
    },
    onError: (err) => toast.error(err.message),
  });
  const completeAllMutation = trpc.task.completeAll.useMutation({
    onSuccess: (data) => {
      if (patientId) utils.assignment.listForPatient.invalidate({ patientId });
      toast.success(`All steps completed!`);
    },
    onError: (err) => toast.error(err.message),
  });

  const assignments = assignmentsQuery.data || [];
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isLoading = myRecordQuery.isLoading || assignmentsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-5 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">My Protocols</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Your personalized health optimization plans</p>
        </div>
        <Link href="/patient/protocols/create">
          <Button size="sm" className="bg-gold hover:bg-gold-light text-black shrink-0">
            <PenLine className="w-4 h-4 mr-1.5" /> Create Protocol
          </Button>
        </Link>
      </div>

      {/* My Created Protocols */}
      <MyCreatedProtocols />

      {assignments.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-7 h-7 text-gold" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No Protocols Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your provider will assign personalized protocols based on your health goals. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((row: any) => {
            const assignment = row.assignment;
            const protocol = row.protocol;
            const steps = row.steps || [];
            const completions = row.completions || [];
            if (!protocol) return null;
            const isExpanded = expandedId === assignment.id;
            const cat = categoryConfig[protocol.category] || categoryConfig.other;
            const badge = statusBadge[assignment.status] || statusBadge.active;
            const CatIcon = cat.icon;

            // Calculate today's completion status
            const todayStr = getLocalDateStr();
            const todayCompletions = completions.filter((c: any) => c.taskDate === todayStr);
            const todayCompletedStepIds = new Set(todayCompletions.map((c: any) => c.stepId));

            // Filter steps that are active today based on frequency
            const now = new Date();
            const localDayOfWeek = now.getDay(); // 0=Sun … 6=Sat in local tz
            const activeSteps = steps.filter((step: any) => {
              if (step.frequency === "once") return true;
              if (step.frequency === "daily") return true;
              if (step.frequency === "weekly") {
                return localDayOfWeek === 1; // Monday
              }
              if (step.frequency === "custom" && step.customDays) {
                const days = typeof step.customDays === "string" ? JSON.parse(step.customDays) : step.customDays;
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                const todayFull = dayNames[localDayOfWeek];
                const todayShort = shortDayNames[localDayOfWeek];
                return days.some((d: string) => d.toLowerCase() === todayFull.toLowerCase() || d.toLowerCase() === todayShort);
              }
              return true;
            });

            const todayTotal = activeSteps.length;
            const todayDone = activeSteps.filter((s: any) => todayCompletedStepIds.has(s.id)).length;
            const todayProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

            // Overall progress based on weeks
            const startDate = assignment.startDate ? new Date(assignment.startDate) : new Date(assignment.createdAt);
            const durationWeeks = protocol.durationDays ? Math.ceil(protocol.durationDays / 7) : 12;
            const weeksElapsed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
            const overallProgress = assignment.status === "completed" ? 100 : Math.min(Math.round((weeksElapsed / durationWeeks) * 100), 99);

            return (
              <motion.div
                key={assignment.id}
                layout
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Protocol header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                  className="w-full p-4 md:p-5 flex items-start gap-3 md:gap-4 text-left"
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <CatIcon className={`w-5 h-5 md:w-6 md:h-6 ${cat.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-sm md:text-base font-semibold text-foreground">{protocol.name}</h3>
                      <span className={`text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{protocol.description}</p>

                    {/* Today's progress */}
                    {assignment.status === "active" && todayTotal > 0 && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            Today: {todayDone}/{todayTotal} steps done
                          </span>
                          <span className="text-[10px] md:text-xs font-semibold text-gold">{todayProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              todayProgress === 100 ? "bg-gold" : todayProgress > 0 ? "bg-gold/70" : "bg-muted-foreground/20"
                            }`}
                            style={{ width: `${todayProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Overall timeline */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          Week {Math.min(weeksElapsed, durationWeeks)}/{durationWeeks}
                        </span>
                        <span className="text-[10px] md:text-xs text-muted-foreground">{overallProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/30 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded content with step completion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-4">
                        {/* Today's checklist */}
                        {assignment.status === "active" && activeSteps.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Today's Checklist
                              </p>
                              {todayDone < todayTotal && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs gap-1.5 text-gold hover:text-gold hover:bg-gold/10"
                                  disabled={completeAllMutation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const uncompleted = activeSteps
                                      .filter((s: any) => !todayCompletedStepIds.has(s.id))
                                      .map((s: any) => s.id);
                                    if (uncompleted.length > 0) {
                                      completeAllMutation.mutate({
                                        assignmentId: assignment.id,
                                        patientId: patientId!,
                                        taskDate: todayStr,
                                        stepIds: uncompleted,
                                      });
                                    }
                                  }}
                                >
                                  {completeAllMutation.isPending && completeAllMutation.variables?.assignmentId === assignment.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                  )}
                                  Complete All
                                </Button>
                              )}
                            </div>
                            <div className="space-y-1">
                              {activeSteps.map((step: any) => {
                                const isCompleted = todayCompletedStepIds.has(step.id);
                                const isToggling =
                                  (completeMutation.isPending && completeMutation.variables?.stepId === step.id) ||
                                  (uncompleteMutation.isPending && uncompleteMutation.variables?.stepId === step.id);

                                return (
                                  <button
                                    key={step.id}
                                    onClick={() => {
                                      if (isToggling) return;
                                      if (isCompleted) {
                                        uncompleteMutation.mutate({
                                          assignmentId: assignment.id,
                                          stepId: step.id,
                                          taskDate: todayStr,
                                        });
                                      } else {
                                        completeMutation.mutate({
                                          assignmentId: assignment.id,
                                          stepId: step.id,
                                          patientId: patientId!,
                                          taskDate: todayStr,
                                        });
                                      }
                                    }}
                                    className={`w-full flex items-start gap-3 py-2.5 px-3 rounded-lg text-left transition-colors ${
                                      isCompleted
                                        ? "bg-gold/5 hover:bg-gold/10"
                                        : "hover:bg-muted/50"
                                    }`}
                                  >
                                    <div className="shrink-0 mt-0.5">
                                      {isToggling ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                      ) : isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-gold" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-muted-foreground/40" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium break-words ${isCompleted ? "text-gold line-through" : "text-foreground"}`}>
                                        {step.title}
                                      </p>
                                      {step.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 break-words">{step.description}</p>
                                      )}
                                      {(step.dosageAmount || step.dosageUnit) && (
                                        <p className="text-xs text-gold mt-0.5 font-medium">{[step.dosageAmount, step.dosageUnit].filter(Boolean).join(" ")}</p>
                                      )}
                                      {step.route && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">Route: {step.route}</p>
                                      )}
                                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        {step.timeOfDay && step.timeOfDay !== "any" && (
                                          <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {step.timeOfDay}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {step.frequency?.replace("_", " ") || "Daily"}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* All steps (when not active or no active steps today) */}
                        {(assignment.status !== "active" || activeSteps.length === 0) && steps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                              Protocol Steps ({steps.length})
                            </p>
                            <div className="space-y-1">
                              {steps.map((step: any, idx: number) => (
                                <div key={step.id} className="flex items-start gap-3 py-2">
                                  <div className="flex flex-col items-center shrink-0">
                                    <div className="w-5 h-5 rounded-full border-2 border-gold/40 flex items-center justify-center">
                                      <span className="text-[9px] text-gold font-medium">{idx + 1}</span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                      <div className="w-0.5 h-6 mt-1 bg-border" />
                                    )}
                                  </div>
                                  <div className="flex-1 -mt-0.5 min-w-0">
                                    <p className="text-sm font-medium text-foreground break-words">{step.title}</p>
                                    {step.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 break-words">{step.description}</p>
                                    )}
                                    {step.dosage && (
                                      <p className="text-xs text-gold mt-0.5 font-medium">{step.dosage}</p>
                                    )}
                                    {step.administrationRoute && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">Route: {step.administrationRoute}</p>
                                    )}
                                    {step.timeOfDay && step.timeOfDay !== "any" && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">Time: {step.timeOfDay}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {step.frequency?.replace("_", " ") || "Daily"}
                                      </span>
                                      {step.customDays && (
                                        <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                                          {(typeof step.customDays === "string" ? JSON.parse(step.customDays) : step.customDays)
                                            .map((d: string) => d.slice(0, 3))
                                            .join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {steps.length === 0 && (
                          <p className="text-sm text-muted-foreground">Protocol details will be provided by your provider.</p>
                        )}

                        {/* Provider notes */}
                        {assignment.providerNotes && (
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Provider Notes</p>
                            <p className="text-sm text-foreground">{assignment.providerNotes}</p>
                          </div>
                        )}

                        {/* Info row */}
                        <div className="flex items-center gap-4 pt-2 border-t border-border flex-wrap">
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            Started: {new Date(assignment.startDate || assignment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {assignment.endDate && (
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              Ends: {new Date(assignment.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          <span className="text-[10px] md:text-xs text-muted-foreground">Duration: {durationWeeks} weeks</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground capitalize">Category: {protocol.category?.replace("_", " ")}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyCreatedProtocols() {
  const { data: myProtocols, isLoading } = trpc.protocol.listMyCreated.useQuery();

  if (isLoading || !myProtocols || myProtocols.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gold" />
        <h2 className="font-heading text-sm font-semibold text-foreground">
          My Created Protocols ({myProtocols.length})
        </h2>
      </div>
      <div className="space-y-2">
        {myProtocols.map((p: any) => {
          const cat = categoryConfig[p.category] || categoryConfig.other;
          const CatIcon = cat.icon;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                <CatIcon className={`w-4 h-4 ${cat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
