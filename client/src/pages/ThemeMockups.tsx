/*
 * Theme Mockups — three aesthetic variations of the BLM web app
 * Standalone preview, no auth required. Visit /theme-mockups
 *
 * Each theme renders the same snippet (header, greeting, stats card,
 * two protocol cards, primary button) so they can be compared apples-to-apples.
 *
 * Each theme is fully self-contained — palette + fonts hardcoded inline.
 * To "ship" one, lift its tokens into a .theme-<name> class in index.css
 * (following the existing .theme-clinical pattern) and apply it to <body>.
 */
import { useState } from "react";
import { Activity, Pill, Dumbbell, ArrowRight, Check, Calendar } from "lucide-react";

type ThemeId = "editorial" | "clinical" | "noir";

interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  palette: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
    accentSoft: string;
    accentInk: string; // text color when sitting on the accent
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  radius: string;
  letterSpacing: string;
}

const THEMES: ThemeDef[] = [
  {
    id: "editorial",
    name: "Editorial Quiet",
    tagline: "Magazine, hairline borders, oxblood accent",
    palette: {
      bg: "#FAFAF7",
      surface: "#FFFFFF",
      surfaceAlt: "#F1EFE9",
      text: "#1A1A1A",
      textMuted: "#6B6862",
      border: "#1A1A1A",
      accent: "#8B2635",
      accentSoft: "#F4E5E7",
      accentInk: "#FFFFFF",
    },
    fonts: {
      heading: '"Playfair Display", Georgia, serif',
      body: '"Inter", system-ui, sans-serif',
      mono: '"DM Mono", monospace',
    },
    radius: "0px",
    letterSpacing: "0.01em",
  },
  {
    id: "clinical",
    name: "Clinical Bright",
    tagline: "Apple Health energy, vibrant blue, soft cards",
    palette: {
      bg: "#FFFFFF",
      surface: "#F5F5F7",
      surfaceAlt: "#EBEBEF",
      text: "#0F172A",
      textMuted: "#6B7280",
      border: "#E5E5E7",
      accent: "#0066FF",
      accentSoft: "#E6F0FF",
      accentInk: "#FFFFFF",
    },
    fonts: {
      heading: '-apple-system, "SF Pro Display", "Inter", sans-serif',
      body: '-apple-system, "SF Pro Text", "Inter", sans-serif',
      mono: '"SF Mono", "DM Mono", monospace',
    },
    radius: "16px",
    letterSpacing: "-0.01em",
  },
  {
    id: "noir",
    name: "Concierge Noir",
    tagline: "Dark luxury, antique gold, hotel-app gravitas",
    palette: {
      bg: "#0A0A0A",
      surface: "#14140F",
      surfaceAlt: "#1C1C16",
      text: "#F5F0E6",
      textMuted: "#8A847A",
      border: "#2A2A22",
      accent: "#C6B89E",
      accentSoft: "rgba(198, 184, 158, 0.12)",
      accentInk: "#0A0A0A",
    },
    fonts: {
      heading: '"Cormorant Garamond", Georgia, serif',
      body: '"Source Sans 3", "Inter", sans-serif',
      mono: '"DM Mono", monospace',
    },
    radius: "2px",
    letterSpacing: "0.02em",
  },
];

/* ────────────────────────────────────────────────────────────────────────
   ThemedSnippet — renders the same content under any theme
   ──────────────────────────────────────────────────────────────────────── */
function ThemedSnippet({ theme }: { theme: ThemeDef }) {
  const p = theme.palette;
  const f = theme.fonts;

  return (
    <div
      style={{
        background: p.bg,
        color: p.text,
        fontFamily: f.body,
        letterSpacing: theme.letterSpacing,
        borderRadius: theme.radius,
        border: theme.id === "editorial" ? `1px solid ${p.border}` : `1px solid ${p.border}`,
        overflow: "hidden",
      }}
      className="flex flex-col h-full"
    >
      {/* ── Header ── */}
      <header
        style={{
          borderBottom: `1px solid ${p.border}`,
          padding: "20px 24px",
          background: theme.id === "noir" ? p.surface : p.bg,
        }}
        className="flex items-center justify-between"
      >
        <div>
          <div
            style={{
              fontFamily: f.mono,
              fontSize: "9px",
              letterSpacing: "0.18em",
              color: p.textMuted,
              textTransform: "uppercase",
            }}
          >
            Black Label
          </div>
          <div
            style={{
              fontFamily: f.heading,
              fontSize: "20px",
              fontWeight: theme.id === "clinical" ? 600 : 500,
              color: p.text,
              lineHeight: 1.1,
              marginTop: "2px",
            }}
          >
            Medicine
          </div>
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: theme.id === "clinical" ? "50%" : theme.radius,
            background: p.accent,
            color: p.accentInk,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: f.mono,
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          JE
        </div>
      </header>

      {/* ── Greeting ── */}
      <div style={{ padding: "28px 24px 16px" }}>
        <div
          style={{
            fontFamily: f.mono,
            fontSize: "9px",
            letterSpacing: "0.18em",
            color: p.textMuted,
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Tuesday · April 14
        </div>
        <h1
          style={{
            fontFamily: f.heading,
            fontSize: "30px",
            fontWeight: theme.id === "clinical" ? 600 : 400,
            lineHeight: 1.15,
            color: p.text,
            margin: 0,
          }}
        >
          Good evening,
          <br />
          <span style={{ fontStyle: theme.id === "editorial" || theme.id === "noir" ? "italic" : "normal" }}>
            Jacob
          </span>
          .
        </h1>
      </div>

      {/* ── Adherence stat card ── */}
      <div style={{ padding: "0 24px" }}>
        <div
          style={{
            background: p.surface,
            border: theme.id === "clinical" ? "none" : `1px solid ${p.border}`,
            borderRadius: theme.radius,
            padding: "20px 22px",
            boxShadow: theme.id === "clinical" ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)" : "none",
          }}
          className="flex items-center justify-between"
        >
          <div>
            <div
              style={{
                fontFamily: f.mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                color: p.textMuted,
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              This Week
            </div>
            <div
              style={{
                fontFamily: f.heading,
                fontSize: "44px",
                fontWeight: theme.id === "clinical" ? 700 : 400,
                color: p.text,
                lineHeight: 1,
              }}
            >
              87<span style={{ fontSize: "22px", color: p.textMuted, fontWeight: 400 }}>%</span>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: p.textMuted,
                marginTop: "6px",
                fontFamily: f.body,
              }}
            >
              Adherence · 13 of 15 steps
            </div>
          </div>

          {/* Ring */}
          <div style={{ position: "relative", width: "70px", height: "70px" }}>
            <svg viewBox="0 0 70 70" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle
                cx="35"
                cy="35"
                r="30"
                fill="none"
                stroke={p.border}
                strokeWidth="3"
              />
              <circle
                cx="35"
                cy="35"
                r="30"
                fill="none"
                stroke={p.accent}
                strokeWidth="3"
                strokeDasharray={`${0.87 * 188.5} 188.5`}
                strokeLinecap={theme.id === "clinical" ? "round" : "butt"}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={20} style={{ color: p.accent }} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section label ── */}
      <div style={{ padding: "26px 24px 10px" }}>
        <div
          style={{
            fontFamily: f.mono,
            fontSize: "9px",
            letterSpacing: "0.18em",
            color: p.textMuted,
            textTransform: "uppercase",
          }}
        >
          Active Protocols
        </div>
      </div>

      {/* ── Protocol cards ── */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          {
            icon: Pill,
            title: "Daily Peptide Protocol",
            badge: "Peptides",
            meta: "Started Apr 1 · Ongoing",
          },
          {
            icon: Dumbbell,
            title: "Z2 Cardio Foundation",
            badge: "Exercise",
            meta: "Mon · Wed · Fri",
          },
        ].map((proto, i) => {
          const Icon = proto.icon;
          return (
            <div
              key={i}
              style={{
                background: p.surface,
                border: theme.id === "clinical" ? "none" : `1px solid ${p.border}`,
                borderRadius: theme.radius,
                padding: "14px 16px",
                boxShadow: theme.id === "clinical" ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
              }}
              className="flex items-center gap-3"
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: theme.id === "clinical" ? "10px" : theme.radius,
                  background: p.accentSoft,
                  color: p.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} strokeWidth={1.6} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: f.heading,
                    fontSize: "14px",
                    fontWeight: theme.id === "clinical" ? 600 : 500,
                    color: p.text,
                    lineHeight: 1.2,
                  }}
                >
                  {proto.title}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: p.textMuted,
                    marginTop: "3px",
                    fontFamily: f.body,
                  }}
                >
                  {proto.meta}
                </div>
              </div>
              <div
                style={{
                  fontFamily: f.mono,
                  fontSize: "8.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: p.accent,
                  border: `1px solid ${p.accent}`,
                  padding: "3px 8px",
                  borderRadius: theme.id === "clinical" ? "999px" : theme.radius,
                  flexShrink: 0,
                }}
              >
                {proto.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Today's tasks (mini list) ── */}
      <div style={{ padding: "26px 24px 10px" }}>
        <div
          style={{
            fontFamily: f.mono,
            fontSize: "9px",
            letterSpacing: "0.18em",
            color: p.textMuted,
            textTransform: "uppercase",
          }}
        >
          Today
        </div>
      </div>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: "1px" }}>
        {[
          { label: "BPC-157 — 250mcg subq", done: true },
          { label: "Vitamin D3 — 5000 IU", done: true },
          { label: "Z2 ride — 45 min", done: false },
        ].map((task, i) => (
          <div
            key={i}
            style={{
              padding: "11px 0",
              borderBottom: i < 2 ? `1px solid ${p.border}` : "none",
              opacity: task.done ? 0.55 : 1,
            }}
            className="flex items-center gap-3"
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: theme.id === "clinical" ? "50%" : "2px",
                border: `1.5px solid ${task.done ? p.accent : p.border}`,
                background: task.done ? p.accent : "transparent",
                color: p.accentInk,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {task.done && <Check size={10} strokeWidth={3} />}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: p.text,
                textDecoration: task.done ? "line-through" : "none",
                fontFamily: f.body,
              }}
            >
              {task.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Spacer + CTA ── */}
      <div style={{ flex: 1 }} />
      <div style={{ padding: "20px 24px 28px" }}>
        <button
          style={{
            width: "100%",
            background: p.accent,
            color: p.accentInk,
            border: "none",
            padding: theme.id === "clinical" ? "14px 20px" : "13px 18px",
            borderRadius: theme.id === "clinical" ? "999px" : theme.radius,
            fontFamily: theme.id === "editorial" ? f.mono : f.body,
            fontSize: theme.id === "editorial" ? "10px" : "13px",
            fontWeight: theme.id === "clinical" ? 600 : 500,
            letterSpacing: theme.id === "editorial" ? "0.16em" : "0.02em",
            textTransform: theme.id === "editorial" ? "uppercase" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: theme.id === "clinical" ? "0 4px 12px rgba(0, 102, 255, 0.25)" : "none",
          }}
        >
          {theme.id === "editorial" ? "View Today's Plan" : "View today's plan"}
          <ArrowRight size={14} strokeWidth={theme.id === "clinical" ? 2.5 : 1.6} />
        </button>
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontFamily: f.mono,
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: p.textMuted,
            textTransform: "uppercase",
          }}
        >
          <Calendar size={11} strokeWidth={1.5} />
          Next visit · April 23
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */
export default function ThemeMockups() {
  const [layout, setLayout] = useState<"stack" | "compare">("stack");

  return (
    <div className="min-h-screen bg-[#F4F2EC] py-8 px-4 md:px-6">
      {/* Page header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono mb-2">
              Aesthetic Exploration
            </div>
            <h1
              className="font-serif text-3xl md:text-4xl text-stone-900"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Three template directions
            </h1>
            <p className="text-stone-600 text-sm mt-2 max-w-2xl">
              The same content, three aesthetic systems. Scroll down to see all three at phone
              size, or switch to the side-by-side compare view.
            </p>
          </div>

          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setLayout("stack")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                layout === "stack"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Stacked (large)
            </button>
            <button
              onClick={() => setLayout("compare")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                layout === "compare"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Side-by-side
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stacked layout — default, each at phone-width and actually readable ─── */}
      {layout === "stack" && (
        <div className="max-w-6xl mx-auto space-y-16">
          {THEMES.map((theme) => (
            <section key={theme.id}>
              {/* Theme label bar */}
              <div className="mb-4 pb-4 border-b border-stone-300/70">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <h2
                    className="font-serif text-2xl md:text-3xl text-stone-900"
                    style={{ fontFamily: '"Cormorant Garamond", serif' }}
                  >
                    {theme.name}
                  </h2>
                  <div className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">
                    {theme.fonts.heading.split(",")[0].replace(/"/g, "")}
                  </div>
                </div>
                <p className="text-sm text-stone-600 mt-1">{theme.tagline}</p>

                {/* Palette swatches with hex labels */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {[
                    { label: "Background", color: theme.palette.bg },
                    { label: "Surface", color: theme.palette.surface },
                    { label: "Text", color: theme.palette.text },
                    { label: "Accent", color: theme.palette.accent },
                  ].map((swatch, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 border border-stone-400/60 rounded-[2px]"
                        style={{ background: swatch.color }}
                      />
                      <div className="text-[9px] font-mono text-stone-500 leading-tight">
                        <div className="uppercase tracking-wider">{swatch.label}</div>
                        <div className="text-stone-400">{swatch.color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone-framed mockup — centered, ~420px wide, readable */}
              <div className="flex justify-center py-4">
                <div
                  className="shadow-xl"
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    minHeight: "820px",
                  }}
                >
                  <ThemedSnippet theme={theme} />
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ─── Compare layout — three columns, desktop only ─── */}
      {layout === "compare" && (
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {THEMES.map((theme) => (
              <div key={theme.id}>
                <div className="mb-3">
                  <h2
                    className="font-serif text-xl text-stone-900"
                    style={{ fontFamily: '"Cormorant Garamond", serif' }}
                  >
                    {theme.name}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">{theme.tagline}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {[
                      theme.palette.bg,
                      theme.palette.surface,
                      theme.palette.text,
                      theme.palette.accent,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 border border-stone-300 rounded-[2px]"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="shadow-sm" style={{ minHeight: "780px" }}>
                  <ThemedSnippet theme={theme} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-stone-300/60">
        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-mono mb-2">
          How to ship one
        </div>
        <p className="text-sm text-stone-600 max-w-3xl">
          Pick a direction and I'll lift its tokens into a <code className="text-xs bg-stone-200 px-1 rounded">.theme-{"<name>"}</code> class
          in <code className="text-xs bg-stone-200 px-1 rounded">client/src/index.css</code>, then apply
          it via the existing <code className="text-xs bg-stone-200 px-1 rounded">ThemeProvider</code>.
          The semantic tokens (<code className="text-xs bg-stone-200 px-1 rounded">--background</code>,
          {" "}<code className="text-xs bg-stone-200 px-1 rounded">--card</code>,
          {" "}<code className="text-xs bg-stone-200 px-1 rounded">--primary</code>, etc.) flow through every existing
          page automatically — no per-component edits required.
        </p>
      </div>
    </div>
  );
}
