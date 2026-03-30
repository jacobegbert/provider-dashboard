/**
 * PatientBiomarkerGuide -- How to set up and use custom biomarkers
 * Step-by-step guide for patients on the Biomarker tracking feature
 * Design: The Row -- Quiet luxury, editorial minimalism
 * Note: Styling uses semantic tokens that resolve to The Row palette via .theme-feminine CSS
 */
import { motion } from "framer-motion";
import {
  Activity,
  Plus,
  BarChart3,
  TrendingUp,
  Scale,
  Ruler,
  Percent,
  Edit3,
  Trash2,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Heart,
  Droplets,
  Thermometer,
  Timer,
  Zap,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const builtInMetrics = [
  { name: "Weight", unit: "lbs", icon: Scale, description: "Track body weight over time to monitor progress toward composition goals." },
  { name: "Height", unit: "in", icon: Ruler, description: "Record your height for BMI calculations and growth tracking." },
  { name: "Body Fat", unit: "%", icon: Percent, description: "Monitor body fat percentage to assess changes in body composition." },
];

const customMetricExamples = [
  { name: "Resting Heart Rate", unit: "bpm", icon: Heart, why: "Lower resting heart rate indicates improved cardiovascular fitness." },
  { name: "Blood Pressure (Systolic)", unit: "mmHg", icon: Droplets, why: "Track systolic pressure to monitor cardiovascular health between lab visits." },
  { name: "Fasting Blood Glucose", unit: "mg/dL", icon: Zap, why: "Daily glucose tracking helps optimize metabolic health and insulin sensitivity." },
  { name: "Body Temperature", unit: "\u00b0F", icon: Thermometer, why: "Basal body temperature can indicate thyroid function and metabolic rate." },
  { name: "Waist Circumference", unit: "in", icon: Ruler, why: "A key indicator of visceral fat and metabolic risk, independent of weight." },
  { name: "Sleep Duration", unit: "hrs", icon: Timer, why: "Consistent sleep tracking helps correlate rest with recovery and performance." },
];

const steps = [
  {
    number: 1,
    title: "Navigate to Biomarkers",
    description: "From the patient portal sidebar, tap or click \"Biomarkers\" to open your health metrics dashboard. You will see three built-in metrics (Weight, Height, Body Fat) ready to use.",
    tip: null,
  },
  {
    number: 2,
    title: "Add a Custom Metric",
    description: "Click the \"Add Metric\" button in the top-right corner. In the dialog that appears, enter a name for your metric (e.g., \"Resting Heart Rate\") and the unit of measurement (e.g., \"bpm\"). Click \"Add Metric\" to save.",
    tip: "Choose clear, specific names and standard units so your provider can easily interpret your data during consultations.",
  },
  {
    number: 3,
    title: "Log Your First Entry",
    description: "On any metric card, click \"Log Entry.\" Enter the measured value, select the date (defaults to today), and optionally add a note with context -- for example, \"Measured after morning walk\" or \"Fasted reading.\"",
    tip: "Adding notes helps your provider understand the conditions of each measurement, leading to more accurate analysis.",
  },
  {
    number: 4,
    title: "Review Your History",
    description: "Click \"History\" on any metric card to expand the full log of past entries. You will see each value, date, and any notes you added. The trend indicator at the top shows whether your latest reading is up, down, or stable compared to the previous entry.",
    tip: null,
  },
  {
    number: 5,
    title: "Edit or Delete Entries",
    description: "Hover over any entry in the history list to reveal edit and delete icons. Click the pencil icon to update a value, date, or note. Click the X icon to remove an entry. Changes take effect immediately.",
    tip: "If you entered a value incorrectly, edit rather than delete -- this preserves your tracking timeline.",
  },
  {
    number: 6,
    title: "Remove a Custom Metric",
    description: "If you no longer need a custom metric, click the trash icon on its card. You will be asked to confirm, because removing a metric also deletes all of its logged entries permanently.",
    tip: "Built-in metrics (Weight, Height, Body Fat) cannot be removed -- only custom metrics you created can be deleted.",
  },
];

const bestPractices = [
  {
    title: "Measure at the Same Time",
    description: "For the most accurate trends, take measurements at a consistent time each day -- ideally first thing in the morning before eating or exercising.",
  },
  {
    title: "Be Consistent with Conditions",
    description: "Weigh yourself on the same scale, measure blood pressure in the same position, and use the same device. Consistency reduces noise in your data.",
  },
  {
    title: "Log Regularly",
    description: "The more data points you have, the clearer your trends become. Aim for at least weekly entries on key metrics, or daily for metrics like blood glucose or blood pressure.",
  },
  {
    title: "Use Notes Strategically",
    description: "Note anything unusual -- a stressful day, a new supplement, travel, illness, or a change in routine. These notes help your provider connect the dots during reviews.",
  },
  {
    title: "Discuss Trends with Your Provider",
    description: "Your provider can see all your biomarker data in your client profile. Bring up any concerning trends during your consultations for personalized guidance.",
  },
  {
    title: "Track What Matters to You",
    description: "You can create unlimited custom metrics. Focus on the markers most relevant to your health goals -- whether that is cardiovascular fitness, metabolic health, body composition, or recovery.",
  },
];

export default function PatientBiomarkerGuide() {
  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12 space-y-10 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/patient/vitals">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.4} />
          <span className="tracking-wide">Back to Biomarkers</span>
        </button>
      </Link>

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-muted/60 border border-border/40">
          <BookOpen className="w-4 h-4 text-muted-foreground" strokeWidth={1.4} />
          <span className="text-[10px] font-medium text-muted-foreground tracking-[0.2em] uppercase">
            Feature Guide
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-normal text-foreground tracking-tight">
          Biomarker Tracking Guide
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Learn how to set up custom biomarkers, log entries, and use your health data to optimize your wellness journey with Dr. Egbert.
        </p>
        <div className="h-px bg-border/40 mx-auto max-w-xs mt-6" />
      </motion.div>

      {/* What Are Biomarkers */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                What Are Biomarkers?
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              Biomarkers are measurable indicators of your health and biological processes. In your patient portal, the Biomarkers page lets you track key health metrics over time -- from standard measurements like weight and body fat percentage to custom metrics tailored to your specific health goals.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              By logging your biomarkers consistently, you and Dr. Egbert can identify trends, measure the impact of your protocols, and make data-driven adjustments to your optimization plan.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Built-in Metrics */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Built-in Metrics
            </h2>
            <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-sm border border-border/40">
              Available by Default
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These three metrics are pre-configured and ready to use immediately. You cannot remove them.
          </p>
          <div className="grid gap-3">
            {builtInMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div key={metric.name} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp}>
                  <Card className="bg-card border-border/40 rounded-sm shadow-none hover:border-border transition-all duration-300">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted/60 text-muted-foreground">
                          <Icon className="h-4 w-4" strokeWidth={1.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-normal text-foreground text-sm sm:text-base">
                              {metric.name}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              {metric.unit}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-[1.7]">
                            {metric.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Step-by-Step Guide */}
      <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Step-by-Step Guide
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Follow these steps to set up custom biomarkers and start logging your health data.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div key={step.number} initial="hidden" animate="visible" custom={i + 7} variants={fadeUp}>
                <Card className="bg-card border-border/40 rounded-sm shadow-none">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted/60 border border-border/40">
                        <span className="text-sm font-heading font-medium text-foreground">
                          {step.number}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="font-heading font-normal text-foreground text-sm sm:text-base">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-[1.7]">
                          {step.description}
                        </p>
                        {step.tip && (
                          <div className="flex gap-2 mt-3 p-3 rounded-sm bg-muted/30 border border-border/30">
                            <Lightbulb className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.4} />
                            <p className="text-xs text-foreground/80 leading-[1.7]">
                              <span className="font-medium text-foreground">Tip:</span> {step.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Custom Metric Ideas */}
      <motion.div initial="hidden" animate="visible" custom={13} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Custom Metric Ideas
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Not sure what to track? Here are some commonly recommended metrics for concierge medicine patients focused on optimization and longevity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customMetricExamples.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div key={metric.name} initial="hidden" animate="visible" custom={i + 14} variants={fadeUp}>
                  <Card className="bg-card border-border/40 rounded-sm shadow-none hover:border-border transition-all duration-300 h-full">
                    <CardContent className="p-5 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted/60 text-muted-foreground">
                          <Icon className="h-4 w-4" strokeWidth={1.4} />
                        </div>
                        <div>
                          <h3 className="font-heading font-normal text-foreground text-sm">
                            {metric.name}
                          </h3>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                            {metric.unit}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-[1.7]">
                        {metric.why}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div initial="hidden" animate="visible" custom={20} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Best Practices
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow these guidelines to get the most value from your biomarker tracking.
          </p>

          <div className="grid gap-3">
            {bestPractices.map((practice, i) => (
              <motion.div key={practice.title} initial="hidden" animate="visible" custom={i + 21} variants={fadeUp}>
                <Card className="bg-card border-border/40 rounded-sm shadow-none">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-3">
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.4} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-normal text-foreground text-sm">
                          {practice.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-[1.7]">
                          {practice.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Provider Visibility Note */}
      <motion.div initial="hidden" animate="visible" custom={27} variants={fadeUp}>
        <Card className="bg-muted/30 border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Your Provider Can See Your Data
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              All biomarker entries you log are visible to Dr. Egbert in your client profile under the Biomarkers tab. This means your provider can review your trends, identify patterns, and incorporate your self-tracked data into your overall care plan -- without you needing to send anything separately.
            </p>
            <p className="text-sm text-muted-foreground leading-[1.7]">
              If you have questions about which metrics to track or what your trends mean, bring them up during your next consultation or send a message through the portal.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA -- Go to Biomarkers */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={28}
        variants={fadeUp}
        className="flex justify-center pb-8"
      >
        <Link href="/patient/vitals">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-medium transition-all duration-300">
            <Activity className="w-4 h-4" strokeWidth={1.4} />
            Go to Biomarkers
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
