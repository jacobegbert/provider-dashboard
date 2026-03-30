/*
 * Analytics Page — Client engagement and protocol metrics
 * Uses REAL tRPC data — no mock data
 */
import { useMemo } from "react";
import {
  BarChart3, TrendingUp, Users, ClipboardList, Activity, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, Area, AreaChart,
} from "recharts";

export default function Analytics() {
  const patientsQuery = trpc.patient.list.useQuery();
  const protocolsQuery = trpc.protocol.list.useQuery();
  const appointmentsQuery = trpc.appointment.listForProvider.useQuery();
  const statsQuery = trpc.attention.stats.useQuery();

  const patients = patientsQuery.data || [];
  const protocols = protocolsQuery.data || [];
  const appointmentsRaw = appointmentsQuery.data || [];
  const stats = statsQuery.data;
  const isLoading = patientsQuery.isLoading || protocolsQuery.isLoading;

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { active: 0, new: 0, paused: 0, inactive: 0, completed: 0 };
    patients.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return [
      { name: "Active", value: counts.active, color: "#5B8A72" },
      { name: "New", value: counts.new, color: "#3B82F6" },
      { name: "Paused", value: counts.paused, color: "#D97706" },
      { name: "Inactive", value: counts.inactive, color: "#9CA3AF" },
      { name: "Completed", value: counts.completed, color: "#C4704B" },
    ].filter((s) => s.value > 0);
  }, [patients]);

  // Subscription tier distribution
  const tierData = useMemo(() => {
    const counts: Record<string, number> = { standard: 0, premium: 0, elite: 0 };
    patients.forEach((p) => { counts[p.subscriptionTier || "standard"] = (counts[p.subscriptionTier || "standard"] || 0) + 1; });
    return [
      { name: "Standard", value: counts.standard, color: "#8B8178" },
      { name: "Premium", value: counts.premium, color: "#5B8A72" },
      { name: "Elite", value: counts.elite, color: "#C4704B" },
    ].filter((s) => s.value > 0);
  }, [patients]);

  // Protocol popularity
  const protocolPopularity = useMemo(() => {
    return protocols
      .map((p) => ({
        name: p.name.length > 25 ? p.name.substring(0, 25) + "..." : p.name,
        steps: (p as any).steps?.length || (p as any).durationWeeks || 0,
      }))
      .slice(0, 8);
  }, [protocols]);

  // Appointments by type
  const appointmentsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    appointmentsRaw.forEach((row: any) => {
      const type = row.appointment?.type || "other";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace("_", " "),
      value,
    }));
  }, [appointmentsRaw]);

  // Monthly patient growth (from createdAt)
  const monthlyGrowth = useMemo(() => {
    const months: Record<string, number> = {};
    patients.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + 1;
    });
    const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([month, count]) => {
      cumulative += count;
      const d = new Date(month + "-01");
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        newClients: count,
        totalClients: cumulative,
      };
    });
  }, [patients]);

  const totalClients = patients.length;
  const activeClients = patients.filter((p) => p.status === "active").length;
  const totalProtocols = protocols.length;
  const retentionRate = totalClients > 0
    ? Math.round(((totalClients - patients.filter((p) => p.status === "inactive" || p.status === "completed").length) / totalClients) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Practice performance and client insights</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Clients", value: totalClients },
          { icon: TrendingUp, label: "Active Clients", value: activeClients },
          { icon: ClipboardList, label: "Protocols", value: totalProtocols },
          { icon: Activity, label: "Retention Rate", value: `${retentionRate}%` },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10">
                  <stat.icon className="h-[18px] w-[18px] text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Distribution */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" />
              Client Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No client data yet</div>
            ) : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8DFD6", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.value} client{item.value !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Tiers */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gold" />
              Subscription Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tierData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No client data yet</div>
            ) : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {tierData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8DFD6", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {tierData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.value} client{item.value !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold" />
              Client Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyGrowth.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No growth data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyGrowth} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B8A72" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5B8A72" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8B8178" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#8B8178" }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8DFD6", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="totalClients" stroke="#5B8A72" fill="url(#colorClients)" strokeWidth={2} name="Total Clients" />
                    <Line type="monotone" dataKey="newClients" stroke="#C4704B" strokeWidth={2} dot={{ r: 3 }} name="New This Month" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-6 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-4 rounded bg-gold" /> Total Clients
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-0.5 w-4 bg-red-500" /> New This Month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Protocol Library */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gold" />
              Protocol Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            {protocolPopularity.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">No protocols created yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={protocolPopularity} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#8B8178" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#4A3228" }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E8DFD6", fontSize: "12px" }} />
                  <Bar dataKey="steps" fill="#5B8A72" radius={[0, 4, 4, 0]} barSize={16} name="Steps" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
