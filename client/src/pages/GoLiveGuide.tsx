import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Rocket,
  Globe,
  Shield,
  Database,
  Smartphone,
  LayoutDashboard,
  Palette,
  Lock,
  ListChecks,
  HelpCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Monitor,
  Apple,
  Chrome,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChecklistItem {
  id: string;
  label: string;
  section: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "checkpoint", label: "Create a checkpoint", section: "publishing" },
  { id: "publish", label: 'Click "Publish" in Management UI', section: "publishing" },
  { id: "domain", label: "Set up custom domain", section: "publishing" },
  { id: "provider-access", label: "Verify provider login works", section: "auth" },
  { id: "patient-access", label: "Test patient login flow", section: "auth" },
  { id: "team-admin", label: "Promote team members to admin", section: "auth" },
  { id: "seed-protocols", label: "Seed real treatment protocols", section: "data" },
  { id: "add-patients", label: "Add real patient records", section: "data" },
  { id: "schedule-appts", label: "Create appointment schedule", section: "data" },
  { id: "remove-demo", label: "Remove demo/sample data", section: "data" },
  { id: "pwa-test-ios", label: "Test PWA install on iPhone", section: "pwa" },
  { id: "pwa-test-android", label: "Test PWA install on Android", section: "pwa" },
  { id: "pwa-test-desktop", label: "Test PWA install on desktop", section: "pwa" },
  { id: "attention-queue", label: "Review Attention Queue daily workflow", section: "operations" },
  { id: "messaging-test", label: "Send a test message to patient", section: "operations" },
  { id: "protocol-assign", label: "Assign a protocol to a patient", section: "operations" },
  { id: "analytics-check", label: "Review analytics dashboard", section: "operations" },
  { id: "security-review", label: "Complete security review", section: "security" },
  { id: "pilot-patients", label: "Onboard 2-3 pilot patients", section: "nextsteps" },
];

const SECTIONS = [
  { id: "overview", label: "Overview", icon: Rocket },
  { id: "publishing", label: "Publishing", icon: Globe },
  { id: "auth", label: "Authentication", icon: Shield },
  { id: "data", label: "Populating Data", icon: Database },
  { id: "pwa", label: "PWA Install", icon: Smartphone },
  { id: "operations", label: "Day-to-Day Ops", icon: LayoutDashboard },
  { id: "design", label: "Design Changes", icon: Palette },
  { id: "security", label: "Security", icon: Lock },
  { id: "nextsteps", label: "Next Steps", icon: ListChecks },
  { id: "help", label: "Getting Help", icon: HelpCircle },
];

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "blm-golive-checklist";

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(checked: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked)));
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GoLiveGuide() {
  const [checked, setChecked] = useState<Set<string>>(loadChecked);
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  }, []);

  const progress = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);

  // Intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const section of SECTIONS) {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sectionChecklist = (sectionId: string) =>
    CHECKLIST_ITEMS.filter((item) => item.section === sectionId);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground leading-none">BL</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-lg font-semibold truncate">
                Go-Live Walkthrough
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Black Label Medicine — Concierge Optimization
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              <span>
                {checked.size}/{CHECKLIST_ITEMS.length} complete
              </span>
            </div>
            <div className="w-24 sm:w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* ── Sidebar nav (desktop) ──────────────────────────────────── */}
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                const sectionItems = sectionChecklist(s.id);
                const sectionDone = sectionItems.length > 0
                  ? sectionItems.every((i) => checked.has(i.id))
                  : false;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gold/10 text-gold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{s.label}</span>
                    {sectionDone && sectionItems.length > 0 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── Main content ──────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-12 pb-20">
            {/* ── 1. Overview ──────────────────────────────────────────── */}
            <section
              id="overview"
              ref={(el) => { sectionRefs.current["overview"] = el; }}
            >
              <SectionHeader number={1} title="Overview" icon={Rocket} />
              <Card className="bg-gradient-to-br from-sage/5 to-stone border-gold/15">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-foreground leading-relaxed">
                    Your concierge medicine platform is a fully functional web application with two
                    portals — a <strong>Provider Dashboard</strong> for you and your team, and a{" "}
                    <strong>Patient Portal</strong> for your clients. It is built on a
                    production-grade stack (React, Express, PostgreSQL) and is hosted on the Manus
                    platform with built-in SSL, custom domain support, and one-click publishing.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    This walkthrough guides you through every step from publishing the app to
                    onboarding your first patients, and then explains exactly how to request design
                    changes once it is live.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <MiniStat label="Portals" value="2" detail="Provider + Patient" />
                    <MiniStat label="Database Tables" value="11" detail="Full data model" />
                    <MiniStat label="PWA Ready" value="Yes" detail="Install on any device" />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── 2. Publishing ────────────────────────────────────────── */}
            <section
              id="publishing"
              ref={(el) => { sectionRefs.current["publishing"] = el; }}
            >
              <SectionHeader number={2} title="Publishing Your App" icon={Globe} />

              <div className="space-y-4">
                <StepCard
                  step={1}
                  title="Create a Checkpoint"
                  checkId="checkpoint"
                  checked={checked.has("checkpoint")}
                  onToggle={toggle}
                >
                  <p>
                    A checkpoint is already saved from the current build. You can see it in the
                    Manus chat interface as a card labeled with the latest description. If you have
                    made any additional changes since then, ask me to save a new checkpoint first.
                  </p>
                </StepCard>

                <StepCard
                  step={2}
                  title='Click "Publish"'
                  checkId="publish"
                  checked={checked.has("publish")}
                  onToggle={toggle}
                >
                  <p>
                    Open the <strong>Management UI</strong> panel (the right-side panel in your
                    Manus workspace). In the top-right header area, you will see a{" "}
                    <strong>Publish</strong> button. Click it. The platform will build and deploy
                    your app to a live URL within a few minutes.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    After publishing, your app will be accessible at a URL like{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      https://your-prefix.manus.space
                    </code>
                  </p>
                </StepCard>

                <StepCard
                  step={3}
                  title="Set Up Your Domain"
                  checkId="domain"
                  checked={checked.has("domain")}
                  onToggle={toggle}
                >
                  <p className="mb-3">
                    Navigate to <strong>Settings &gt; Domains</strong> in the Management UI. You
                    have three options:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">Option</th>
                          <th className="text-left py-2 pr-4 font-semibold">How It Works</th>
                          <th className="text-left py-2 font-semibold">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">Default subdomain</td>
                          <td className="py-2 pr-4">Edit the auto-generated prefix</td>
                          <td className="py-2">Free</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">Purchase new domain</td>
                          <td className="py-2 pr-4">Buy a domain directly within Manus</td>
                          <td className="py-2">Varies</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-medium text-foreground">Bind existing domain</td>
                          <td className="py-2 pr-4">Point your DNS records to Manus</td>
                          <td className="py-2">Free</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Recommended:{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      portal.blacklabelmedicine.com
                    </code>
                  </p>
                </StepCard>
              </div>
            </section>

            {/* ── 3. Authentication ────────────────────────────────────── */}
            <section
              id="auth"
              ref={(el) => { sectionRefs.current["auth"] = el; }}
            >
              <SectionHeader number={3} title="Authentication & Access Control" icon={Shield} />

              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-foreground leading-relaxed mb-4">
                      The app uses <strong>Manus OAuth</strong> for authentication. When a user
                      visits your app and tries to access a protected area, they are redirected to
                      a login page.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gold/5 border border-gold/15">
                        <h4 className="font-heading font-semibold text-gold mb-2">
                          Provider Access
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          The Provider Dashboard at <code className="bg-muted px-1 py-0.5 rounded text-xs">/provider</code> is
                          for you and staff. The system recognizes your account by the{" "}
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">OWNER_OPEN_ID</code> environment
                          variable. Promote team members to admin via the database.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                        <h4 className="font-heading font-semibold text-red-400 mb-2">
                          Patient Access
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Patients log in through the same OAuth flow. The system matches their
                          account to a patient record via the{" "}
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">userId</code> field on the patients
                          table.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-heading">
                      Patient Onboarding Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {[
                        { text: "You or your assistant creates the patient record via the Provider Dashboard's Clients page.", id: "provider-access" },
                        { text: "You assign protocols to the patient using the Protocol Builder.", id: "patient-access" },
                        { text: "You share the portal URL with the patient and instruct them to log in.", id: "team-admin" },
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <button
                            onClick={() => toggle(item.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {checked.has(item.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-gold" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/40" />
                            )}
                          </button>
                          <span className={`text-sm leading-relaxed ${checked.has(item.id) ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            <strong>Step {i + 1}:</strong> {item.text}
                          </span>
                        </li>
                      ))}
                      <li className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-gold/40 mt-0.5 shrink-0" />
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          The patient sees their assigned protocols, messages, and appointments.
                        </span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ── 4. Populating Data ───────────────────────────────────── */}
            <section
              id="data"
              ref={(el) => { sectionRefs.current["data"] = el; }}
            >
              <SectionHeader number={4} title="Populating Real Data" icon={Database} />

              <div className="space-y-4">
                <StepCard
                  title="Add Your Real Protocols"
                  checkId="seed-protocols"
                  checked={checked.has("seed-protocols")}
                  onToggle={toggle}
                >
                  <p>
                    Ask me to seed the database with your actual treatment protocols. For example:
                  </p>
                  <blockquote className="mt-3 border-l-4 border-gold/20 pl-4 py-2 bg-gold/5 rounded-r-lg text-sm italic text-muted-foreground">
                    "Add a Gut Restoration Protocol with the following steps: Week 1-2 elimination
                    diet, Week 3-4 introduce bone broth and fermented foods, Week 5-8 targeted
                    supplementation with L-glutamine and probiotics, Week 9-12 reintroduction
                    phase with food diary tracking."
                  </blockquote>
                </StepCard>

                <StepCard
                  title="Add Real Patient Records"
                  checkId="add-patients"
                  checked={checked.has("add-patients")}
                  onToggle={toggle}
                >
                  <p className="mb-3">
                    Add patients through the Provider Dashboard's Clients interface, or ask me to
                    bulk-create records. Each patient record supports:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Name, email, phone", "Date of birth", "Status", "Subscription tier", "Health goals", "Conditions", "Clinical notes"].map(
                      (field) => (
                        <div
                          key={field}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground"
                        >
                          {field}
                        </div>
                      )
                    )}
                  </div>
                </StepCard>

                <StepCard
                  title="Schedule Appointments"
                  checkId="schedule-appts"
                  checked={checked.has("schedule-appts")}
                  onToggle={toggle}
                >
                  <p>
                    Use the Provider Dashboard's Schedule page to create appointments. The calendar
                    view shows all appointments by month, and you can click any day to see details.
                    Your assistant can manage the schedule without needing an external booking tool.
                  </p>
                </StepCard>

                <StepCard
                  title="Remove Demo Data"
                  checkId="remove-demo"
                  checked={checked.has("remove-demo")}
                  onToggle={toggle}
                >
                  <p>
                    The database currently contains seed data (Sarah Mitchell, sample protocols,
                    sample messages). Ask me to clear the demo data and replace it with your real
                    patient roster once you are ready.
                  </p>
                </StepCard>
              </div>
            </section>

            {/* ── 5. PWA ───────────────────────────────────────────────── */}
            <section
              id="pwa"
              ref={(el) => { sectionRefs.current["pwa"] = el; }}
            >
              <SectionHeader number={5} title="PWA Installation (Home Screen App)" icon={Smartphone} />

              <Card className="mb-4">
                <CardContent className="pt-6">
                  <p className="text-foreground leading-relaxed">
                    Your app is a <strong>Progressive Web App</strong>, which means patients can
                    install it on their phone's home screen and it behaves like a native app — with
                    its own icon, splash screen, and full-screen experience. Include these
                    instructions in your patient welcome packet.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PWACard
                  icon={Apple}
                  platform="iPhone (Safari)"
                  checkId="pwa-test-ios"
                  checked={checked.has("pwa-test-ios")}
                  onToggle={toggle}
                  steps={[
                    "Open the portal URL in Safari",
                    "Tap the Share button (square with arrow)",
                    'Scroll down and tap "Add to Home Screen"',
                    "Tap Add",
                  ]}
                />
                <PWACard
                  icon={Chrome}
                  platform="Android (Chrome)"
                  checkId="pwa-test-android"
                  checked={checked.has("pwa-test-android")}
                  onToggle={toggle}
                  steps={[
                    "Open the portal URL in Chrome",
                    'Chrome shows "Add to Home Screen" banner automatically',
                    'Or tap three-dot menu → "Install app"',
                  ]}
                />
                <PWACard
                  icon={Monitor}
                  platform="Desktop (Chrome/Edge)"
                  checkId="pwa-test-desktop"
                  checked={checked.has("pwa-test-desktop")}
                  onToggle={toggle}
                  steps={[
                    "Open the portal URL",
                    "Click the install icon in the address bar",
                    'Or three-dot menu → "Install Black Label Medicine"',
                  ]}
                />
              </div>
            </section>

            {/* ── 6. Day-to-Day Operations ─────────────────────────────── */}
            <section
              id="operations"
              ref={(el) => { sectionRefs.current["operations"] = el; }}
            >
              <SectionHeader number={6} title="Day-to-Day Operations" icon={LayoutDashboard} />

              <p className="text-foreground leading-relaxed mb-4">
                Once live, your daily workflow will center on the Provider Dashboard. Start each
                morning with the Attention Queue, then work through messages, appointments, and
                protocol reviews.
              </p>

              <div className="space-y-3">
                <FeatureCard
                  title="Attention Queue"
                  route="/provider/attention"
                  checkId="attention-queue"
                  checked={checked.has("attention-queue")}
                  onToggle={toggle}
                  description='Your "Who needs me today?" command center. Surfaces patients who need attention based on priority scoring: overdue tasks, unread messages, upcoming appointments, and new patients.'
                  badge="Start here daily"
                  badgeColor="bg-red-500/15 text-red-400"
                />
                <FeatureCard
                  title="Secure Messaging"
                  route="/provider/messages"
                  checkId="messaging-test"
                  checked={checked.has("messaging-test")}
                  onToggle={toggle}
                  description="Send and receive messages with patients. Messages are stored with sender/receiver tracking and read receipts. Supports text messages, system alerts, and automated notifications."
                />
                <FeatureCard
                  title="Protocol Management"
                  route="/provider/protocols"
                  checkId="protocol-assign"
                  checked={checked.has("protocol-assign")}
                  onToggle={toggle}
                  description="Create, edit, and assign multi-step care plans. Each protocol can have daily, weekly, or custom-frequency steps, milestones, and lab checkpoints. Assigned protocols appear in the patient portal with progress tracking."
                />
                <FeatureCard
                  title="Analytics"
                  route="/provider/analytics"
                  checkId="analytics-check"
                  checked={checked.has("analytics-check")}
                  onToggle={toggle}
                  description="View patient status distribution, growth metrics, and engagement data across your practice."
                />
              </div>
            </section>

            {/* ── 7. Design Changes ────────────────────────────────────── */}
            <section
              id="design"
              ref={(el) => { sectionRefs.current["design"] = el; }}
            >
              <SectionHeader number={7} title="How to Modify Design Elements" icon={Palette} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-gold/15">
                  <CardHeader>
                    <Badge className="w-fit bg-gold/15 text-gold border-0 mb-1">
                      No Code Required
                    </Badge>
                    <CardTitle className="text-base font-heading">
                      Method 1: Visual Editor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. Open the Management UI (right panel)</li>
                      <li>2. Click the Preview panel</li>
                      <li>3. Navigate to the page you want to edit</li>
                      <li>4. Click on any element (card, heading, button)</li>
                      <li>5. Adjust colors, spacing, borders, layout, typography</li>
                      <li>6. Or type a natural language description of the change</li>
                      <li>7. Changes auto-save and can be rolled back</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card className="border-red-500/20">
                  <CardHeader>
                    <Badge className="w-fit bg-red-500/15 text-red-400 border-0 mb-1">
                      Ask in Chat
                    </Badge>
                    <CardTitle className="text-base font-heading">
                      Method 2: Code Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      For substantial changes, describe what you want:
                    </p>
                    <div className="space-y-2">
                      {[
                        '"Change the sage green to a deeper forest green"',
                        '"Switch heading font from Outfit to Playfair Display"',
                        '"Add a quick-stats bar at the top of patient home"',
                        '"Add a Resources page with educational content"',
                      ].map((example) => (
                        <div
                          key={example}
                          className="text-xs px-3 py-2 rounded-md bg-muted/50 text-muted-foreground italic"
                        >
                          {example}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-transparent">
                    <span className="font-heading text-sm">Design System Reference</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-semibold">Element</th>
                              <th className="text-left py-2 pr-4 font-semibold">Value</th>
                              <th className="text-left py-2 font-semibold">Controls</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {[
                              ["Heading font", "Outfit", "All headings, brand text, nav labels"],
                              ["Body font", "Source Sans 3", "Paragraphs, forms, tables"],
                              ["Primary (sage)", "#5B8A72", "Buttons, active nav, progress bars"],
                              ["Accent (terracotta)", "#C4704B", "Badges, alerts, attention items"],
                              ["Background", "#FAF9F6", "Page backgrounds"],
                              ["Espresso", "#2C1810", "Logo badges, dark accents"],
                              ["Border radius", "0.75rem", "Cards, buttons, inputs"],
                              ["Stone", "#F5F0EB", "Subtle warm background tint"],
                            ].map(([element, value, controls]) => (
                              <tr key={element} className="border-b border-border/50">
                                <td className="py-2 pr-4 font-medium text-foreground">{element}</td>
                                <td className="py-2 pr-4">
                                  <div className="flex items-center gap-2">
                                    {value?.startsWith("#") && (
                                      <div
                                        className="w-4 h-4 rounded-sm border border-border/50"
                                        style={{ backgroundColor: value }}
                                      />
                                    )}
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {value}
                                    </code>
                                  </div>
                                </td>
                                <td className="py-2 text-xs">{controls}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </section>

            {/* ── 8. Security ──────────────────────────────────────────── */}
            <section
              id="security"
              ref={(el) => { sectionRefs.current["security"] = el; }}
            >
              <SectionHeader number={8} title="Security & Compliance" icon={Lock} />

              <StepCard
                title="Security Review Checklist"
                checkId="security-review"
                checked={checked.has("security-review")}
                onToggle={toggle}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-semibold">Area</th>
                        <th className="text-left py-2 pr-4 font-semibold">Current State</th>
                        <th className="text-left py-2 font-semibold">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {[
                        ["Authentication", "Manus OAuth + session cookies", "Sufficient for launch"],
                        ["Data encryption", "HTTPS/SSL on all connections", "No action needed"],
                        ["Audit logging", "Audit log table exists", "Wire up for PHI access events"],
                        ["Message storage", "Plain text in database", "Consider at-rest encryption"],
                        ["Access control", "Role-based (admin/user)", "Sufficient for current scale"],
                        ["Data backup", "Managed by Manus platform", "Confirm backup frequency"],
                        ["BAA", "Not yet in place", "Contact Manus support if needed"],
                      ].map(([area, state, rec]) => (
                        <tr key={area} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">{area}</td>
                          <td className="py-2 pr-4">{state}</td>
                          <td className="py-2 text-xs">{rec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  For a 100-patient concierge practice, the current architecture is appropriate. As
                  you scale or if regulatory requirements change, additional security layers can be
                  added.
                </p>
              </StepCard>
            </section>

            {/* ── 9. Next Steps ────────────────────────────────────────── */}
            <section
              id="nextsteps"
              ref={(el) => { sectionRefs.current["nextsteps"] = el; }}
            >
              <SectionHeader number={9} title="Recommended Next Steps" icon={ListChecks} />

              <div className="space-y-4">
                <RoadmapPhase
                  title="Immediate (Before First Patient)"
                  items={[
                    "Publish the app — Click Publish in the Management UI",
                    "Set up your custom domain — Configure portal.blacklabelmedicine.com",
                    "Seed real protocols — Tell me your actual treatment protocols",
                    "Remove demo data — Replace sample data with your real patient roster",
                  ]}
                />
                <RoadmapPhase
                  title="Short-Term (First Month)"
                  items={[
                    "Wire patient portal to database — Each patient sees only their own data",
                    "Add appointment creation form — Your assistant can schedule directly",
                    "Test with 2-3 pilot patients — Onboard a small group and iterate",
                  ]}
                />
                <RoadmapPhase
                  title="Medium-Term (Months 2-3)"
                  items={[
                    "Add lab result tracking — File upload for lab PDFs with annotation",
                    "Build patient intake form — Digital questionnaire feeds into patient record",
                    "Expand notification system — Email reminders for appointments and tasks",
                  ]}
                />
              </div>

              <div className="mt-4">
                <StepCard
                  title="Onboard Pilot Patients"
                  checkId="pilot-patients"
                  checked={checked.has("pilot-patients")}
                  onToggle={toggle}
                >
                  <p>
                    Once you have published and seeded real data, onboard 2-3 pilot patients.
                    Gather their feedback on the patient portal experience, then iterate before
                    rolling out to your full roster.
                  </p>
                </StepCard>
              </div>
            </section>

            {/* ── 10. Getting Help ─────────────────────────────────────── */}
            <section
              id="help"
              ref={(el) => { sectionRefs.current["help"] = el; }}
            >
              <SectionHeader number={10} title="Getting Help" icon={HelpCircle} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gold/5 border-gold/15">
                  <CardContent className="pt-6 text-center">
                    <Palette className="h-8 w-8 text-gold mx-auto mb-3" />
                    <h4 className="font-heading font-semibold mb-1">Design & Features</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask me directly in chat. I can modify any part of the application.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-stone border-stone-dark">
                  <CardContent className="pt-6 text-center">
                    <Globe className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                    <h4 className="font-heading font-semibold mb-1">Domain & Hosting</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the Management UI's Settings panel, or ask me for guidance.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/15">
                  <CardContent className="pt-6 text-center">
                    <HelpCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <h4 className="font-heading font-semibold mb-1">Billing & Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Submit requests at{" "}
                      <a
                        href="https://help.manus.im"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold underline underline-offset-2"
                      >
                        help.manus.im
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 bg-gradient-to-r from-sage/10 to-terracotta/10 border-gold/15">
                <CardContent className="pt-6 text-center">
                  <Rocket className="h-10 w-10 text-gold mx-auto mb-3" />
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    Your platform is ready to publish.
                  </h3>
                  <p className="text-muted-foreground">
                    Let me know when you would like to proceed with any of the steps above.
                  </p>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({
  number,
  title,
  icon: Icon,
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <h2 className="font-heading text-xl font-semibold text-foreground">
        <span className="text-muted-foreground mr-1">{number}.</span> {title}
      </h2>
    </div>
  );
}

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-card border border-border/50">
      <div className="text-2xl font-heading font-bold text-gold">{value}</div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function StepCard({
  step,
  title,
  checkId,
  checked,
  onToggle,
  children,
}: {
  step?: number;
  title: string;
  checkId: string;
  checked: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={`transition-colors ${checked ? "bg-gold/5 border-gold/15" : ""}`}>
      <CardContent className="pt-5">
        <div className="flex gap-3">
          <button onClick={() => onToggle(checkId)} className="mt-0.5 shrink-0">
            {checked ? (
              <CheckCircle2 className="h-5 w-5 text-gold" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <h3
              className={`font-heading font-semibold mb-2 ${
                checked ? "text-gold line-through" : "text-foreground"
              }`}
            >
              {step !== undefined && (
                <span className="text-muted-foreground mr-1">Step {step}:</span>
              )}
              {title}
            </h3>
            <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  title,
  route,
  checkId,
  checked,
  onToggle,
  description,
  badge,
  badgeColor,
}: {
  title: string;
  route: string;
  checkId: string;
  checked: boolean;
  onToggle: (id: string) => void;
  description: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Card className={`transition-colors ${checked ? "bg-gold/5 border-gold/15" : ""}`}>
      <CardContent className="pt-5">
        <div className="flex gap-3">
          <button onClick={() => onToggle(checkId)} className="mt-0.5 shrink-0">
            {checked ? (
              <CheckCircle2 className="h-5 w-5 text-gold" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3
                className={`font-heading font-semibold ${
                  checked ? "text-gold" : "text-foreground"
                }`}
              >
                {title}
              </h3>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {route}
              </code>
              {badge && (
                <Badge className={`text-xs border-0 ${badgeColor || "bg-gold/15 text-gold"}`}>
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PWACard({
  icon: Icon,
  platform,
  checkId,
  checked,
  onToggle,
  steps,
}: {
  icon: React.ComponentType<{ className?: string }>;
  platform: string;
  checkId: string;
  checked: boolean;
  onToggle: (id: string) => void;
  steps: string[];
}) {
  return (
    <Card className={`transition-colors ${checked ? "bg-gold/5 border-gold/15" : ""}`}>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3 mb-3">
          <button onClick={() => onToggle(checkId)} className="mt-0.5 shrink-0">
            {checked ? (
              <CheckCircle2 className="h-5 w-5 text-gold" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
            )}
          </button>
          <div>
            <Icon className="h-5 w-5 text-foreground mb-1" />
            <h4 className="font-heading font-semibold text-sm">{platform}</h4>
          </div>
        </div>
        <ol className="space-y-1.5 text-xs text-muted-foreground ml-8">
          {steps.map((s, i) => (
            <li key={i}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function RoadmapPhase({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <ChevronRight className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
