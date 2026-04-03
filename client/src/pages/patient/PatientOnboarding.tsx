// PatientOnboarding.tsx — Black Label Medicine New Client Onboarding
// Design: The Row — Quiet luxury, editorial minimalism
// Interactive checklist with auto-detection for intake & SMS status
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useViewAs } from "@/contexts/ViewAsContext";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Phone,
  FlaskConical,
  ClipboardCheck,
  CalendarCheck,
  FileText,
  Compass,
  BookOpen,
  HeartHandshake,
  ArrowRight,
  Loader2,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

/* ─── localStorage key ─── */
const STORAGE_KEY = "blm-onboarding-checked";

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveChecked(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

/* ─── checklist definition ─── */
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  linkTo?: string;
  linkLabel?: string;
  externalLink?: string;
  autoDetect?: "sms" | "intake";
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: "sms",
    title: "Enable SMS Notifications",
    description:
      "Turn on text message notifications so you never miss an update from your care team. Your provider can also enable this for you.",
    icon: Smartphone,
    linkTo: "/patient/notifications",
    linkLabel: "Notification Settings",
    autoDetect: "sms",
  },
  {
    id: "connect-ea",
    title: "Connect with Samantha (Executive Assistant)",
    description:
      'Save Samantha\'s number so you can reach the team anytime for scheduling, questions, or coordination. Text or call: (435) 938-8657',
    icon: Phone,
  },
  {
    id: "labs",
    title: "Schedule Initial Labs",
    description:
      "Get your comprehensive lab panel scheduled, or upload your most recent results if you already have them. This is the foundation of your optimization plan.",
    icon: FlaskConical,
    linkTo: "/patient/documents",
    linkLabel: "Upload Lab Results",
  },
  {
    id: "intake",
    title: "Complete Your Intake Form",
    description:
      "Fill out your full intake questionnaire with special attention to your goals. The more detail you provide, the more personalized your plan will be.",
    icon: ClipboardCheck,
    linkTo: "/patient/intake",
    linkLabel: "Open Intake Form",
    autoDetect: "intake",
  },
  {
    id: "consultation",
    title: "Schedule Initial Consultation",
    description:
      "Book your first consultation with Dr. Jacob Egbert to review your labs, discuss your goals, and begin building your protocol.",
    icon: CalendarCheck,
    linkTo: "/patient/schedule",
    linkLabel: "View Schedule",
  },
  {
    id: "plan",
    title: "Receive Your Initial Plan & Protocol",
    description:
      "After your consultation, Dr. Egbert will build your personalized optimization protocol. You'll see it appear on your Protocols page with daily action items.",
    icon: FileText,
    linkTo: "/patient/protocols",
    linkLabel: "View Protocols",
  },
  {
    id: "orient",
    title: "Orient to the App",
    description:
      "Explore app.blacklabelmedicine.com — your dashboard, messages, documents, vitals tracking, and AI wellness advisor. This is your command center.",
    icon: Compass,
  },
  {
    id: "resources",
    title: "Review Resources",
    description:
      "Browse the resource library for guides on biomarkers, protocols, VO2 max, and more. Knowledge is a key part of the optimization process.",
    icon: BookOpen,
    linkTo: "/patient/resources",
    linkLabel: "Browse Resources",
  },
  {
    id: "commit",
    title: "Commit to the Process",
    description:
      "Optimization is a partnership. Commit to following your protocols, logging your progress, and communicating openly with your care team. Consistency compounds.",
    icon: HeartHandshake,
  },
];

export default function PatientOnboarding() {
  const { user } = useAuth();
  const { viewAsPatientId } = useViewAs();

  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined,
  );
  const myRecord = myRecordQuery.data;
  const patientId = myRecord?.id;

  const intakeQuery = trpc.intake.mine.useQuery(undefined, { enabled: !!patientId });

  /* ─── manual checkbox state ─── */
  const [checked, setChecked] = useState<Set<string>>(loadChecked);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveChecked(next);
        return next;
      });
    },
    [],
  );

  /* ─── auto-detection overrides ─── */
  const smsEnabled = myRecord?.smsOptIn === true;
  const intakeSubmitted = intakeQuery.data?.status === "completed" || !!intakeQuery.data?.submittedAt;

  const isChecked = useCallback(
    (item: ChecklistItem): boolean => {
      if (item.autoDetect === "sms") return smsEnabled || checked.has(item.id);
      if (item.autoDetect === "intake") return intakeSubmitted || checked.has(item.id);
      return checked.has(item.id);
    },
    [smsEnabled, intakeSubmitted, checked],
  );

  const completedCount = useMemo(
    () => CHECKLIST.filter((item) => isChecked(item)).length,
    [isChecked],
  );

  const progressPct = Math.round((completedCount / CHECKLIST.length) * 100);
  const firstName = myRecord?.firstName || user?.name?.split(" ")[0] || "there";

  /* ─── auto-complete onboarding when all items checked ─── */
  const completeOnboarding = trpc.patient.completeOnboarding.useMutation();
  const completedRef = useRef(false);
  useEffect(() => {
    if (
      progressPct === 100 &&
      !completedRef.current &&
      myRecord &&
      !myRecord.onboardingCompletedAt
    ) {
      completedRef.current = true;
      completeOnboarding.mutate();
    }
  }, [progressPct, myRecord]);

  if (myRecordQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ─── HEADER ─── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="font-heading text-2xl md:text-3xl tracking-tight">
          Welcome, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base leading-relaxed max-w-xl">
          Complete each step below to get the most out of your Black Label Medicine experience.
          Your optimization journey starts here.
        </p>
      </motion.div>

      {/* ─── PROGRESS BAR ─── */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="bg-card rounded-sm border border-border/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium tracking-wide">Onboarding Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {CHECKLIST.length} complete
            </span>
          </div>
          <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progressPct === 100 && (
            <p className="text-xs text-gold mt-2 font-medium tracking-wide">
              ✦ All steps complete — you're fully onboarded. Let's optimize.
            </p>
          )}
        </div>
      </motion.div>

      {/* ─── CHECKLIST ─── */}
      <div className="space-y-3">
        {CHECKLIST.map((item, idx) => {
          const done = isChecked(item);
          const Icon = item.icon;
          const isAutoDetected = item.autoDetect && (
            (item.autoDetect === "sms" && smsEnabled) ||
            (item.autoDetect === "intake" && intakeSubmitted)
          );

          return (
            <motion.div
              key={item.id}
              custom={idx + 2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <div
                className={`group bg-card rounded-sm border transition-all duration-300 ${
                  done
                    ? "border-gold/30 bg-gold/[0.02]"
                    : "border-border/40 hover:border-border"
                }`}
              >
                <div className="flex gap-4 p-5">
                  {/* Checkbox */}
                  <button
                    onClick={() => !isAutoDetected && toggle(item.id)}
                    className={`mt-0.5 shrink-0 transition-colors duration-200 ${
                      isAutoDetected ? "cursor-default" : "cursor-pointer"
                    }`}
                    aria-label={done ? `Mark "${item.title}" incomplete` : `Mark "${item.title}" complete`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 text-gold" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div
                        className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center shrink-0 transition-colors duration-300 ${
                          done ? "bg-gold/10" : "bg-muted/60"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            done ? "text-gold" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                            done ? "text-gold" : ""
                          }`}
                        >
                          {item.title}
                          {isAutoDetected && (
                            <span className="ml-2 text-[10px] uppercase tracking-widest text-gold/60 font-medium">
                              Auto-detected
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {item.description}
                        </p>

                        {/* Action link */}
                        {item.linkTo && (
                          <Link
                            href={item.linkTo}
                            className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light mt-2 font-medium tracking-wide transition-colors"
                          >
                            {item.linkLabel || "Go"}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        {item.externalLink && (
                          <a
                            href={item.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-light mt-2 font-medium tracking-wide transition-colors"
                          >
                            {item.linkLabel || "Open"}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── FOOTER NOTE ─── */}
      <motion.div
        custom={CHECKLIST.length + 3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
            Questions about any step? Reach out via{" "}
            <Link href="/patient/messages" className="text-gold hover:underline">
              Messages
            </Link>{" "}
            or text Samantha at (435) 938-8657.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
