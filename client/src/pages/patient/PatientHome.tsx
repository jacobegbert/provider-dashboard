// PatientHome.tsx — Black Label Medicine Patient Dashboard
// Design: The Row — Quiet luxury, editorial minimalism
// Uses REAL tRPC data — no mock data
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle2, Circle, Calendar, TrendingUp, ClipboardCheck, ArrowRight, Sparkles, Loader2, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useViewAs } from "@/contexts/ViewAsContext";

const PATIENT_HERO_MASCULINE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";
const PATIENT_HERO_FEMININE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/floral-banner-therow-VaQdNMgymgTS8As8AKAXiq.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

export default function PatientHome() {
  const { user } = useAuth();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const myRecord = myRecordQuery.data;

  // Get patient-specific data once we have the patient record
  const patientId = myRecord?.id;
  const assignmentsQuery = trpc.assignment.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );
  const appointmentsQuery = trpc.appointment.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );
  const tasksQuery = trpc.clientTask.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  // Intake form query — always call at top level (Rules of Hooks)
  const intakeQuery = trpc.intake.mine.useQuery();
  const intake = intakeQuery.data;
  const intakeCompleted = intake?.status === "completed";
  const intakeProgress = intake?.completedSections
    ? Math.round(((intake.completedSections as string[]).length / 12) * 100)
    : 0;

  const isLoading = myRecordQuery.isLoading;
  const assignments = assignmentsQuery.data || [];
  const appointmentsRaw = appointmentsQuery.data || [];
  const tasks = tasksQuery.data || [];

  // Compute stats
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const totalTasks = tasks.length;
  const daysActive = myRecord?.createdAt
    ? Math.floor((Date.now() - new Date(myRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Next appointment
  const upcomingAppointments = appointmentsRaw
    .filter((row: any) => {
      return row.status === "scheduled" || row.status === "confirmed";
    })
    .sort((a: any, b: any) => {
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  const nextAptData = upcomingAppointments[0] as any;

  const isFeminine = myRecord?.sex === "female";
  const firstName = myRecord?.firstName || user?.name?.split(" ")[0] || "there";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!myRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-5">
          <ClipboardCheck className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-xl text-foreground mb-2">Welcome to Black Label Medicine</h2>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          Your patient profile is being set up. Please contact Dr. Egbert's office to get started with your personalized health optimization plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10 pb-8">
      {/* Hero greeting — editorial, cinematic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden md:rounded-sm"
      >
        <img src={isFeminine ? PATIENT_HERO_FEMININE : PATIENT_HERO_MASCULINE} alt="" className="w-full h-56 md:h-72 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <p className="text-white/50 text-[11px] tracking-[0.3em] uppercase">{dateStr}</p>
          <h1 className="font-heading text-2xl md:text-3xl font-normal text-white mt-2 tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-white/60 text-sm mt-1.5 tracking-wide">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
      </motion.div>

      {/* Intake Form CTA — shown until patient completes the form */}
      {!intakeQuery.isLoading && !intakeCompleted && (
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <Link href="/patient/intake">
            <div className="relative overflow-hidden rounded-sm border border-border/50 bg-card p-5 md:p-6 cursor-pointer hover:border-border transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-foreground" strokeWidth={1.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-heading text-sm md:text-base text-foreground">Complete Your Health Intake Form</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {intakeProgress > 0 ? `${intakeProgress}% done` : "New"}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                    {intakeProgress > 0
                      ? "Pick up where you left off — your progress is saved."
                      : "Help Dr. Egbert understand your complete health picture."}
                  </p>
                  {intakeProgress > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/40 rounded-full transition-all" style={{ width: `${intakeProgress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{intakeProgress}%</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={1.4} />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Quick stats — museum placard style */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
      >
        {[
          { label: "Protocols", value: assignments.length.toString(), icon: ClipboardCheck },
          { label: "Days Active", value: daysActive.toString(), icon: Sparkles },
          { label: "Tasks Done", value: completedTasks.toString(), icon: TrendingUp },
          { label: "Upcoming", value: upcomingAppointments.length.toString(), icon: Calendar },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i + 1}
            variants={fadeUp}
            className="bg-card rounded-sm p-4 md:p-6 border border-border/40 hover:border-border transition-colors duration-300"
          >
            <stat.icon className="w-4 h-4 text-muted-foreground mb-3" strokeWidth={1.4} />
            <p className="font-heading text-2xl md:text-3xl font-normal text-foreground tracking-tight">{stat.value}</p>
            <p className="text-[11px] md:text-xs text-muted-foreground tracking-wider uppercase mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Desktop: two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left column */}
        <div className="space-y-6 md:space-y-8">
          {/* Next appointment card */}
          {nextAptData && (
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <Link href="/patient/schedule">
                <div className="bg-card rounded-sm p-5 md:p-6 flex items-center gap-4 cursor-pointer border border-border/40 hover:border-border transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-foreground" strokeWidth={1.4} />
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Next Appointment</p>
                    <p className="text-foreground font-heading text-sm md:text-base mt-1">
                      {new Date(nextAptData.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {new Date(nextAptData.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {nextAptData.type?.replace("_", " ") || "Appointment"}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.4} />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Active protocols */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg md:text-xl text-foreground">My Protocols</h2>
              <Link href="/patient/protocols">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors tracking-wider uppercase">
                  View all <ArrowRight className="w-3 h-3" strokeWidth={1.4} />
                </span>
              </Link>
            </div>
            {assignments.length === 0 ? (
              <div className="bg-card rounded-sm p-8 border border-border/40 text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">No protocols assigned yet. Dr. Egbert will add your personalized plan soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((row: any) => {
                  const a = row.assignment;
                  const proto = row.protocol;
                  return (
                    <Link key={a.id} href="/patient/protocols">
                      <div className="bg-card rounded-sm p-4 md:p-5 border border-border/40 cursor-pointer hover:border-border transition-colors duration-300">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="font-heading text-sm md:text-base text-foreground">
                            {proto?.name || "Protocol"}
                          </h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            a.status === "active" ? "bg-muted text-foreground" :
                            a.status === "completed" ? "bg-muted text-muted-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {proto?.category?.replace("_", " ") || "Health"} &middot; Started {new Date(a.startDate || a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column — Tasks */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg md:text-xl text-foreground">My Tasks</h2>
            <span className="text-[11px] text-muted-foreground tracking-wider uppercase">{completedTasks}/{totalTasks} done</span>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-card rounded-sm p-8 border border-border/40 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 8).map((task: any) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3.5 md:p-4 rounded-sm border transition-all duration-300 ${
                    task.status === "completed"
                      ? "bg-muted/30 border-border/30"
                      : "bg-card border-border/40"
                  }`}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.4} />
                  ) : (
                    <Circle className="w-4 h-4 text-border shrink-0" strokeWidth={1.4} />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-normal ${
                      task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Due: {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  {task.priority === "urgent" && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Urgent</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

