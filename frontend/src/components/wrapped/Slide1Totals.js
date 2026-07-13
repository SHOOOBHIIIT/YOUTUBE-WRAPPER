"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useCountUp } from "@/hooks/useCountUp";

const BOOT_LINES = [
  "LOADING ARCHIVE...",
  "PARSING WATCH HISTORY",
  "CALCULATING TOTALS",
  "",
];

export default function Slide1Totals({ data }) {
  const heatmap = data?.temporal_heatmap || [];
  const total = heatmap.reduce((s, h) => s + h.count, 0);
  const dailyAvg = total > 0 ? Math.round(total / 365) : 0;
  const count = useCountUp(total, 2200, 2400);

  const [bootPhase, setBootPhase] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const timers = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setBootPhase(i + 1), 400 + i * 500));
    });
    timers.push(setTimeout(() => setBootDone(true), 2200));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 65% 25%, rgba(255,174,92,0.12) 0%, #161310 35%, #0E0C09 70%)",
    }}>
      {/* Phosphor glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-5%", right: "-15%",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,174,92,0.5), transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", bottom: "5%", left: "-10%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,94,60,0.4), transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 28px" }}>
        
        {/* Boot sequence */}
        {!bootDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: "#FFAE5C",
              textShadow: "0 0 6px rgba(255,174,92,0.4)",
              letterSpacing: "0.08em",
              lineHeight: 2,
            }}
          >
            {BOOT_LINES.slice(0, bootPhase).map((line, i) => (
              <div key={i}>{line ? `> ${line}` : ""}</div>
            ))}
          </motion.div>
        )}

        {/* Main content — appears after boot */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: bootDone ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <motion.p
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontFamily: "var(--font-mono), monospace",
              color: "var(--rust)", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.28em", textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            Your Year in Review
          </motion.p>

          {/* Hero number */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.3, bounce: 0.35, duration: 0.9 }}
            style={{
              fontFamily: "var(--font-display), monospace",
              fontSize: "clamp(88px, 24vw, 120px)",
              fontWeight: 400,
              lineHeight: 1,
              color: "#FFAE5C",
              textShadow: "0 0 80px rgba(255,174,92,0.5), 0 0 20px rgba(255,174,92,0.3)",
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            {count.toLocaleString()}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "var(--rust)",
              marginBottom: 28,
            }}
          >
            Videos Watched
          </motion.div>

          {/* Daily avg pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              padding: "10px 22px",
              borderRadius: 100,
              background: "rgba(255,174,92,0.06)",
              border: "1px solid rgba(255,174,92,0.12)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 13, fontWeight: 500,
            }}
          >
            That&apos;s ~<strong style={{ color: "#FFAE5C" }}>{dailyAvg}</strong> videos every single day
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
