/**
 * ConciergeLanding — Public-facing sales page for Black Label Concierge Medicine.
 * Accessible at /concierge without authentication. Designed to be sent to prospects.
 * Communicates the One-Year Optimization Plan in a compelling,
 * editorial way — pulls bio/credentials from cellrx.bio, presents services + pricing
 * with quiet-luxury aesthetic.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Check,
  Quote,
  FlaskConical,
  Stethoscope,
  Pill,
  Dna,
  Apple,
  Dumbbell,
  Syringe,
  ClipboardList,
  PhoneCall,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PHYSICIAN_PORTRAIT =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663367412750/C7tmEBqytWZc3WMCpXZgAW/physician_portrait_d5fe25e9.webp";
const CONSULTATION_PHOTO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663367412750/C7tmEBqytWZc3WMCpXZgAW/consultation_photo_de51af6c.webp";
const SERVICE_BLACK_LABEL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663367412750/C7tmEBqytWZc3WMCpXZgAW/service_black_label_1c68d442.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0, 0, 0.2, 1] as const },
  }),
};

const services = [
  {
    icon: PhoneCall,
    title: "Direct Physician Access",
    description:
      "Reach Dr. Egbert personally — by cell phone, text, or secure message. No gatekeepers. No call centers. No 7-minute appointments.",
  },
  {
    icon: FlaskConical,
    title: "Quarterly Lab Panels",
    description:
      "Comprehensive biomarker review across hormonal, metabolic, and longevity domains — interpreted personally, optimized continuously.",
  },
  {
    icon: Stethoscope,
    title: "Whole-Person Oversight",
    description:
      "Medical oversight and consultation across all of your general medical needs, coordinated under one physician.",
  },
  {
    icon: Pill,
    title: "Hormone Therapy Management",
    description:
      "Ongoing supervision, precision dosing, and follow-up for hormone protocols engineered to your physiology.",
  },
  {
    icon: Dna,
    title: "Peptide Therapy Protocols",
    description:
      "Tailored protocols for performance, recovery, and cellular optimization. All peptides included in your plan.",
  },
  {
    icon: Apple,
    title: "Nutritional Guidance",
    description:
      "Strategic nutrition and supplementation aligned with your goals, biomarkers, and lifestyle.",
  },
  {
    icon: Dumbbell,
    title: "Training & Performance",
    description:
      "Physician-directed guidance on physical conditioning, recovery, and the inputs that move biomarkers.",
  },
  {
    icon: ClipboardList,
    title: "Prescription Management",
    description:
      "Medications called in to your preferred local pharmacy as needed — no friction, no waiting.",
  },
  {
    icon: Syringe,
    title: "Advanced Biologics",
    elevated: true,
    description:
      "20cc of advanced biologics — stem cells, exosomes, Wharton's jelly, or amniotic fluid — administered by IV or targeted injection as clinically indicated.",
  },
];

const pillars = [
  {
    number: "01",
    title: "Direct Physician Access",
    text: "Reach Dr. Egbert personally — by cell phone, text, or secure message. No call centers. No gatekeepers. No 7-minute appointments. The medical relationship most patients only read about.",
  },
  {
    number: "02",
    title: "Built Around You",
    text: "Every protocol is engineered from your labs, your physiology, and your goals. Nothing here is one-size-fits-all. Nothing here is generic.",
  },
  {
    number: "03",
    title: "Proactive, Not Reactive",
    text: "The goal is not the absence of disease. The goal is peak vitality, clarity, and longevity — and that requires intervention before symptoms exist.",
  },
  {
    number: "04",
    title: "Continuous Optimization",
    text: "Quarterly biomarker reviews. Ongoing dose refinement. A physician who tracks the numbers as carefully as you do — and adjusts in real time.",
  },
];

const pricingTiers = [
  {
    label: "Individual",
    price: "$28,000",
    period: "/year",
    description: "Complete concierge care for one client.",
    features: [
      "Direct physician access",
      "Quarterly lab panels",
      "Hormone & peptide protocols",
      "Nutritional & training guidance",
      "Prescription management",
    ],
  },
  {
    label: "Couple",
    price: "$48,000",
    period: "/year",
    description: "Same protocol, designed for two.",
    features: [
      "Everything in Individual — for two",
      "Coordinated care across partners",
      "Shared longevity roadmap",
    ],
  },
  {
    label: "Elevated Individual",
    price: "$40,000",
    period: "/year",
    description: "Adds 20cc of advanced biologics for clients who want them.",
    elevated: true,
    features: [
      "Everything in Individual",
      "20cc advanced biologics included",
      "Administered by IV or targeted injection",
      "As clinically indicated",
    ],
  },
  {
    label: "Elevated Couple",
    price: "$72,000",
    period: "/year",
    description: "Elevated tier for two.",
    elevated: true,
    features: [
      "Everything in Elevated Individual — for two",
      "20cc advanced biologics each",
      "Coordinated protocols",
    ],
  },
];

function TextMark({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-[15px] font-semibold tracking-[0.2em] uppercase text-foreground leading-none">
        Black Label
      </span>
      <span className="block text-[10px] font-medium tracking-[0.35em] uppercase text-muted-foreground leading-tight mt-0.5">
        Medicine
      </span>
    </div>
  );
}

export default function ConciergeLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── NAVIGATION BAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <TextMark />
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground text-sm hidden md:block transition-colors"
            >
              Investment
            </a>
            <a
              href="mailto:jacob@cellrx.bio?subject=Black%20Label%20Concierge%20Inquiry"
            >
              <Button
                size="sm"
                className="bg-foreground hover:bg-foreground/90 text-background font-heading font-semibold px-5"
              >
                Inquire
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left: Copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="order-2 lg:order-1"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-xs tracking-[0.35em] uppercase font-heading font-light text-muted-foreground">
                Concierge Medicine — by Invitation
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05] tracking-tight mb-6 text-foreground">
              The medicine
              <br />
              <span className="italic font-light">
                you've been promised
              </span>
              <br />
              actually exists.
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed font-body mb-10 max-w-xl">
              A one-year partnership with Dr. Jacob Egbert, DO — built around
              your physiology, your goals, and the kind of medical relationship
              that doesn't exist on a 7-minute schedule. Performance. Clarity.
              Longevity.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <a href="#what-you-get">
                <Button
                  size="lg"
                  className="bg-foreground hover:bg-foreground/90 text-background font-heading font-semibold px-8 py-6 text-base"
                >
                  What's Included
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted font-heading px-8 py-6 text-base"
                >
                  View Investment
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground tracking-wider">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>10+ Years Clinical Experience</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                <span>500+ Patients</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none overflow-hidden rounded-sm bg-muted">
              <img
                src={PHYSICIAN_PORTRAIT}
                alt="Dr. Jacob Egbert, DO"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-foreground/85 backdrop-blur-md rounded-sm px-5 py-4 border border-background/10">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-background font-mono mb-1">
                    Dr. Jacob Egbert, DO
                  </p>
                  <p className="font-serif text-xl text-background">
                    Concierge Physician
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PHYSICIAN BIO ─── */}
      <section className="py-24 px-6 bg-muted/30 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <span className="text-xs tracking-[0.3em] uppercase font-heading text-muted-foreground block mb-4">
              The Physician
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground max-w-3xl mx-auto">
              A medical relationship,{" "}
              <span className="italic">not a transaction.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:col-span-2"
            >
              <div className="aspect-[3/4] rounded-sm overflow-hidden bg-muted">
                <img
                  src={CONSULTATION_PHOTO}
                  alt="Dr. Egbert in consultation"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="md:col-span-3 space-y-6"
            >
              <p className="text-foreground/90 leading-[1.8] font-body">
                Dr. Jacob Egbert is a board-certified physician who practices
                concierge optimization medicine — building protocols around
                each client's labs, physiology, and goals. His focus is the
                pursuit of peak vitality, clarity, and longevity through
                precision medicine.
              </p>
              <p className="text-foreground/90 leading-[1.8] font-body">
                Black Label is his concierge practice — a small, deliberately
                limited group of clients who receive the kind of medical
                relationship most patients only read about: unhurried, direct,
                and deeply personal.
              </p>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/40">
                <div>
                  <p className="font-serif text-2xl font-light text-foreground">
                    10+
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    Years Practicing
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-light text-foreground">
                    500+
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    Patients Treated
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-light text-foreground">
                    DO
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    Board Certified
                  </p>
                </div>
              </div>

              <div className="relative pl-6 mt-8 border-l-2 border-foreground/30">
                <Quote
                  className="absolute -top-2 -left-3 w-5 h-5 text-foreground/40 bg-muted/30 p-0.5"
                  strokeWidth={1.5}
                />
                <p className="font-serif italic text-foreground/80 leading-relaxed text-lg">
                  I look forward to working closely with you in advancing your
                  health and performance through precision medicine.
                </p>
                <p className="text-xs text-muted-foreground mt-3 tracking-wider">
                  — Dr. Jacob Egbert, DO
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PHILOSOPHY / PILLARS ─── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-20"
          >
            <span className="text-xs tracking-[0.3em] uppercase font-heading text-muted-foreground block mb-4">
              The Standard
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground">
              What separates this <span className="italic">from everything else.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group bg-card border border-border/60 rounded-sm p-8 hover:border-foreground/30 transition-all duration-500"
              >
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground block mb-4">
                  {pillar.number}
                </span>
                <h3 className="font-serif text-2xl font-light text-foreground mb-4 leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-muted-foreground leading-[1.8] font-body">
                  {pillar.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ─── */}
      <section id="what-you-get" className="py-28 px-6 bg-muted/30 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-20"
          >
            <span className="text-xs tracking-[0.3em] uppercase font-heading text-muted-foreground block mb-4">
              The Plan
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground mb-6">
              One Year. <span className="italic">Everything Included.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-body">
              A complete optimization partnership. Not a package of à la carte
              services — a true medical relationship.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  custom={i * 0.5}
                  className={`bg-card border rounded-sm p-6 transition-all duration-300 ${
                    service.elevated
                      ? "border-foreground/40 bg-foreground/[0.02]"
                      : "border-border/60 hover:border-foreground/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${
                        service.elevated
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-heading font-medium text-foreground text-base">
                          {service.title}
                        </h3>
                        {service.elevated && (
                          <span className="text-[9px] tracking-[0.18em] uppercase font-medium text-foreground bg-foreground/10 px-2 py-0.5 rounded-sm border border-foreground/20">
                            Elevated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-[1.7] font-body">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRICING / INVESTMENT ─── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <span className="text-xs tracking-[0.3em] uppercase font-heading text-muted-foreground block mb-4">
              Investment
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground mb-6">
              Choose the partnership <span className="italic">that fits.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-body">
              Annual investment covers one year of comprehensive concierge care
              and direct access. Elevated tiers add advanced biologics for
              clients who want them.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className={`relative flex flex-col rounded-sm border p-7 transition-all duration-500 ${
                  tier.elevated ? "pt-12 " : ""
                }${
                  tier.elevated
                    ? "border-foreground bg-foreground text-background shadow-lg"
                    : "border-border/60 bg-card hover:border-foreground/30"
                }`}
              >
                {tier.elevated && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="inline-block whitespace-nowrap bg-background text-foreground text-[9px] tracking-[0.25em] uppercase font-medium px-3 py-1.5 rounded-sm border border-foreground shadow-sm">
                      Includes Biologics
                    </span>
                  </div>
                )}

                <p
                  className={`text-[10px] font-medium tracking-[0.25em] uppercase mb-3 ${
                    tier.elevated ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {tier.label}
                </p>

                <div className="flex items-baseline gap-1 mb-3">
                  <span
                    className={`font-serif text-3xl font-light ${
                      tier.elevated ? "text-background" : "text-foreground"
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm ${
                      tier.elevated ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {tier.period}
                  </span>
                </div>

                <p
                  className={`text-sm leading-relaxed font-body mb-6 ${
                    tier.elevated ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  {tier.description}
                </p>

                <div
                  className={`h-px mb-6 ${
                    tier.elevated ? "bg-background/20" : "bg-border/60"
                  }`}
                />

                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          tier.elevated ? "text-background" : "text-foreground"
                        }`}
                        strokeWidth={2}
                      />
                      <span
                        className={`text-xs leading-relaxed font-body ${
                          tier.elevated ? "text-background/90" : "text-foreground/80"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={5}
            className="text-center text-xs text-muted-foreground mt-10 tracking-wider"
          >
            Spots are deliberately limited. Inquire to confirm current availability.
          </motion.p>
        </div>
      </section>

      {/* ─── PARTNERSHIP STATEMENT ─── */}
      <section className="relative py-28 px-6 overflow-hidden border-t border-border/30">
        <div className="absolute inset-0 opacity-[0.04]">
          <img
            src={SERVICE_BLACK_LABEL}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          custom={0}
          className="relative max-w-3xl mx-auto text-center"
        >
          <span className="text-xs tracking-[0.3em] uppercase font-heading text-muted-foreground block mb-6">
            A True Partnership
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground mb-8">
            Beyond clinical oversight.
          </h2>
          <p className="text-muted-foreground text-lg leading-[1.8] font-body max-w-2xl mx-auto">
            This agreement is a medical partnership. Dr. Egbert acts as your
            personal physician and advisor in all medical pursuits — ensuring
            every decision supports the pursuit of peak vitality, clarity, and
            longevity.
          </p>
          <div className="mt-12">
            <a href="mailto:jacob@cellrx.bio?subject=Black%20Label%20Concierge%20Inquiry">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background font-heading font-semibold px-10 py-6 text-base"
              >
                Begin the Conversation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4 tracking-wider">
              Or call directly: 435-938-8657
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-14">
            <div>
              <div className="mb-4">
                <TextMark />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed font-body max-w-sm">
                Concierge optimization medicine — by invitation.
              </p>
            </div>

            <div>
              <h4 className="font-heading text-xs font-semibold text-foreground/70 uppercase tracking-[0.2em] mb-4">
                Dr. Jacob Egbert, DO
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground font-body">
                <li>Medical Director, CellRx</li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-foreground/40 shrink-0 mt-0.5" />
                  <span>
                    3098 Executive Parkway, Suite 100
                    <br />
                    Lehi, Utah 84043
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading text-xs font-semibold text-foreground/70 uppercase tracking-[0.2em] mb-4">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-foreground/40 shrink-0" />
                  <a
                    href="mailto:jacob@cellrx.bio"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors font-body"
                  >
                    jacob@cellrx.bio
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-foreground/40 shrink-0" />
                  <a
                    href="tel:+14359388657"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors font-body"
                  >
                    435-938-8657
                  </a>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors font-body"
                  >
                    Client Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground/60 text-xs font-mono">
              &copy; {new Date().getFullYear()} Black Label Medicine. All rights reserved.
            </p>
            <p className="text-muted-foreground/50 text-xs font-mono">
              This page does not constitute medical advice or a contract.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
