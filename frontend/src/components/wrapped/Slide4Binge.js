"use client";
import { motion } from "motion/react";
import { useCountUp } from "@/hooks/useCountUp";

export default function Slide4Binge({ data }) {
  const topBinge = data?.binge_sessions?.top_by_duration?.[0];
  const videoCount = useCountUp(topBinge?.video_count || 0, 1500, 800);

  if (!topBinge) {
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
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </motion.div>
        <h2 style={{ fontFamily: "var(--font-body), sans-serif", fontSize: 28, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Balanced Viewer</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>You kept things varied — no massive single-channel binges detected.</p>
      </div>
    );
  }

  const totalMins = Math.round((topBinge.total_duration_seconds || 0) / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const barWidth = Math.min(100, (totalMins / (4 * 60)) * 100);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #0E0C09 0%, #1a1210 55%, #2a1a10 100%)",
    }}>
      {/* CRT-overheat glow — rust/signal warm intensity */}
      <motion.div
        animate={{ opacity: [0.25, 0.4, 0.25], scaleY: [0.95, 1.05, 0.95] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        style={{
          position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "120%", height: "50%", borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(232,80,58,0.25) 0%, rgba(139,94,60,0.15) 40%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none", transformOrigin: "bottom center"
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 28px 24px", position: "relative", zIndex: 10 }}>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--signal)", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 32 }}
        >
          Your Longest Binge
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.5, bounce: 0.3 }}
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>You went deep on</p>
          <h2 style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "clamp(32px, 9vw, 44px)", fontWeight: 600, color: "var(--text-primary)",
            lineHeight: 1.1, marginBottom: 32, letterSpacing: "-0.02em",
            textShadow: "0 0 30px rgba(232,80,58,0.2)",
          }}>
            {topBinge.top_channel}
          </h2>

          <div style={{ marginBottom: 24 }}>
            <span style={{
              fontFamily: "var(--font-display), monospace",
              fontSize: "clamp(56px, 16vw, 76px)", fontWeight: 400, color: "var(--signal)",
              letterSpacing: "-0.02em", lineHeight: 1,
              textShadow: "0 0 50px rgba(232,80,58,0.4), 0 0 15px rgba(232,80,58,0.2)"
            }}>
              {timeStr}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, marginBottom: 32 }}>of non-stop watching</p>

          {/* Progress bar — signal/rust gradient */}
          <div style={{ width: "100%", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
              style={{
                height: "100%", borderRadius: 99,
                background: "linear-gradient(90deg, var(--rust), var(--signal))",
                boxShadow: "0 0 10px rgba(232,80,58,0.4)"
              }}
            />
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", marginTop: 8,
            fontFamily: "var(--font-mono), monospace",
            color: "var(--text-muted)", fontSize: 10, fontWeight: 500
          }}>
            <span>0h</span><span>1h</span><span>2h</span><span>3h</span><span>4h+</span>
          </div>
        </motion.div>

        {/* Badge — no backdrop-filter for html-to-image safety */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            background: "rgba(232,80,58,0.06)", border: "1px solid rgba(232,80,58,0.12)",
            borderRadius: 20, padding: "16px 20px", marginTop: 24,
          }}
        >
          <span style={{ fontFamily: "var(--font-display), monospace", fontSize: 32, fontWeight: 400, color: "var(--signal)" }}>{videoCount}</span>
          <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 13, fontWeight: 500, lineHeight: 1.2, textAlign: "left", flex: 1 }}>videos<br/>back-to-back</span>
        </motion.div>
      </div>
    </div>
  );
}
