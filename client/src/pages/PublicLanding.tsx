/**
 * PublicLanding — Public-facing introduction page for Black Label Medicine.
 * Accessible at /main without authentication.
 * Showcases the practice, services, philosophy, and provides a login link.
 * Design: Clean, professional, masculine medical aesthetic with steel blue accents.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Brain,
  Dna,
  HeartPulse,
  Microscope,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/blacklabel-hero-landing-hD9qbtYkVoap6Wb6R3L9Fn.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

const services = [
  {
    icon: Dna,
    title: "Precision Diagnostics",
    description:
      "Advanced biomarker panels, genetic testing, and comprehensive lab work to build a complete picture of your health at the molecular level.",
  },
  {
    icon: Brain,
    title: "Cognitive Optimization",
    description:
      "Evidence-based protocols for mental clarity, focus, and long-term brain health — from nootropic strategies to neurofeedback guidance.",
  },
  {
    icon: HeartPulse,
    title: "Cardiovascular Health",
    description:
      "Proactive cardiac risk assessment, advanced lipid panels, and personalized protocols to optimize heart health and longevity.",
  },
  {
    icon: Microscope,
    title: "Hormone Optimization",
    description:
      "Comprehensive hormone panels with individualized replacement and optimization protocols tailored to your unique physiology.",
  },
  {
    icon: Shield,
    title: "Immune Resilience",
    description:
      "Strengthen your body's defenses through targeted supplementation, IV therapy protocols, and lifestyle interventions.",
  },
  {
    icon: Clock,
    title: "Longevity Medicine",
    description:
      "Cutting-edge anti-aging interventions including NAD+ therapy, peptide protocols, and cellular health optimization strategies.",
  },
];

const pillars = [
  {
    number: "01",
    title: "Unhurried Consultations",
    text: "Every visit is a deep-dive conversation — not a 7-minute appointment. We take the time to understand your full story.",
  },
  {
    number: "02",
    title: "Direct Provider Access",
    text: "Reach your provider directly via secure messaging, phone, or text. No gatekeepers, no waiting rooms, no runaround.",
  },
  {
    number: "03",
    title: "Personalized Protocols",
    text: "Every recommendation is built around your labs, genetics, lifestyle, and goals — never a one-size-fits-all approach.",
  },
  {
    number: "04",
    title: "Proactive, Not Reactive",
    text: "We identify and address health risks before they become problems. Prevention is the highest form of medicine.",
  },
];

/** Inline text mark used across the landing page */
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

export default function PublicLanding() {
  return (
    <div className="min-h-screen bg-white text-foreground overflow-x-hidden">
      {/* ─── NAVIGATION BAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <TextMark />
          <div className="flex items-center gap-3">
            <a
              href="tel:+18338888888"
              className="text-muted-foreground hover:text-steel text-sm hidden md:block transition-colors"
            >
              Contact
            </a>
            <Link href="/">
              <Button
                size="sm"
                className="bg-steel hover:bg-steel-dark text-white font-heading font-semibold px-5"
              >
                Client Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background image */}
        <img
          src={HERO_BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-block mb-8">
              <span className="text-2xl font-semibold tracking-[0.25em] uppercase text-navy leading-none">
                Black Label
              </span>
              <span className="block text-sm font-medium tracking-[0.4em] uppercase text-steel leading-tight mt-1">
                Medicine
              </span>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-12 bg-steel/40" />
              <span className="text-steel text-xs tracking-[0.35em] uppercase font-heading font-light">
                Concierge Optimization Medicine
              </span>
              <div className="h-px w-12 bg-steel/40" />
            </div>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight mb-6 text-navy"
          >
            Medicine Designed
            <br />
            <span className="text-steel">Around You</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-body mb-10"
          >
            Black Label Medicine delivers personalized, proactive healthcare
            through advanced diagnostics, individualized protocols, and
            direct provider access — because your health deserves more than
            a 7-minute appointment.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/">
              <Button
                size="lg"
                className="bg-steel hover:bg-steel-dark text-white font-heading font-semibold px-8 py-6 text-base"
              >
                Access Client Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#services">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:text-steel hover:border-steel/30 font-heading px-8 py-6 text-base"
              >
                Explore Services
              </Button>
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground/40 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ─── PHILOSOPHY SECTION ─── */}
      <section className="py-28 px-6 relative bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-20"
          >
            <span className="text-steel text-xs tracking-[0.3em] uppercase font-heading block mb-4">
              Our Philosophy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground">
              Healthcare Should Be{" "}
              <span className="text-steel">Personal</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-body">
              Traditional medicine treats symptoms. We treat the whole person —
              optimizing your biology, performance, and longevity through
              science-driven, deeply personalized care.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group bg-white border border-border/60 rounded-2xl p-8 hover:border-steel/20 hover:shadow-md transition-all duration-500"
              >
                <span className="text-steel/50 font-mono text-sm block mb-3">
                  {pillar.number}
                </span>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {pillar.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-body text-sm">
                  {pillar.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES SECTION ─── */}
      <section id="services" className="py-28 px-6 relative">
        {/* Subtle divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-steel/20 to-transparent" />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-20"
          >
            <span className="text-steel text-xs tracking-[0.3em] uppercase font-heading block mb-4">
              What We Do
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-foreground">
              Comprehensive <span className="text-steel">Services</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6 leading-relaxed font-body">
              From advanced diagnostics to personalized optimization protocols,
              every service is tailored to your unique biology and goals.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group bg-white border border-border/60 rounded-2xl p-7 hover:border-steel/20 hover:shadow-md transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-steel/10 flex items-center justify-center mb-5 group-hover:bg-steel/15 transition-colors">
                  <service.icon className="w-6 h-6 text-steel" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed font-body">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-28 px-6 relative bg-secondary/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-steel/20 to-transparent" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          custom={0}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-block mb-8 opacity-70">
            <span className="text-lg font-semibold tracking-[0.2em] uppercase text-navy leading-none">
              Black Label
            </span>
            <span className="block text-[9px] font-medium tracking-[0.35em] uppercase text-muted-foreground leading-tight mt-0.5">
              Medicine
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-6 text-foreground">
            Ready to <span className="text-steel">Optimize</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed font-body mb-10">
            Join a select group of individuals who refuse to settle for
            average health. Your journey to peak performance starts here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button
                size="lg"
                className="bg-steel hover:bg-steel-dark text-white font-heading font-semibold px-8 py-6 text-base"
              >
                Client Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <TextMark />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed font-body max-w-sm">
                Concierge optimization medicine — personalized, proactive
                healthcare designed around your unique biology and goals.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-heading text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#services"
                    className="text-muted-foreground hover:text-steel text-sm transition-colors font-body"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-steel text-sm transition-colors font-body"
                  >
                    Client Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-steel text-sm transition-colors font-body"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-steel text-sm transition-colors font-body"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-steel/60 shrink-0" />
                  <a
                    href="mailto:info@blacklabelmedicine.com"
                    className="text-muted-foreground hover:text-steel text-sm transition-colors font-body"
                  >
                    info@blacklabelmedicine.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-steel/60 shrink-0" />
                  <span className="text-muted-foreground text-sm font-body">
                    By Appointment Only
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-steel/60 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm font-body">
                    Serving clients nationwide
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground/60 text-xs font-mono">
              &copy; {new Date().getFullYear()} Black Label Medicine. All rights
              reserved.
            </p>
            <p className="text-muted-foreground/50 text-xs font-mono">
              This site does not provide medical advice. Consult your provider
              for personalized care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
