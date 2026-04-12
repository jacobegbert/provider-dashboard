// AdherenceWidget.tsx — 30-day rolling adherence for patient and provider views
// Design: The Row — Quiet luxury, editorial minimalism
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2 } from "lucide-react";

const GROUP_LABELS: Record<string, string> = {
  peptides: "Peptides & Hormones",
  supplements: "Supplements",
  lifestyle: "Lifestyle",
};

const GROUP_COLORS: Record<string, string> = {
  peptides: "bg-gold",
  supplements: "bg-blue-400",
  lifestyle: "bg-emerald-400",
};

const GROUP_TRACK_COLORS: Record<string, string> = {
  peptides: "bg-gold/20",
  supplements: "bg-blue-400/20",
  lifestyle: "bg-emerald-400/20",
};

interface AdherenceWidgetProps {
  patientId: number;
  /** "patient" shows motivational framing, "provider" shows clinical flags */
  variant?: "patient" | "provider";
}

export default function AdherenceWidget({ patientId, variant = "patient" }: AdherenceWidgetProps) {
  const statsQuery = trpc.assignment.adherenceStats.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  if (statsQuery.isLoading) {
    return (
      <div className="bg-card rounded-sm border border-border/40 p-6 flex items-center justify-center min-h-[120px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = statsQuery.data;
  if (!stats || stats.overall.expected === 0) return null;

  const { overall, weeks, categories, flagged } = stats;

  // Trend: compare week 4 (most recent) to week 2 (two weeks ago)
  const recentPct = weeks[3]?.pct ?? 0;
  const priorPct = weeks[1]?.pct ?? 0;
  const trendDiff = recentPct - priorPct;
  const TrendIcon = trendDiff > 5 ? TrendingUp : trendDiff < -5 ? TrendingDown : Minus;
  const trendColor = trendDiff > 5 ? "text-emerald-500" : trendDiff < -5 ? "text-red-400" : "text-muted-foreground";

  // Ring color based on overall pct
  const ringColor =
    overall.pct >= 85 ? "text-gold" :
    overall.pct >= 70 ? "text-amber-400" :
    "text-red-400";

  return (
    <div className="bg-card rounded-sm border border-border/40 p-5 md:p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base md:text-lg text-foreground tracking-tight">
            {variant === "patient" ? "Your Adherence" : "30-Day Adherence"}
          </h3>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase mt-0.5">
            Rolling 30 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-heading text-3xl md:text-4xl tracking-tight ${ringColor}`}>
            {overall.pct}%
          </span>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} strokeWidth={1.8} />
        </div>
      </div>

      {/* Weekly breakdown — 4 bars */}
      <div>
        <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2.5">Weekly Trend</p>
        <div className="grid grid-cols-4 gap-2">
          {weeks.map((wk, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-16 bg-muted/40 rounded-sm relative overflow-hidden flex items-end">
                <motion.div
                  className={`w-full rounded-sm ${
                    wk.pct >= 85 ? "bg-gold/70" :
                    wk.pct >= 70 ? "bg-amber-400/60" :
                    wk.pct > 0 ? "bg-red-400/50" :
                    "bg-muted/20"
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(wk.pct, 4)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-medium text-foreground">{wk.pct}%</p>
                <p className="text-[9px] text-muted-foreground">{wk.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-2.5">By Category</p>
          <div className="space-y-2.5">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium">
                    {GROUP_LABELS[cat.name] || cat.name}
                  </span>
                  <span className={`text-xs font-medium ${
                    cat.pct >= 85 ? "text-foreground" :
                    cat.pct >= 70 ? "text-amber-500" :
                    "text-red-400"
                  }`}>
                    {cat.pct}%
                  </span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${GROUP_TRACK_COLORS[cat.name] || "bg-muted/40"}`}>
                  <motion.div
                    className={`h-full rounded-full ${GROUP_COLORS[cat.name] || "bg-gold"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged items — provider view or patient view with gentle framing */}
      {flagged.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.8} />
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
              {variant === "patient" ? "Needs Attention" : "Low Adherence Items (14d)"}
            </p>
          </div>
          <div className="space-y-1.5">
            {flagged.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2.5 rounded bg-muted/30 border border-border/30"
              >
                <span className="text-xs text-foreground truncate flex-1 mr-3">{item.title}</span>
                <span className="text-[10px] text-red-400 font-medium shrink-0">
                  {item.pct}% · {item.missed}/{item.outOf} missed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
