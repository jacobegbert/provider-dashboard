// PatientLayout.tsx — Black Label Medicine, Concierge Optimization
// Design: The Row — Quiet luxury, editorial minimalism, understated elegance
// Typography: Playfair Display (headings) + Inter (body)
// Palette: Warm Ivory / Bone / Charcoal / Antique Gold / Dusty Rose
// Responsive: sidebar navigation on desktop, bottom tabs on mobile

import { Link, useLocation } from "wouter";
import { Home, ClipboardList, ClipboardCheck, MessageCircle, Calendar, User, LogOut, FileText, Sparkles, Activity, Loader2, BookOpen, ScrollText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useViewAs } from "@/contexts/ViewAsContext";
import ViewAsBanner from "@/components/ViewAsBanner";

const tabs = [
  { path: "/patient", label: "Home", icon: Home },
  { path: "/patient/protocols", label: "Protocols", icon: ClipboardList },
  { path: "/patient/documents", label: "Documents", icon: FileText },
  { path: "/patient/messages", label: "Messages", icon: MessageCircle },
  { path: "/patient/schedule", label: "Schedule", icon: Calendar },
  { path: "/patient/vitals", label: "Biomarkers", icon: Activity },
  { path: "/patient/intake", label: "Intake Form", icon: ClipboardCheck },
  { path: "/patient/service-agreement", label: "Service Agreement", icon: ScrollText },
  { path: "/patient/resources", label: "Resources", icon: BookOpen },
  { path: "/patient/wellness-ai", label: "Wellness AI", icon: Sparkles },
  { path: "/patient/profile", label: "Profile", icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Real-time SSE notifications for patient portal
  const { viewAsPatientId, isImpersonating } = useViewAs();
  useRealtimeNotifications(!isImpersonating); // disable SSE in preview mode
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const myRecord = myRecordQuery.data;

  // Derive patient display name from linked patient record, falling back to auth user name
  const patientFirstName = myRecord?.firstName || user?.name?.split(" ")[0] || "";
  const patientLastName = myRecord?.lastName || user?.name?.split(" ").slice(1).join(" ") || "";
  const patientFullName = myRecord
    ? `${myRecord.firstName} ${myRecord.lastName}`
    : user?.name || "Patient";
  const initials = patientFirstName && patientLastName
    ? `${patientFirstName.charAt(0)}${patientLastName.charAt(0)}`.toUpperCase()
    : patientFullName.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);

  // Gender-based theming: The Row quiet luxury for female patients, masculine (steel blue) is default
  const isFeminine = myRecord?.sex === "female";

  const isActive = (path: string) => {
    if (path === "/patient") return location === "/patient";
    return location.startsWith(path);
  };

  return (
    <div className={`min-h-screen bg-background ${isFeminine ? "theme-feminine" : ""}`}>
      <ViewAsBanner />
      {/* ─── Desktop: sidebar + content ─── */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar — editorial, minimal, museum-like */}
        <aside className="w-60 bg-background border-r border-border/40 flex flex-col shrink-0 sticky top-0 h-screen">
          {/* Brand — spaced letterforms, editorial */}
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center text-[11px] font-bold text-gold shrink-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>BL</div>
              <div>
                <span className="text-[13px] font-semibold tracking-[0.15em] uppercase text-foreground leading-none">Black Label</span>
                <span className="block text-[9px] tracking-[0.35em] uppercase text-muted-foreground leading-tight mt-0.5">Medicine</span>
              </div>
            </div>
          </div>

          {/* Patient info — understated */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                {myRecordQuery.isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-gold text-[11px] font-semibold tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{initials}</span>
                )}
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground tracking-wide">{patientFullName}</p>
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Patient Portal</p>
              </div>
            </div>
            {/* Thin warm grey divider */}
            <div className="mt-5 h-px bg-border/50" />
          </div>

          {/* Nav links — thin, minimal, editorial */}
          <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              const Icon = tab.icon;
              return (
                <Link key={tab.path} href={tab.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-gold/8 text-foreground border-l-2 border-gold pl-[10px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent pl-[10px]"
                    }`}
                  >
                    <Icon className="w-[16px] h-[16px]" strokeWidth={active ? 1.8 : 1.4} />
                    <span className={`text-[13px] tracking-wide ${active ? "font-medium" : "font-normal"}`}>{tab.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="px-4 py-5">
            <div className="h-px bg-border/40 mb-4" />
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2 rounded text-muted-foreground hover:text-foreground transition-all duration-300 w-full"
            >
              <LogOut className="w-[15px] h-[15px]" strokeWidth={1.4} />
              <span className="text-[13px] tracking-wide">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main content area — generous whitespace */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Mobile: top header + content + bottom tabs ─── */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Top header bar — clean, minimal */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="text-[12px] font-heading tracking-[0.25em] uppercase text-foreground leading-none">Black Label</span>
              <span className="block text-[8px] tracking-[0.4em] uppercase text-muted-foreground leading-tight mt-0.5">Medicine</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
              <span className="text-foreground text-[10px] font-medium tracking-wide">{initials}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 px-5 py-6">
          {children}
        </main>

        {/* Bottom tab bar — thin, understated */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 z-40">
          <div className="flex items-center overflow-x-auto scrollbar-hide py-2 px-1 gap-0.5" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              const Icon = tab.icon;
              return (
                <Link key={tab.path} href={tab.path}>
                  <button className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded transition-all duration-300 shrink-0 min-w-[52px] ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    <div className={`p-1 rounded transition-all duration-300 ${active ? "bg-muted/50" : ""}`}>
                      <Icon className="w-4.5 h-4.5" strokeWidth={active ? 1.8 : 1.4} />
                    </div>
                    <span className={`text-[9px] tracking-wider whitespace-nowrap ${active ? "font-medium" : "font-normal"}`}>{tab.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
          {/* Safe area spacer for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      </div>
    </div>
  );
}
