/**
 * PatientVO2MaxGuide -- Norwegian 4x4 Interval Training & VO2 Max as a Longevity Predictor
 * Comprehensive patient-facing resource: summary, benefits, example workouts
 * Design: The Row -- Quiet luxury, editorial minimalism
 */
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Activity,
  Timer,
  TrendingUp,
  Flame,
  Dumbbell,
  Bike,
  Waves,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Shield,
  Clock,
  Zap,
  Brain,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

/* ─── Data ────────────────────────────────────────────────── */

const mortalityData = [
  { level: "Low (Bottom 25%)", risk: "Baseline", color: "bg-red-500", width: "w-full" },
  { level: "Below Average (25–50th)", risk: "50% lower", color: "bg-orange-400", width: "w-1/2" },
  { level: "Above Average (50–75th)", risk: "60–70% lower", color: "bg-amber-400", width: "w-[35%]" },
  { level: "High (75–95th)", risk: "~80% lower", color: "bg-emerald-400", width: "w-[22%]" },
  { level: "Elite (Top 5%)", risk: "~80% lower", color: "bg-emerald-600", width: "w-[20%]" },
];

const benefits = [
  {
    icon: Heart,
    title: "Cardiovascular Health",
    description:
      "Strengthens the heart muscle, increases stroke volume, and improves the heart's ability to pump blood efficiently. The 4-minute intervals optimally fill the heart with blood, maximizing cardiac output.",
  },
  {
    icon: TrendingUp,
    title: "VO2 Max Improvement",
    description:
      "Considered the gold standard for increasing maximal oxygen uptake. Studies show improvements of 10–13% in VO2 Max within 8–10 weeks of consistent training — at least twice as effective as steady-state cardio.",
  },
  {
    icon: Clock,
    title: "Anti-Aging Effects",
    description:
      "VO2 Max declines approximately 1% per year after age 30. The Norwegian 4x4 method can slow or partially reverse this decline, effectively reducing your biological age and preserving functional capacity.",
  },
  {
    icon: Shield,
    title: "Mortality Risk Reduction",
    description:
      "Every 1 MET increase in VO2 Max (approximately 3.5 mL/kg/min) is associated with a 13–15% reduction in all-cause mortality risk. Moving from low to above-average fitness reduces mortality risk by 60–70%.",
  },
  {
    icon: Brain,
    title: "Cognitive Function",
    description:
      "Higher cardiorespiratory fitness is linked to improved brain health, better memory, and reduced risk of neurodegenerative diseases. Increased blood flow during high-intensity exercise promotes neuroplasticity.",
  },
  {
    icon: Zap,
    title: "Metabolic Health",
    description:
      "Improves insulin sensitivity, enhances mitochondrial density and function, and increases the body's ability to oxidize fat. These metabolic adaptations support healthy body composition and energy levels.",
  },
];

const workouts = [
  {
    id: "treadmill",
    title: "Treadmill (Recommended)",
    icon: Footprints,
    difficulty: "Beginner–Advanced",
    duration: "36 min",
    description: "The preferred modality. Incline walking or jogging engages the heart as the limiting factor rather than technique, and is gentler on joints than flat running.",
    protocol: [
      { phase: "Warm-Up", duration: "6 min", detail: "Walk at 3.0–3.5 mph, gradually increasing incline from 0% to 5%." },
      { phase: "Interval 1", duration: "4 min", detail: "Increase speed to 3.5–4.5 mph at 10–15% incline. Heart rate should reach 85–95% of max by minute 2. You should be breathing too hard to speak in full sentences." },
      { phase: "Recovery 1", duration: "3 min", detail: "Reduce speed to 2.5–3.0 mph, lower incline to 2–3%. Breathe normally. Do not stop walking." },
      { phase: "Interval 2", duration: "4 min", detail: "Return to interval speed and incline. The first 60–90 seconds will feel manageable before intensity builds." },
      { phase: "Recovery 2", duration: "3 min", detail: "Same recovery protocol. Focus on controlled breathing." },
      { phase: "Interval 3", duration: "4 min", detail: "Same intensity. Maintain form — upright posture, relaxed shoulders." },
      { phase: "Recovery 3", duration: "3 min", detail: "Active recovery. You should feel ready for one more interval." },
      { phase: "Interval 4", duration: "4 min", detail: "Final push. Same intensity as previous intervals — do not sprint. Sustainable effort." },
      { phase: "Cool-Down", duration: "5 min", detail: "Gradually reduce speed and incline. Walk until heart rate drops below 120 bpm." },
    ],
    tips: [
      "Minimum 5% incline is recommended — the heart becomes the limiting factor, not your legs.",
      "If you can hold a conversation during intervals, increase speed or incline.",
      "If you could NOT do a 5th interval, you went too hard. Scale back next session.",
    ],
  },
  {
    id: "cycling",
    title: "Stationary Bike",
    icon: Bike,
    difficulty: "Beginner–Advanced",
    duration: "36 min",
    description: "Excellent low-impact option. Ideal for those with joint concerns or who prefer cycling. Resistance and cadence replace incline and speed.",
    protocol: [
      { phase: "Warm-Up", duration: "6 min", detail: "Easy pedaling at 60–70 RPM with light resistance. Gradually increase resistance." },
      { phase: "Interval 1", duration: "4 min", detail: "Increase resistance significantly. Maintain 80–95 RPM. Heart rate target: 85–95% of max." },
      { phase: "Recovery 1", duration: "3 min", detail: "Reduce resistance to light. Easy spin at 60–70 RPM. Keep pedaling." },
      { phase: "Interval 2", duration: "4 min", detail: "Return to high resistance and cadence. Focus on smooth, powerful pedal strokes." },
      { phase: "Recovery 2", duration: "3 min", detail: "Light resistance, easy cadence. Controlled breathing." },
      { phase: "Interval 3", duration: "4 min", detail: "Same intensity. Stay seated — standing shifts effort to legs rather than cardiovascular system." },
      { phase: "Recovery 3", duration: "3 min", detail: "Active recovery spin." },
      { phase: "Interval 4", duration: "4 min", detail: "Final interval. Maintain the same sustainable high intensity." },
      { phase: "Cool-Down", duration: "5 min", detail: "Gradually reduce resistance. Easy spin until heart rate normalizes." },
    ],
    tips: [
      "Stay seated during intervals to keep the cardiovascular system as the primary limiter.",
      "Use a heart rate monitor — RPE alone can be unreliable on a bike.",
      "Adjust resistance so you reach target heart rate within 1–2 minutes of each interval.",
    ],
  },
  {
    id: "rowing",
    title: "Rowing Ergometer",
    icon: Waves,
    difficulty: "Intermediate–Advanced",
    duration: "36 min",
    description: "Full-body cardiovascular challenge. Engages 86% of your muscles while driving heart rate into the target zone. Requires basic rowing technique.",
    protocol: [
      { phase: "Warm-Up", duration: "6 min", detail: "Easy rowing at 18–22 strokes per minute. Focus on form: legs–back–arms on the drive, arms–back–legs on recovery." },
      { phase: "Interval 1", duration: "4 min", detail: "Increase stroke rate to 26–30 SPM with strong leg drive. Target 85–95% max heart rate." },
      { phase: "Recovery 1", duration: "3 min", detail: "Reduce to 18–20 SPM. Light, easy strokes. Breathe." },
      { phase: "Interval 2", duration: "4 min", detail: "Return to high intensity. Consistent stroke rate and power output." },
      { phase: "Recovery 2", duration: "3 min", detail: "Easy rowing. Focus on technique and breathing." },
      { phase: "Interval 3", duration: "4 min", detail: "Same intensity. Maintain posture — tall spine, engaged core." },
      { phase: "Recovery 3", duration: "3 min", detail: "Active recovery strokes." },
      { phase: "Interval 4", duration: "4 min", detail: "Final interval. Same sustainable intensity — do not sprint the last minute." },
      { phase: "Cool-Down", duration: "5 min", detail: "Gradually reduce stroke rate and intensity. Stretch hip flexors and hamstrings." },
    ],
    tips: [
      "Power comes from the legs (60%), core (20%), and arms (20%) — do not pull with your back.",
      "If you are new to rowing, spend 2–3 sessions learning technique before attempting 4x4 intervals.",
      "Damper setting of 4–6 is appropriate for most people — higher is not necessarily better.",
    ],
  },
  {
    id: "outdoor",
    title: "Outdoor Running / Walking",
    icon: Footprints,
    difficulty: "All Levels",
    duration: "36 min",
    description: "Use hills for natural incline intervals or flat terrain with pace changes. Walking uphill at a brisk pace is equally effective for those who do not run.",
    protocol: [
      { phase: "Warm-Up", duration: "6 min", detail: "Easy walk or light jog. If using hills, walk to the base of your chosen hill." },
      { phase: "Interval 1", duration: "4 min", detail: "Brisk uphill walk or jog at a pace that makes conversation impossible by minute 2. Heart rate: 85–95% of max." },
      { phase: "Recovery 1", duration: "3 min", detail: "Walk back down or walk on flat ground at an easy pace." },
      { phase: "Interval 2", duration: "4 min", detail: "Same hill or increase pace on flat ground. Consistent effort." },
      { phase: "Recovery 2", duration: "3 min", detail: "Easy walking. Recover your breathing fully." },
      { phase: "Interval 3", duration: "4 min", detail: "Same intensity. If using flat terrain, maintain the pace that keeps you breathless." },
      { phase: "Recovery 3", duration: "3 min", detail: "Active walking recovery." },
      { phase: "Interval 4", duration: "4 min", detail: "Final effort. Same sustainable intensity." },
      { phase: "Cool-Down", duration: "5 min", detail: "Easy walk. Stretch calves, quads, and hip flexors." },
    ],
    tips: [
      "Hill walking is preferred over flat running — it loads the cardiovascular system with less joint impact.",
      "You do NOT need to run. Brisk uphill walking at the right incline achieves the same heart rate targets.",
      "Use a heart rate monitor or chest strap for accurate outdoor tracking.",
    ],
  },
];

const frequencyGuidelines = [
  { frequency: "1 session per week", goal: "Maintain current VO2 Max", who: "Maintenance phase or heavy training weeks" },
  { frequency: "2 sessions per week", goal: "Improve VO2 Max", who: "Recommended for most patients" },
  { frequency: "3 sessions per week", goal: "Aggressive improvement", who: "Only with provider approval; requires adequate recovery" },
];

const safetyNotes = [
  "Always consult with Dr. Egbert before beginning or modifying a high-intensity training program.",
  "If you experience chest pain, dizziness, or unusual shortness of breath, stop immediately and seek medical attention.",
  "The intervals should feel challenging but not painful. You should be breathless, not in discomfort.",
  "If you could not complete a hypothetical 5th interval, you pushed too hard — reduce intensity next session.",
  "Allow at least 48 hours between VO2 Max sessions for adequate cardiovascular recovery.",
  "Heart rate monitors (chest strap preferred) provide the most accurate intensity feedback.",
];

/* ─── Component ───────────────────────────────────────────── */

function CollapsibleWorkout({ workout }: { workout: (typeof workouts)[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = workout.icon;

  return (
    <Card className="bg-card border-border/40 rounded-sm shadow-none overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-5 sm:p-6 flex items-center gap-4 hover:bg-muted/30 transition-colors duration-200"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-heading font-medium text-foreground">{workout.title}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {workout.difficulty}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium flex items-center gap-1">
              <Timer className="w-3 h-3" /> {workout.duration}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{workout.description}</p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border/30 px-5 sm:px-6 pb-6 pt-4 space-y-4">
          {/* Protocol steps */}
          <div className="space-y-0">
            {workout.protocol.map((step, idx) => {
              const isInterval = step.phase.startsWith("Interval");
              const isWarmCool = step.phase === "Warm-Up" || step.phase === "Cool-Down";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 py-3 ${idx > 0 ? "border-t border-border/20" : ""}`}
                >
                  <div className="shrink-0 w-20 sm:w-24">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-sm inline-block ${
                        isInterval
                          ? "bg-red-500/10 text-red-500"
                          : isWarmCool
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {step.phase}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted-foreground font-medium">{step.duration}</span>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          {workout.tips.length > 0 && (
            <div className="bg-gold/5 border border-gold/15 rounded-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gold" strokeWidth={1.5} />
                <span className="text-xs font-medium text-gold tracking-wide uppercase">Tips</span>
              </div>
              <ul className="space-y-1.5">
                {workout.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold mt-1 shrink-0" strokeWidth={1.5} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function PatientVO2MaxGuide() {
  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12 space-y-10 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/patient/resources">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.4} />
          <span className="tracking-wide">Back to Resources</span>
        </button>
      </Link>

      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-muted/60 border border-border/40">
          <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.4} />
          <span className="text-[10px] font-medium text-muted-foreground tracking-[0.2em] uppercase">
            Health Resource
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-normal text-foreground tracking-tight">
          Norwegian 4x4 Interval Training
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The science-backed method for improving VO2 Max — the single strongest predictor of longevity and all-cause mortality.
        </p>
        <div className="h-px bg-border/40 mx-auto max-w-xs mt-6" />
      </motion.div>

      {/* ── What Is VO2 Max ─────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gold" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                What Is VO2 Max?
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              VO2 Max (maximal oxygen uptake) is the maximum rate at which your body can absorb and utilize oxygen during intense exercise. It is measured in milliliters of oxygen per kilogram of body weight per minute (mL/kg/min) and reflects the combined efficiency of your heart, lungs, blood vessels, and muscles working together.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              Think of it as your body's aerobic ceiling — the higher your VO2 Max, the more oxygen your body can deliver to working tissues, and the greater your capacity for sustained physical effort. It is widely considered the single best measure of cardiorespiratory fitness.
            </p>
            <div className="bg-gold/5 border border-gold/15 rounded-sm p-4">
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "VO2 Max is the single most powerful marker for longevity. If you have a low VO2 Max, the risk of all-cause mortality is higher than if you were a smoker, had coronary artery disease, type 2 diabetes, or hypertension."
              </p>
              <p className="text-xs text-muted-foreground mt-2">— Based on Mandsager et al., JAMA Network Open, 2018 (122,007 patients)</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── VO2 Max & Longevity ─────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gold" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                VO2 Max as a Longevity Predictor
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              A landmark 2018 study of over 122,000 patients followed for more than a decade found that cardiorespiratory fitness — as measured by VO2 Max — is the single strongest predictor of survival. The relationship between fitness level and mortality risk is striking:
            </p>

            {/* Mortality risk visualization */}
            <div className="space-y-3 py-2">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">
                All-Cause Mortality Risk by Fitness Level
              </p>
              {mortalityData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80 text-xs sm:text-sm">{item.level}</span>
                    <span className="font-medium text-foreground text-xs sm:text-sm">{item.risk}</span>
                  </div>
                  <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: idx === 0 ? "100%" : idx === 1 ? "50%" : idx === 2 ? "35%" : idx === 3 ? "22%" : "20%" }} />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground mt-2">
                Source: Mandsager et al., JAMA Network Open, 2018. Bars represent relative mortality risk compared to the lowest fitness group.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-muted/30 rounded-sm p-4 space-y-1">
                <p className="text-2xl font-heading font-medium text-foreground">5x</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mortality difference between low fitness and elite fitness over a decade
                </p>
              </div>
              <div className="bg-muted/30 rounded-sm p-4 space-y-1">
                <p className="text-2xl font-heading font-medium text-foreground">50%</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mortality reduction from simply moving out of the bottom 25th percentile to below average
                </p>
              </div>
              <div className="bg-muted/30 rounded-sm p-4 space-y-1">
                <p className="text-2xl font-heading font-medium text-foreground">13–15%</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mortality risk reduction per 1 MET increase in VO2 Max (approximately 3.5 mL/kg/min)
                </p>
              </div>
              <div className="bg-muted/30 rounded-sm p-4 space-y-1">
                <p className="text-2xl font-heading font-medium text-foreground">~1%</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Annual decline in VO2 Max after age 30 — training can slow or reverse this trajectory
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              To put this in perspective: having low cardiorespiratory fitness carries a greater mortality risk than smoking (41% increase), coronary artery disease (29%), type 2 diabetes (40%), or hypertension (21%). Moving from the bottom 25th percentile to the 50th–75th percentile — a completely achievable goal — provides the same mortality benefit as eliminating end-stage renal disease.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── The Norwegian 4x4 Method ───────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-gold" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                The Norwegian 4x4 Protocol
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              Developed by Professors Jan Hoff and Jan Helgerud at the Norwegian University of Science and Technology (NTNU), the 4x4 interval method is backed by over 200 peer-reviewed studies. It is considered the gold standard for improving VO2 Max and is used by elite athletes, cardiac rehabilitation programs, and longevity-focused physicians worldwide.
            </p>

            {/* Protocol summary */}
            <div className="bg-muted/30 rounded-sm p-5 space-y-4">
              <h3 className="text-sm font-heading font-medium text-foreground tracking-wide">The Protocol at a Glance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gold" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intervals</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">4 rounds x 4 minutes</p>
                  <p className="text-xs text-muted-foreground">at 85–95% max heart rate</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recovery</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">3 minutes active rest</p>
                  <p className="text-xs text-muted-foreground">between each interval</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Time</span>
                  </div>
                  <p className="text-sm text-foreground font-medium">~36 minutes</p>
                  <p className="text-xs text-muted-foreground">including warm-up and cool-down</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-heading font-medium text-foreground">How to Gauge Intensity</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span>After 1–2 minutes into each interval, you should be breathing so hard that you <strong>cannot speak in complete sentences</strong>.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span>You should feel <strong>breathless but not in pain</strong>. If you feel discomfort beyond heavy breathing, reduce intensity.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span>At the end of each interval, you should feel like you <strong>could continue for one more minute</strong> at that intensity.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span>After the 4th interval, ask yourself: "Could I do a 5th?" If <strong>yes</strong>, you did it right. If <strong>no</strong>, you went too hard.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Benefits ────────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <TrendingUp className="w-5 h-5 text-gold" strokeWidth={1.4} />
          <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
            Key Benefits
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <Card key={idx} className="bg-card border-border/40 rounded-sm shadow-none">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-heading font-medium text-foreground">{b.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{b.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* ── Example Workouts ────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp} className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <Dumbbell className="w-5 h-5 text-gold" strokeWidth={1.4} />
          <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
            Example Workouts
          </h2>
        </div>
        <p className="text-sm text-muted-foreground px-1 leading-relaxed">
          Choose any cardiovascular modality that allows you to sustain high intensity for 4 minutes. Tap each workout to see the full step-by-step protocol.
        </p>
        <div className="space-y-3">
          {workouts.map((w) => (
            <CollapsibleWorkout key={w.id} workout={w} />
          ))}
        </div>
      </motion.div>

      {/* ── Training Frequency ──────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-gold" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Recommended Frequency
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              VO2 Max training should be combined with a foundation of Zone 2 (low-intensity) aerobic training. The Norwegian 4x4 sessions are the high-intensity component of a balanced cardiovascular program.
            </p>
            <div className="space-y-2">
              {frequencyGuidelines.map((g, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-sm">
                  <div className="shrink-0 mt-0.5">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      idx === 1 ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{g.frequency}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.goal} — {g.who}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gold/5 border border-gold/15 rounded-sm p-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>Recommended weekly structure:</strong> 3–4 sessions of Zone 2 training (30–60 min at conversational pace) plus 1–2 sessions of Norwegian 4x4 intervals. This combination optimizes both mitochondrial density (Zone 2) and maximal cardiac output (4x4).
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Safety & Precautions ────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none border-l-4 border-l-amber-400">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Safety & Precautions
              </h2>
            </div>
            <ul className="space-y-3">
              {safetyNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-foreground/85 leading-relaxed">
                  <span className="shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                    {idx + 1}
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── References ──────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" custom={8} variants={fadeUp}>
        <div className="space-y-3 px-1">
          <h2 className="text-sm font-heading font-medium text-muted-foreground tracking-wide uppercase">References</h2>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Mandsager K, Harb S, Cremer P, et al. Association of Cardiorespiratory Fitness With Long-term Mortality Among Adults Undergoing Exercise Treadmill Testing. <em>JAMA Network Open</em>. 2018;1(6):e183605.
            </p>
            <p>
              Helgerud J, Hoydal K, Wang E, et al. Aerobic High-Intensity Intervals Improve VO2max More Than Moderate Training. <em>Medicine & Science in Sports & Exercise</em>. 2007;39(4):665-671.
            </p>
            <p>
              Kodama S, Saito K, Tanaka S, et al. Cardiorespiratory Fitness as a Quantitative Predictor of All-Cause Mortality and Cardiovascular Events. <em>JAMA</em>. 2009;301(19):2024-2035.
            </p>
            <p>
              Lang JJ, Prince SA, Merucci K, et al. Cardiorespiratory fitness is a strong and consistent predictor of morbidity and mortality among adults. <em>British Journal of Sports Medicine</em>. 2024;58:556-566.
            </p>
            <p>
              Strasser B, Burtscher M. Survival of the fittest: VO2max, a key predictor of longevity? <em>Frontiers in Bioscience</em>. 2018;23:1505-1516.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
