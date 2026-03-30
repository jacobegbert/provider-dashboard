/**
 * PatientServiceAgreement — CellRx Concierge Service Agreement
 * Displays the Black Label Concierge Medicine Agreement
 * Design: The Row — Quiet luxury, editorial minimalism, museum-placard styling
 * Note: Styling uses semantic tokens that resolve to The Row palette via .theme-feminine CSS
 */
import { motion } from "framer-motion";
import {
  Phone,
  FlaskConical,
  Stethoscope,
  Pill,
  Dna,
  Apple,
  Dumbbell,
  Syringe,
  ClipboardList,
  Download,
  Handshake,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const PDF_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/CellRxConciergeServiceAgreement(2)_225219fd.pdf";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const services = [
  {
    icon: Phone,
    title: "Direct Physician Access",
    description:
      "Direct access to Dr. Egbert personally via cell phone for ongoing medical communication and consultation.",
  },
  {
    icon: FlaskConical,
    title: "Comprehensive Lab Panels",
    description:
      "Quarterly comprehensive lab panels with in-depth review to monitor and optimize biomarkers across hormonal, metabolic, and longevity domains.",
  },
  {
    icon: Stethoscope,
    title: "Medical Oversight",
    description:
      "Medical oversight and consultation of general medical needs and treatments.",
  },
  {
    icon: Pill,
    title: "Hormone Therapy Management",
    description:
      "Ongoing supervision, dosing optimization, and follow-up for hormone therapy protocols.",
  },
  {
    icon: Dna,
    title: "Peptide Therapy Protocols",
    description:
      "Tailored protocols for performance, recovery, and cellular optimization. The plan includes all peptides.",
  },
  {
    icon: Apple,
    title: "Nutritional Guidance",
    description:
      "Nutritional and supplement guidance aligned with your health goals. Does not include food, supplements, or third-party nutritionist services.",
  },
  {
    icon: Dumbbell,
    title: "Training & Performance Guidance",
    description:
      "High-level direction for physical conditioning and recovery. Does not include a personal trainer.",
  },
  {
    icon: Syringe,
    title: "Advanced Biologics (Elevated Package)",
    description:
      "20cc of advanced biologics, which may include stem cells, exosomes, Wharton's jelly, or amniotic fluid, administered via IV infusion or targeted injection procedures as clinically indicated.",
    elevated: true,
  },
  {
    icon: ClipboardList,
    title: "Prescription Management",
    description:
      "Medications called in to your preferred local pharmacy as needed.",
  },
];

const pricingTiers = [
  { label: "Individual", price: "$28,000", period: "/year" },
  { label: "Couple", price: "$48,000", period: "/year" },
  {
    label: "Elevated Individual",
    price: "$40,000",
    period: "/year",
    elevated: true,
  },
  {
    label: "Elevated Couple",
    price: "$72,000",
    period: "/year",
    elevated: true,
  },
];

export default function PatientServiceAgreement() {
  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12 space-y-10 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/patient">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.4} />
          <span className="tracking-wide">Back to Dashboard</span>
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
          <Handshake className="w-4 h-4 text-muted-foreground" strokeWidth={1.4} />
          <span className="text-[10px] font-medium text-muted-foreground tracking-[0.2em] uppercase">
            Concierge Medicine Agreement
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-normal text-foreground tracking-tight">
          Black Label Concierge Medicine
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          One-Year Optimization and Regenerative Care Plan
        </p>
        <div className="h-px bg-border/40 mx-auto max-w-xs mt-6" />
      </motion.div>

      {/* Introduction */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8">
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              This agreement outlines your personalized concierge medicine
              partnership with CellRx, designed to deliver the highest level of
              individualized care in performance, regenerative, and functional
              medicine. Our partnership focuses on optimizing your health,
              longevity, and resilience through advanced biologic and integrative
              therapies.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Scope of Services */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Scope of Care & Services
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              As a Black Label concierge client, you will receive:
            </p>
          </div>

          <div className="grid gap-3">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial="hidden"
                  animate="visible"
                  custom={i + 3}
                  variants={fadeUp}
                >
                  <Card
                    className={`bg-card border-border/40 rounded-sm shadow-none hover:border-border transition-all duration-300 ${
                      service.elevated
                        ? "border-accent/40 bg-accent/[0.03]"
                        : ""
                    }`}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${
                            service.elevated
                              ? "bg-accent/10 text-accent-foreground"
                              : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.4} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-normal text-foreground text-sm sm:text-base">
                              {service.title}
                            </h3>
                            {service.elevated && (
                              <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-accent-foreground bg-accent/10 px-2 py-0.5 rounded-sm border border-accent/20">
                                Elevated Package
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-[1.7]">
                            {service.description}
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

      {/* Partnership & Philosophy */}
      <motion.div initial="hidden" animate="visible" custom={12} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Handshake className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
              <h2 className="text-lg font-heading font-normal text-foreground tracking-tight">
                Partnership & Philosophy
              </h2>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-[1.8]">
              This agreement represents a true medical partnership. My role
              extends beyond traditional clinical oversight{" \u2014 "}I act as your
              personal physician and advisor in all medical pursuits, ensuring
              that each decision supports the pursuit of peak vitality, clarity,
              and longevity.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Program Investment */}
      <motion.div initial="hidden" animate="visible" custom={13} variants={fadeUp}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground" strokeWidth={1.4} />
            <h2 className="text-lg sm:text-xl font-heading font-normal text-foreground tracking-tight">
              Program Investment
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Annual investment covering one year of comprehensive care and direct
            access.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.label}
                className={`bg-card border-border/40 rounded-sm shadow-none ${
                  tier.elevated
                    ? "border-accent/40 bg-accent/[0.03]"
                    : ""
                }`}
              >
                <CardContent className="p-5 sm:p-6 text-center space-y-3">
                  <p className="text-[11px] font-medium text-muted-foreground tracking-[0.2em] uppercase">
                    {tier.label}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl sm:text-3xl font-heading font-normal text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  </div>
                  {tier.elevated && (
                    <span className="inline-block text-[10px] tracking-[0.15em] uppercase font-medium text-accent-foreground bg-accent/10 px-2 py-0.5 rounded-sm border border-accent/20">
                      Includes Advanced Biologics
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Closing & Signature */}
      <motion.div initial="hidden" animate="visible" custom={14} variants={fadeUp}>
        <Card className="bg-card border-border/40 rounded-sm shadow-none">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <p className="text-sm sm:text-base text-foreground/80 leading-[1.8] italic font-heading">
              "I look forward to working closely with you in advancing your
              health and performance through precision medicine."
            </p>
            <div className="h-px bg-border/40" />
            <div className="space-y-1">
              <p className="text-sm font-heading font-medium text-foreground">
                Dr. Jacob Egbert, DO
              </p>
              <p className="text-xs text-muted-foreground tracking-wide">
                Medical Director | CellRx
              </p>
              <p className="text-xs text-muted-foreground">
                3098 Executive Parkway, Suite 100{" \u2014 "}Lehi, Utah 84043
              </p>
              <p className="text-xs text-muted-foreground">
                jacob@cellrx.bio | 435-938-8657
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Download PDF */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={15}
        variants={fadeUp}
        className="flex justify-center pb-8"
      >
        <Button
          variant="outline"
          className="gap-2 border-border/40 text-foreground hover:bg-muted/30 hover:border-border rounded-sm transition-all duration-300"
          onClick={() => window.open(PDF_URL, "_blank")}
        >
          <Download className="w-4 h-4" strokeWidth={1.4} />
          Download Full Agreement (PDF)
        </Button>
      </motion.div>
    </div>
  );
}
