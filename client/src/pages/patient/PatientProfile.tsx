// PatientProfile.tsx — Black Label Medicine Patient Profile
// Uses REAL tRPC data — no mock data
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, Mail, Phone, Calendar, Target, Heart, Shield, Bell, LogOut, ChevronRight, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useViewAs } from "@/contexts/ViewAsContext";

const WELLNESS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";

export default function PatientProfile() {
  const { user, logout } = useAuth();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const { data: unreadCount = 0 } = trpc.notification.unreadCount.useQuery();
  const patientId = myRecordQuery.data?.id;

  const tasksQuery = trpc.clientTask.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const myRecord = myRecordQuery.data;
  const tasks = tasksQuery.data || [];
  const isLoading = myRecordQuery.isLoading;

  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const daysActive = myRecord?.createdAt
    ? Math.floor((Date.now() - new Date(myRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const initials = myRecord
    ? `${myRecord.firstName?.[0] || ""}${myRecord.lastName?.[0] || ""}`.toUpperCase()
    : user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";

  const fullName = myRecord
    ? `${myRecord.firstName} ${myRecord.lastName}`
    : user?.name || "Patient";

  const memberSince = myRecord?.createdAt
    ? new Date(myRecord.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const healthGoals: string[] = myRecord?.healthGoals
    ? (Array.isArray(myRecord.healthGoals) ? myRecord.healthGoals : JSON.parse(myRecord.healthGoals as unknown as string))
    : [];
  const conditions: string[] = myRecord?.conditions
    ? (Array.isArray(myRecord.conditions) ? myRecord.conditions : JSON.parse(myRecord.conditions as unknown as string))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6 pb-4">
      {/* Profile header with background */}
      <div className="relative overflow-hidden md:rounded-2xl">
        <img src={WELLNESS_BG} alt="" className="w-full h-36 md:h-52 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 flex items-end gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gold/15 border-2 border-white/30 flex items-center justify-center">
            <span className="text-white font-heading text-xl md:text-2xl font-bold">{initials}</span>
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-white">{fullName}</h1>
            {memberSince && <p className="text-white/70 text-xs md:text-sm">Member since {memberSince}</p>}
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 space-y-5 md:space-y-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-3 gap-3 md:gap-4"
        >
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center">
            <p className="font-heading text-lg md:text-2xl font-bold text-gold">{completedTasks}</p>
            <p className="text-[10px] md:text-sm text-muted-foreground">Tasks Done</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center">
            <p className="font-heading text-lg md:text-2xl font-bold text-foreground">{daysActive}</p>
            <p className="text-[10px] md:text-sm text-muted-foreground">Days Active</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 md:p-5 text-center">
            <p className="font-heading text-lg md:text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-[10px] md:text-sm text-muted-foreground">Total Tasks</p>
          </div>
        </motion.div>

        {/* Desktop: two-column grid for info cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {/* Personal info */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
              <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Personal Information</h2>
            </div>
            <div className="divide-y divide-border">
              {[
                { icon: User, label: "Name", value: fullName },
                { icon: Mail, label: "Email", value: myRecord?.email || user?.email || "—" },
                { icon: Phone, label: "Phone", value: myRecord?.phone || "—" },
                { icon: Calendar, label: "Date of Birth", value: myRecord?.dateOfBirth ? (() => { const parts = myRecord.dateOfBirth!.split("-"); return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); })() : "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5">
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] md:text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm md:text-base text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health goals + conditions stacked */}
          <div className="space-y-5 md:space-y-6">
            {/* Health goals */}
            {healthGoals.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Health Goals</h2>
                </div>
                <div className="p-4 md:p-5 space-y-2.5 md:space-y-3">
                  {healthGoals.map((goal: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-gold shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base text-foreground">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {conditions.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
                  <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Conditions</h2>
                </div>
                <div className="p-4 md:p-5 flex flex-wrap gap-2">
                  {conditions.map((condition: string) => (
                    <span key={condition} className="text-xs md:text-sm font-medium bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription tier */}
            {myRecord?.subscriptionTier && (
              <div className="bg-card rounded-xl border border-border p-4 md:p-5">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Subscription</p>
                <p className="font-heading text-sm md:text-base font-semibold text-foreground capitalize">{myRecord.subscriptionTier} Plan</p>
              </div>
            )}
          </div>
        </div>

        {/* My provider */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/15">
            <span className="text-gold font-heading font-semibold text-base md:text-lg">BL</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">My Provider</p>
            <p className="font-heading text-sm md:text-base font-semibold text-foreground">Black Label Medicine</p>
            <p className="text-xs md:text-sm text-muted-foreground">Concierge Health Optimization</p>
          </div>
        </div>

        {/* Settings links */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[
            { icon: Bell, label: "Notifications", desc: unreadCount > 0 ? `${unreadCount} unread` : "Manage alerts & reminders", href: "/patient/notifications", badge: unreadCount },
            { icon: Shield, label: "Privacy & Security", desc: "Account security settings", href: "/patient/privacy" },
            { icon: Activity, label: "Health Data", desc: "Track your biomarkers", href: "/patient/vitals" },
          ].map((item, i) => (
            <Link key={item.label} href={item.href}>
              <div className={`w-full flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 hover:bg-muted/50 transition-colors cursor-pointer ${i < 2 ? "border-b border-border" : ""}`}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm md:text-base font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {(item as any).badge > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {(item as any).badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-3 md:py-3.5 text-destructive text-sm md:text-base font-medium rounded-xl border border-destructive/20 hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
