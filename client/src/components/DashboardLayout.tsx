/*
 * DashboardLayout — Persistent sidebar + main content area
 * Design: Luxury Clinical — Dark tones, gold accents, refined typography
 * Uses REAL tRPC data for badges and functional search
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  X,
  Brain,
  BookOpen,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location, navigate] = useLocation();

  // Real-time SSE notifications
  useRealtimeNotifications(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real data for badges
  const statsQuery = trpc.attention.stats.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const stats = statsQuery.data;

  // Attention queue count — must match what the Attention Queue page actually shows
  const attentionQueueQuery = trpc.attention.queue.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const dismissedQuery = trpc.attention.dismissedItems.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const attentionBadge = useMemo(() => {
    const q = attentionQueueQuery.data;
    if (!q) return 0;
    const dismissedKeys = new Set((dismissedQuery.data || []).map((d) => d.itemKey));
    // Build the same item list as AttentionQueue page
    let count = 0;
    for (const p of q.overduePatients || []) {
      if (!dismissedKeys.has(`overdue-${p.id}`)) count++;
    }
    // Note: lowCompliance items are not shown on the AttentionQueue page, so skip them
    for (const m of q.unreadMessages || []) {
      if (!dismissedKeys.has(`msg-${m.patient.id}`)) count++;
    }
    for (const a of q.upcomingAppointments || []) {
      if (!dismissedKeys.has(`apt-${a.appointment.id}`)) count++;
    }
    for (const p of q.newPatients || []) {
      if (!dismissedKeys.has(`new-${p.id}`)) count++;
    }
    return count;
  }, [attentionQueueQuery.data, dismissedQuery.data]);

  // Search patients
  const patientsQuery = trpc.patient.list.useQuery();
  const patients = patientsQuery.data || [];

  const filteredPatients = searchQuery.trim().length > 0
    ? patients.filter((p) => {
        const q = searchQuery.toLowerCase();
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        return name.includes(q) || (p.email && p.email.toLowerCase().includes(q)) || (p.phone && p.phone.includes(q));
      })
    : [];

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    { path: "/provider", label: "Dashboard", icon: LayoutDashboard },
    { path: "/provider/attention", label: "Attention Queue", icon: Zap, badge: attentionBadge },
    { path: "/provider/clients", label: "Clients", icon: Users, badge: stats?.totalPatients },
    { path: "/provider/protocols", label: "Protocols", icon: ClipboardList },
    { path: "/provider/messages", label: "Messages", icon: MessageSquare, badge: stats?.totalUnread },
    { path: "/provider/schedule", label: "Schedule", icon: Calendar, badge: stats?.upcomingAppointments },
    { path: "/provider/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/provider/resources", label: "Resources", icon: BookOpen },
    { path: "/provider/ai-advisor", label: "AI Advisor", icon: Brain },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link href="/">
            {collapsed ? (
              <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center text-[12px] font-bold cursor-pointer" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0A0A0A' }}>BL</div>
            ) : (
              <div className="cursor-pointer flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center text-[11px] font-bold text-sidebar-background shrink-0" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0A0A0A' }}>BL</div>
                <div>
                  <span className="text-[13px] font-semibold tracking-[0.15em] uppercase text-sidebar-foreground leading-none">Black Label</span>
                  <span className="block text-[9px] font-medium tracking-[0.3em] uppercase text-sidebar-accent-foreground leading-tight mt-0.5">Medicine</span>
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path !== "/provider" && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/20"
                        : "text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent"
                    }`}
                  >
                    <item.icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        isActive ? "text-sidebar-primary" : "text-sidebar-accent-foreground group-hover:text-sidebar-foreground"
                      }`}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <Badge
                            variant="secondary"
                            className={`h-5 min-w-5 px-1.5 text-[11px] font-semibold border-0 ${
                              item.label === "Messages" || item.label === "Attention Queue"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-sidebar-primary/20 text-sidebar-primary"
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                    {collapsed && item.badge != null && item.badge > 0 && (
                      <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-sidebar-primary" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Settings at bottom */}
        <div className="border-t border-sidebar-border p-2">
          <Link href="/provider/settings">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200">
              <Settings className="h-[18px] w-[18px] shrink-0 text-sidebar-accent-foreground" />
              {!collapsed && <span>Settings</span>}
            </div>
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="relative w-80" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search clients, protocols..."
              className="pl-9 pr-8 bg-secondary/50 border-border/50 h-9 text-sm placeholder:text-muted-foreground/60 focus:border-gold/30 focus:ring-gold/20"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Search results dropdown */}
            {searchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No clients found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold-muted font-semibold">
                      Clients ({filteredPatients.length})
                    </div>
                    {filteredPatients.slice(0, 8).map((patient) => (
                      <button
                        key={patient.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchOpen(false);
                          navigate("/provider/clients");
                        }}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-semibold font-heading border border-gold/15">
                          {(patient.firstName?.[0] || "?").toUpperCase()}{(patient.lastName?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {patient.email || "No email"} · {patient.status}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${
                          patient.status === "active" ? "text-gold border-gold/20" :
                          patient.status === "new" ? "text-gold border-gold/15" :
                          patient.status === "inactive" ? "text-muted-foreground border-border" :
                          "text-red-300 border-red-500/15"
                        }`}>
                          {patient.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2.5 rounded-lg bg-card border border-border px-3 py-1.5 shadow-sm">
              <div className="h-7 w-7 rounded-full bg-gold/15 flex items-center justify-center border border-gold/25">
                <span className="text-xs font-semibold text-gold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>JE</span>
              </div>
              <span className="text-sm font-medium text-foreground">Dr. Egbert</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
