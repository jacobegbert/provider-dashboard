/*
 * Dashboard Overview — Provider's main landing page
 * Design: Luxury Clinical — Dark tones, gold accents, refined typography
 * Uses REAL tRPC data — no mock data
 */
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  AlertTriangle,
  UserPlus,
  MessageSquare,
  Calendar,
  ArrowRight,
  Clock,
  ClipboardList,
  Loader2,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";

const appointmentTypeStyles: Record<string, string> = {
  initial: "bg-gold/10 text-gold border-gold/15",
  urgent: "bg-red-500/10 text-red-300 border-red-500/15",
  follow_up: "bg-gold/10 text-gold border-gold/20",
  check_in: "bg-secondary text-foreground border-border",
  lab_work: "bg-gold/10 text-gold border-gold/15",
};

function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Real data queries
  const statsQuery = trpc.attention.stats.useQuery();
  const patientsQuery = trpc.patient.list.useQuery();
  const appointmentsQuery = trpc.appointment.listForProvider.useQuery();
  const conversationsQuery = trpc.message.conversations.useQuery();

  const stats = statsQuery.data;
  const allPatients = patientsQuery.data || [];
  const allAppointmentsRaw = appointmentsQuery.data || [];
  const conversations = conversationsQuery.data || [];

  // Derived data
  const attentionPatients = allPatients.filter(
    (p) => p.status === "new" || p.status === "active"
  ).slice(0, 4);

  const upcomingAppointments = allAppointmentsRaw
    .filter((a) => a.appointment.status === "scheduled" && new Date(a.appointment.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.appointment.scheduledAt).getTime() - new Date(b.appointment.scheduledAt).getTime())
    .slice(0, 4);

  const unreadConversations = conversations
    .filter((c) => c.unreadCount > 0)
    .slice(0, 3);

  const newThisMonth = allPatients.filter((p) => {
    const created = new Date(p.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const isLoading = statsQuery.isLoading || patientsQuery.isLoading;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const statCards = [
    { label: "Active Clients", value: stats?.activePatients ?? 0, icon: Users, href: "/provider/clients" },
    { label: "Needs Attention", value: attentionPatients.filter(p => p.status !== "active").length || stats?.totalUnread || 0, icon: AlertTriangle, href: "/provider/attention", alert: true },
    { label: "New This Month", value: newThisMonth, icon: UserPlus, href: "/provider/clients" },
    { label: "Upcoming Appts", value: stats?.upcomingAppointments ?? 0, icon: Calendar, href: "/provider/schedule" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-xl h-[180px]">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '256px'}} />
        <div className="relative z-10 flex flex-col justify-center h-full px-8">
          <p className="text-hero-accent/60 text-xs font-mono tracking-[0.2em] mb-1.5">{today.toUpperCase()}</p>
          <h1 className="font-serif font-light text-3xl text-white mb-2 tracking-tight">
            Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "Dr. Egbert"}
          </h1>
          <p className="text-white/60 text-sm font-body max-w-md">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading your dashboard...</span>
            ) : (
              <>
                You have <span className="font-semibold text-hero-accent">{upcomingAppointments.length} upcoming appointments</span> and{" "}
                <span className="font-semibold text-hero-accent">{stats?.totalUnread ?? 0} unread messages</span> today.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats row — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/50 bg-card hover:border-gold/20 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(stat.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.alert ? "bg-red-500/10" : "bg-gold/8"}`}>
                  <stat.icon className={`h-[18px] w-[18px] ${stat.alert ? "text-red-300" : "text-gold"}`} />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-transparent group-hover:text-gold/50 transition-all duration-300 group-hover:translate-x-0.5" />
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid: Appointments + Attention + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1 border-border/50 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold" />
                Upcoming Schedule
              </CardTitle>
              <Link href="/provider/schedule">
                <Button variant="ghost" size="sm" className="text-xs text-gold hover:text-gold-light hover:bg-gold/5 h-7 px-2">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {appointmentsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              upcomingAppointments.map((row) => (
                <div
                  key={row.appointment.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border/50"
                  onClick={() => navigate("/provider/schedule")}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-heading bg-gold/10 text-gold border border-gold/15">
                    {getInitials(row.patient.firstName, row.patient.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{row.appointment.title}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${appointmentTypeStyles[row.appointment.type] || "bg-secondary"}`}>
                        {row.appointment.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(row.appointment.scheduledAt)} · {formatTime(row.appointment.scheduledAt)} · {row.appointment.durationMinutes || 30}min
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Clients Needing Attention */}
        <Card className="lg:col-span-1 border-border/50 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-300" />
                Needs Attention
              </CardTitle>
              <Link href="/provider/attention">
                <Button variant="ghost" size="sm" className="text-xs text-gold hover:text-gold-light hover:bg-gold/5 h-7 px-2">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {patientsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : attentionPatients.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All clients are on track</p>
              </div>
            ) : (
              attentionPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border/50"
                  onClick={() => navigate(`/provider/clients?selected=${patient.id}`)}
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-heading bg-gold/10 text-gold border border-gold/15">
                      {getInitials(patient.firstName, patient.lastName)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                      patient.status === "new" ? "bg-gold" : "bg-red-500"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${
                        patient.status === "new"
                          ? "bg-gold/10 text-gold border-gold/15"
                          : "bg-red-500/10 text-red-300 border-red-500/15"
                      }`}>
                        {patient.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {patient.notes || `${patient.subscriptionTier || "standard"} tier`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card className="lg:col-span-1 border-border/50 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gold" />
                Unread Messages
              </CardTitle>
              <Link href="/provider/messages">
                <Button variant="ghost" size="sm" className="text-xs text-gold hover:text-gold-light hover:bg-gold/5 h-7 px-2">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {conversationsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : unreadConversations.length === 0 ? (
              <div className="text-center py-6">
                <Inbox className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              unreadConversations.map((conv) => (
                <Link key={conv.patient.id} href={`/provider/messages?patient=${conv.patient.id}`}>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border/50">
                    <div className="relative">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-heading bg-gold/10 text-gold border border-gold/15">
                        {getInitials(conv.patient.firstName, conv.patient.lastName)}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-black">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.patient.firstName} {conv.patient.lastName}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-2">Quick Actions:</span>
            <Link href="/provider/clients">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/5 hover:border-gold/30">
                <UserPlus className="h-3.5 w-3.5" /> Add Client
              </Button>
            </Link>
            <Link href="/provider/protocols">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/5 hover:border-gold/30">
                <ClipboardList className="h-3.5 w-3.5" /> Assign Protocol
              </Button>
            </Link>
            <Link href="/provider/messages">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/5 hover:border-gold/30">
                <MessageSquare className="h-3.5 w-3.5" /> Send Message
              </Button>
            </Link>
            <Link href="/provider/schedule">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-gold/20 text-gold hover:bg-gold/5 hover:border-gold/30">
                <Calendar className="h-3.5 w-3.5" /> Schedule Appointment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
