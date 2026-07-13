"use client";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const PALETTE = [
  { color: "#FFAE5C", glow: "rgba(255,174,92,0.5)" },
  { color: "#D9DEE6", glow: "rgba(217,222,230,0.5)" },
  { color: "#E8503A", glow: "rgba(232,80,58,0.5)" },
  { color: "#8B5E3C", glow: "rgba(139,94,60,0.5)" },
  { color: "#7FD8FF", glow: "rgba(127,216,255,0.5)" },
  { color: "#c9a87c", glow: "rgba(201,168,124,0.5)" },
  { color: "#a09080", glow: "rgba(160,144,128,0.5)" },
  { color: "#b8a890", glow: "rgba(184,168,144,0.5)" },
];

export default function Slide5Genres({ data }) {
  const genres = data?.genre_breakdown || [];
  const skipReason = data?.clustering_skipped_reason;

  if (skipReason || genres.length === 0) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center",
        background: "var(--void)",
      }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}
          style={{ marginBottom: 20 }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </motion.div>
        <h2 style={{ fontFamily: "var(--font-body), sans-serif", fontSize: 28, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>A Unique Palette</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>Not enough diverse data for our genre analysis — but your taste is entirely your own!</p>
      </div>
    );
  }

  const chartData = genres.map((g, i) => ({
    name: g.label.split(" · ")[0],
    fullLabel: g.label,
    value: g.video_count,
    color: PALETTE[i % PALETTE.length].color,
    pct: g.pct,
    idx: i,
  }));

  const topGenre = chartData[0];

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #0E0C09 0%, #12100d 50%, #0E0C09 100%)",
    }}>
      {/* Holo sheen accent — thin stripe, not full background */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 200, height: 3, borderRadius: 2,
        background: "var(--holo)",
        filter: "blur(1px)", pointerEvents: "none",
        opacity: 0.6,
      }} />

      {/* Background glow tied to top genre */}
      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)",
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${topGenre.color}20, transparent 65%)`,
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 28px 24px", position: "relative", zIndex: 10 }}>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--chrome)", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 20 }}
        >
          Your Content DNA
        </motion.p>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.45, bounce: 0.3 }}
          style={{ position: "relative", flex: 1, minHeight: 0, maxHeight: 320, width: "100%", alignSelf: "center", margin: "16px 0" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius="55%" outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                startAngle={90} endAngle={-270}
                isAnimationActive animationBegin={700} animationDuration={1200}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
          }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Top Vibe</span>
            <span style={{ fontFamily: "var(--font-body), sans-serif", color: "var(--text-primary)", fontSize: 24, fontWeight: 600, textAlign: "center", lineHeight: 1.1, padding: "0 16px" }}>
              {topGenre.name}
            </span>
            <span style={{ fontFamily: "var(--font-display), monospace", color: "#FFAE5C", fontSize: 22, fontWeight: 400, marginTop: 4 }}>{topGenre.pct}%</span>
          </div>
        </motion.div>

        {/* Genre Pills — chrome borders, holo accent on first */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {chartData.map((g, i) => (
            <motion.div
              key={g.idx}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 + i * 0.08 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 100,
                background: i === 0 ? "rgba(255,174,92,0.06)" : "rgba(217,222,230,0.03)",
                border: `1px solid ${i === 0 ? "rgba(255,174,92,0.15)" : "var(--border-subtle)"}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, boxShadow: `0 0 6px ${g.color}` }} />
              <span style={{ fontFamily: "var(--font-mono), monospace", color: i === 0 ? "#FFAE5C" : "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>{g.name}</span>
              <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}>· {g.pct}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
