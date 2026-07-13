"use client";
import { motion } from "motion/react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const GENRE_COLORS = ["#FFAE5C", "#E8503A", "#7FD8FF", "#D9DEE6", "#8B5E3C", "#c9a87c", "#a09080", "#b8a890"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Slide6TasteDrift({ data }) {
  const drift = data?.taste_drift || [];
  const skipReason = data?.clustering_skipped_reason;

  if (skipReason || drift.length <= 1) {
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
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </motion.div>
        <h2 style={{ fontFamily: "var(--font-body), sans-serif", fontSize: 28, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Consistent Viewer</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>Your taste was rock solid — no wild shifts in content genres detected over time.</p>
      </div>
    );
  }

  const allGenres = [...new Set(drift.flatMap(d => Object.keys(d.clusters || {})))];
  const chartData = drift.map(d => {
    const monthNum = parseInt(d.month.split("-")[1]) - 1;
    const row = { month: MONTH_NAMES[monthNum] || d.month };
    allGenres.forEach(g => { row[g] = (d.clusters || {})[g] || 0; });
    return row;
  });

  const totalsByGenre = allGenres.map(g => ({
    key: g,
    total: drift.reduce((s, d) => s + ((d.clusters || {})[g] || 0), 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #0E0C09 0%, #12100d 45%, #0E0C09 100%)",
    }}>
      {/* Subtle phosphor glow top */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 340, height: 180, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,174,92,0.08), transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 24px 24px", position: "relative", zIndex: 10 }}>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--rust)", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 8 }}
        >
          Taste Over Time
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ fontFamily: "var(--font-body), sans-serif", fontSize: 26, fontWeight: 600, color: "var(--text-primary)", marginBottom: 28, letterSpacing: "-0.02em" }}
        >
          How your taste evolved
        </motion.h2>

        {/* Area Chart — multi-color data-viz exception, void bg, JetBrains Mono axes */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{ flex: 1, minHeight: 0, position: "relative", margin: "0 -8px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="transparent"
                tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)" }}
                axisLine={false} tickLine={false}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border-medium)",
                  borderRadius: 12, color: "var(--text-primary)", fontSize: 12, fontWeight: 500,
                  fontFamily: "var(--font-mono)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                }}
                itemStyle={{ color: "var(--text-primary)", padding: "2px 0" }}
              />
              {allGenres.map((key, i) => (
                <Area
                  key={key} type="monotone" dataKey={key}
                  stackId="1" stroke="none"
                  fill={GENRE_COLORS[i % GENRE_COLORS.length]}
                  fillOpacity={0.85}
                  isAnimationActive animationBegin={700} animationDuration={1400}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}
        >
          {totalsByGenre.slice(0, 5).map((g, i) => (
            <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: GENRE_COLORS[allGenres.indexOf(g.key) % GENRE_COLORS.length],
              }} />
              <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-secondary)", fontSize: 11, fontWeight: 500, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.key}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
