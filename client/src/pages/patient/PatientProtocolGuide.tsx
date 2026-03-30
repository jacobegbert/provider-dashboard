/**
 * PatientProtocolGuide -- How to navigate, complete, and track protocol history
 * Step-by-step guide for patients on the Protocols and Schedule features
 * Design: The Row -- Quiet luxury, editorial minimalism
 */
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle2,
  CheckCheck,
  Circle,
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Info,
  Leaf,
  Dumbbell,
  Moon,
  Pill,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Eye,
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

const protocolCategories = [
  { name: "Nutrition", icon: Leaf, color: "text-gold", bg: "bg-gold/10", description: "Dietary plans, meal timing, and nutritional protocols tailored to your goals." },
  { name: "Exercise", icon: Dumbbell, color: "text-red-400", bg: "bg-red-500/10", description: "Cardio, strength training, and movement protocols for physical optimization." },
  { name: "Supplements", icon: Pill, color: "text-violet-600", bg: "bg-violet-50", description: "Vitamin, mineral, and supplement regimens prescribed by your provider." },
  { name: "Lifestyle", icon: Sparkles, color: "text-gold", bg: "bg-gold/10", description: "Daily habits, routines, and lifestyle modifications for overall wellness." },
  { name: "Sleep", icon: Moon, color: "text-gold", bg: "bg-gold/10", description: "Sleep hygiene protocols and recovery optimization strategies." },
  { name: "Hormones", icon: Flame, color: "text-amber-600", bg: "bg-amber-50", description: "Hormone therapy protocols with dosing schedules and administration guidance." },
];

const protocolSteps = [
  {
    number: 1,
    title: "Open Your Protocols",
    description: "From the patient portal sidebar, tap or click \"Protocols\" to see all protocols assigned to you by Dr. Egbert. Each protocol card shows its name, category, status (Active, Paused, or Completed), and your progress for today.",
    tip: null,
  },
  {
    number: 2,
    title: "Expand a Protocol",
    description: "Tap any protocol card to expand it and reveal today's checklist. You will see each step listed with a circle indicator -- empty circles are incomplete, and gold checkmarks mean you have already completed that step today.",
    tip: "The progress bar at the top of each protocol card shows your daily completion percentage at a glance, so you can quickly see which protocols still need attention.",
  },
  {
    number: 3,
    title: "Complete Individual Steps",
    description: "Tap any unchecked step to mark it as complete for today. A gold checkmark will appear, and the progress bar updates immediately. If you accidentally mark a step as done, simply tap it again to undo the completion.",
    tip: "Each step includes details like dosage, timing, or instructions from your provider. Read these carefully, especially for medication and supplement protocols.",
  },
  {
    number: 4,
    title: "Use \"Complete All\" for Quick Check-Off",
    description: "If you have finished all steps in a protocol, use the \"Complete All\" button that appears next to \"Today's Checklist.\" This marks every remaining unchecked step as complete in one tap -- perfect for protocols you do as a batch, like your morning supplement routine.",
    tip: "The Complete All button only appears when there are unchecked steps remaining. Once all steps are done, the button disappears and you will see a 100% completion bar.",
  },
  {
    number: 5,
    title: "Understand Step Frequency",
    description: "Not all steps appear every day. Some steps are daily, some are weekly (appearing on Mondays), and some follow a custom schedule set by your provider. Only the steps scheduled for today will appear in your daily checklist.",
    tip: null,
  },
  {
    number: 6,
    title: "Track Your Overall Progress",
    description: "Below the daily progress bar, you will see an overall timeline showing which week you are in relative to the protocol's total duration. This helps you understand where you are in the bigger picture of your treatment plan.",
    tip: null,
  },
];

const calendarSteps = [
  {
    number: 1,
    title: "Navigate to Schedule",
    description: "From the patient portal sidebar, tap \"Schedule\" to open your calendar view. You will see a full monthly calendar with two types of indicators: blue dots for appointments and gold dots for days when you completed protocol steps.",
    tip: null,
  },
  {
    number: 2,
    title: "Read the Calendar Dots",
    description: "Each date cell can show small colored dots at the bottom. A gold dot means you completed at least one protocol step that day. A blue dot means you have an appointment scheduled. Days with both will show both dots side by side.",
    tip: "The dots give you an instant visual overview of your adherence patterns. Aim for gold dots on every day to maintain consistent protocol compliance.",
  },
  {
    number: 3,
    title: "Tap a Date to See Details",
    description: "Tap any past date with a gold dot to open the day detail panel on the right side of the screen. This panel shows a breakdown of every protocol you completed that day, including which specific steps were checked off.",
    tip: null,
  },
  {
    number: 4,
    title: "Review Protocol Breakdown",
    description: "In the day detail panel, each protocol is listed with its category icon and the number of steps you completed. Expand any protocol to see the individual steps -- completed steps show a gold checkmark, while missed steps show an empty circle.",
    tip: "Use this view during consultations with Dr. Egbert to discuss your adherence patterns and identify any protocols that need adjustment.",
  },
  {
    number: 5,
    title: "Navigate Between Months",
    description: "Use the left and right arrow buttons at the top of the calendar to move between months. The completion history loads automatically for each month, so you can look back at your adherence over time.",
    tip: "Looking at multiple months helps you spot trends -- are you more consistent on weekdays? Do you tend to skip protocols on weekends? These patterns are valuable for optimizing your routine.",
  },
  {
    number: 6,
    title: "Check Upcoming Appointments",
    description: "Below the calendar, the \"Upcoming Appointments\" section lists your next scheduled visits with details like date, time, type (follow-up, check-in, lab work), and whether it is in-person or virtual.",
    tip: null,
  },
];

const bestPractices = [
  {
    title: "Complete Protocols at the Same Time Each Day",
    description: "Build your protocols into your daily routine by completing them at consistent times. Morning supplements with breakfast, exercise at your usual gym time, and evening protocols before bed. Consistency builds habits.",
  },
  {
    title: "Use Complete All for Batch Protocols",
    description: "If you take multiple supplements together or do a series of steps in one session, use the Complete All button to save time. You can always undo individual steps if needed.",
  },
  {
    title: "Check Your Calendar Weekly",
    description: "Every Sunday or Monday, open your Schedule page and review the past week. Look for any gaps in your gold dots -- these are days you may have missed protocols. Understanding your patterns helps you stay on track.",
  },
  {
    title: "Do Not Stress About Perfection",
    description: "Missing a day happens. The goal is consistent progress, not perfection. If you miss a day, simply resume the next day. Your provider can see your overall adherence trends and will work with you to find a sustainable rhythm.",
  },
  {
    title: "Discuss Difficult Protocols with Your Provider",
    description: "If a protocol feels too complex or you are consistently missing certain steps, send a message to Dr. Egbert through the Messages page. Protocols can be adjusted to better fit your lifestyle and schedule.",
  },
  {
    title: "Create Your Own Protocols",
    description: "You can create personal protocols using the \"Create Protocol\" button on the Protocols page. This is useful for tracking habits or routines that are not part of your prescribed plan -- like meditation, journaling, or hydration goals.",
  },
];

export default function PatientProtocolGuide() {
  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12 space-y-10 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/patient/resources">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.4} />
          <span className="tracking-wide">Back to Resources</span>
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
          Protocols &amp; History Guide
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Learn how to navigate your assigned protocols, complete daily steps, and use the calendar to review your completion history over time.
        </p>
        <div className="h-px bg-border/40 mx-auto max-w-xs mt-6" />
      </motion.div>

      {/* What Are Protocols */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                What Are Protocols?
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              Protocols are personalized health plans created by Dr. Egbert specifically for you. Each protocol contains a series of steps -- actions you complete on a daily, weekly, or custom schedule. These might include taking specific supplements, following an exercise routine, adhering to a dietary plan, or managing hormone therapy dosing.
            </p>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              By completing your protocol steps consistently and tracking your progress, you and your provider can measure the effectiveness of your treatment plan and make data-driven adjustments to optimize your health outcomes.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Protocol Categories */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Protocol Categories
            </h2>
            <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-sm border border-border/40">
              Color-Coded
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each protocol belongs to a category, indicated by its icon and color. This makes it easy to identify the type of protocol at a glance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {protocolCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div key={cat.name} initial="hidden" animate="visible" custom={i + 3} variants={fadeUp}>
                  <Card className="bg-card border-border/40 rounded-sm shadow-none hover:border-border transition-all duration-300 h-full">
                    <CardContent className="p-5 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${cat.bg}`}>
                          <Icon className={`h-4 w-4 ${cat.color}`} strokeWidth={1.4} />
                        </div>
                        <h3 className="font-heading font-normal text-foreground text-sm">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-[1.7]">
                        {cat.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Part 1: Completing Protocols */}
      <motion.div initial="hidden" animate="visible" custom={9} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCheck className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Completing Your Protocols
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Follow these steps to view and complete your daily protocol tasks.
          </p>

          <div className="space-y-3">
            {protocolSteps.map((step, i) => (
              <motion.div key={step.number} initial="hidden" animate="visible" custom={i + 10} variants={fadeUp}>
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

      {/* Visual Explainer: Protocol Card Anatomy */}
      <motion.div initial="hidden" animate="visible" custom={16} variants={fadeUp}>
        <Card className="bg-muted/30 border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Reading a Protocol Card
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Here is what each element on a protocol card means:
            </p>
            <div className="space-y-3">
              {[
                { icon: Leaf, label: "Category Icon", desc: "The colored icon on the left identifies the protocol type (nutrition, exercise, supplement, etc.)." },
                { icon: CheckCircle2, label: "Status Badge", desc: "Shows whether the protocol is Active, Paused, or Completed. Only active protocols have a daily checklist." },
                { icon: TrendingUp, label: "Today's Progress Bar", desc: "The gold progress bar shows what percentage of today's steps you have completed. Aim for 100% each day." },
                { icon: Clock, label: "Overall Timeline", desc: "The gray bar below shows which week you are in relative to the protocol's total duration." },
                { icon: ChevronDown, label: "Expand Arrow", desc: "Tap the card to expand it and reveal the full daily checklist with individual steps." },
                { icon: CheckCheck, label: "Complete All Button", desc: "Appears when there are unchecked steps. Marks all remaining steps as done in one tap." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-3 items-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted/60">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.4} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <p className="text-xs text-muted-foreground leading-[1.7] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Part 2: Calendar & History */}
      <motion.div initial="hidden" animate="visible" custom={17} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Viewing Your Protocol History
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your Schedule page doubles as a protocol history tracker. Here is how to use it to review past completions.
          </p>

          <div className="space-y-3">
            {calendarSteps.map((step, i) => (
              <motion.div key={step.number} initial="hidden" animate="visible" custom={i + 18} variants={fadeUp}>
                <Card className="bg-card border-border/40 rounded-sm shadow-none">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold/10 border border-gold/20">
                        <span className="text-sm font-heading font-medium text-gold">
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
                          <div className="flex gap-2 mt-3 p-3 rounded-sm bg-gold/5 border border-gold/10">
                            <Lightbulb className="w-4 h-4 text-gold shrink-0 mt-0.5" strokeWidth={1.4} />
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

      {/* Best Practices */}
      <motion.div initial="hidden" animate="visible" custom={24} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Best Practices
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Follow these guidelines to get the most from your protocol tracking.
          </p>

          <div className="grid gap-3">
            {bestPractices.map((practice, i) => (
              <motion.div key={practice.title} initial="hidden" animate="visible" custom={i + 25} variants={fadeUp}>
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
      <motion.div initial="hidden" animate="visible" custom={31} variants={fadeUp}>
        <Card className="bg-muted/30 border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Your Provider Sees Your Progress
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              Every step you complete is recorded and visible to Dr. Egbert in your client profile. Your provider uses this data to assess how well your protocols are working, identify areas where you may need support, and make informed adjustments to your treatment plan.
            </p>
            <p className="text-sm text-muted-foreground leading-[1.7]">
              You do not need to send progress reports separately -- your daily completions are automatically tracked. If you have questions about any protocol or need modifications, reach out through the Messages page or bring it up at your next appointment.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={32}
        variants={fadeUp}
        className="flex flex-col sm:flex-row justify-center gap-3 pb-8"
      >
        <Link href="/patient/protocols">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-medium transition-all duration-300">
            <ClipboardList className="w-4 h-4" strokeWidth={1.4} />
            Go to Protocols
          </Button>
        </Link>
        <Link href="/patient/schedule">
          <Button variant="outline" className="gap-2 rounded-sm font-medium transition-all duration-300">
            <Calendar className="w-4 h-4" strokeWidth={1.4} />
            View Schedule
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
