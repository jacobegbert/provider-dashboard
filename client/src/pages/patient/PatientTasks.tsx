// PatientTasks.tsx — Black Label Medicine Patient Tasks
// Design: The Row — Quiet luxury, editorial minimalism
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useViewAs } from "@/contexts/ViewAsContext";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  high: { label: "High", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  medium: { label: "Medium", color: "text-muted-foreground bg-muted/50 border-border/40" },
  low: { label: "Low", color: "text-muted-foreground/60 bg-muted/30 border-border/30" },
};

export default function PatientTasks() {
  const { user } = useAuth();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined,
  );
  const myRecord = myRecordQuery.data;
  const patientId = myRecord?.id;

  const tasksQuery = trpc.clientTask.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId },
  );
  const tasks = tasksQuery.data || [];

  const utils = trpc.useUtils();
  const completeMutation = trpc.clientTask.complete.useMutation({
    onSuccess: () => {
      if (patientId) utils.clientTask.list.invalidate({ patientId });
      toast.success("Task completed");
    },
    onError: (err) => toast.error(err.message),
  });
  const uncompleteMutation = trpc.clientTask.uncomplete.useMutation({
    onSuccess: () => {
      if (patientId) utils.clientTask.list.invalidate({ patientId });
      toast.success("Task reopened");
    },
    onError: (err) => toast.error(err.message),
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const pendingTasks = tasks.filter((t: any) => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t: any) => t.status === "completed");

  const firstName = myRecord?.firstName || user?.name?.split(" ")[0] || "there";

  if (myRecordQuery.isLoading || tasksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="font-heading text-2xl md:text-3xl tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base leading-relaxed max-w-xl">
          Tasks assigned by your care team. Tap a task to see details, then mark it complete when done.
        </p>
      </motion.div>

      {/* Progress summary */}
      {tasks.length > 0 && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-card rounded-sm border border-border/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium tracking-wide">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedTasks.length} of {tasks.length} complete
              </span>
            </div>
            <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-700 ease-out"
                style={{ width: `${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Active tasks */}
      {pendingTasks.length === 0 && completedTasks.length === 0 ? (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-card rounded-sm border border-border/40 p-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your care team will add tasks here when needed.</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {pendingTasks.map((task: any, idx: number) => {
            const isExpanded = expandedId === task.id;
            const isToggling = completeMutation.isPending && completeMutation.variables?.id === task.id;
            const priority = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

            return (
              <motion.div
                key={task.id}
                custom={idx + 2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <div
                  className={`bg-card rounded-sm border transition-all duration-300 ${
                    isExpanded ? "border-gold/30 shadow-sm" : "border-border/40 hover:border-border"
                  }`}
                >
                  {/* Task row — clickable to expand */}
                  <button
                    className="w-full flex items-start gap-4 p-4 md:p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Circle className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                        {task.priority !== "medium" && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${priority.color}`}>
                            {priority.label}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] font-medium text-red-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-muted-foreground/40">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-border/30">
                      {task.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-4">
                          {task.description}
                        </p>
                      )}
                      {!task.description && (
                        <div className="h-3" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isToggling) completeMutation.mutate({ id: task.id });
                        }}
                        disabled={isToggling}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-gold/10 text-gold hover:bg-gold/20 text-sm font-medium tracking-wide transition-colors duration-200 disabled:opacity-50"
                      >
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <motion.div custom={pendingTasks.length + 3} variants={fadeUp} initial="hidden" animate="visible">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="tracking-wide">Completed ({completedTasks.length})</span>
          </button>

          {showCompleted && (
            <div className="space-y-1.5">
              {completedTasks.map((task: any) => {
                const isToggling = uncompleteMutation.isPending && uncompleteMutation.variables?.id === task.id;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-3.5 md:p-4 rounded-sm border border-gold/20 bg-gold/[0.02] group"
                  >
                    <button
                      onClick={() => {
                        if (!isToggling) uncompleteMutation.mutate({ id: task.id });
                      }}
                      disabled={isToggling}
                      className="shrink-0"
                      title="Reopen task"
                    >
                      {isToggling ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-gold" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gold line-through">{task.title}</p>
                      {task.completedAt && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Completed {new Date(task.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
