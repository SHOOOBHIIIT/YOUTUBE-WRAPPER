"use client";
import { motion } from "motion/react";
import { useCountUp } from "@/hooks/useCountUp";

const RANKS = ["#1", "#2", "#3", "#4", "#5"];
const RANK_COLORS = ["#D9DEE6", "#A8ADB6", "#8B5E3C", "#666", "#555"];
const RANK_GLOWS  = ["rgba(217,222,230,0.3)", "rgba(217,222,230,0.15)", "rgba(139,94,60,0.2)", "transparent", "transparent"];

export default function Slide2Channels({ data }) {
  const channels = data?.top_channels || [];
  const top = channels[0];
  const rest = channels.slice(1, 5);
  const topCount = useCountUp(top?.video_count || 0, 1800, 600);

  if (!top) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--void)",
      }}>
        <p style={{ color: "var(--text-muted)", fontSize: 16 }}>Not enough channel data</p>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(175deg, #161310 0%, #0E0C09 55%, #1a1510 100%)",
    }}>
      {/* Chrome radial glow */}
      <div style={{
        position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
        width: 260, height: 120, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(217,222,230,0.12), transparent 70%)",
        filter: "blur(30px)", pointerEvents: "none",
      }} />

      {/* Top section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 28px 16px", position: "relative", zIndex: 10 }}>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--chrome)", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 16 }}
        >
          Your Favourite Creator
        </motion.p>

        {/* Crown — chrome/metal style */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: 8 }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--chrome)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-5 4-5-4-5 4z"/><line x1="5" y1="20" x2="19" y2="20"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.45, bounce: 0.45 }}
          style={{
            fontFamily: "var(--font-display), monospace",
            fontSize: 80, fontWeight: 400, lineHeight: 1,
            color: "var(--chrome)",
            textShadow: "0 0 50px rgba(217,222,230,0.3), 0 0 15px rgba(217,222,230,0.15)",
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          #1
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "clamp(20px, 5.5vw, 26px)", fontWeight: 600, color: "var(--text-primary)",
            textAlign: "center", lineHeight: 1.2, marginBottom: 12, padding: "0 8px",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          {top.channel_name}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{ display: "flex", alignItems: "baseline", gap: 8 }}
        >
          <span style={{ fontFamily: "var(--font-display), monospace", fontSize: 36, fontWeight: 400, color: "#FFAE5C", textShadow: "0 0 20px rgba(255,174,92,0.3)" }}>
            {topCount.toLocaleString()}
          </span>
          <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>videos watched</span>
        </motion.div>
      </div>

      {/* Divider */}
      <div style={{ margin: "0 20px", height: 1, background: "var(--border-subtle)" }} />

      {/* Runner-ups — chrome/metal panels */}
      <div style={{ padding: "14px 16px 28px", zIndex: 10 }}>
        <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10 }}>
          Runners Up
        </p>
        {rest.map((ch, i) => (
          <motion.div
            key={ch.channel_name}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.1 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              borderRadius: 14, padding: "9px 14px", marginBottom: 6,
              background: "linear-gradient(145deg, rgba(217,222,230,0.04) 0%, rgba(217,222,230,0.01) 100%)",
              border: "1px solid var(--border-subtle)",
              boxShadow: RANK_GLOWS[i + 1] !== "transparent" ? `0 0 14px ${RANK_GLOWS[i + 1]}` : "none",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, fontWeight: 600, width: 20, color: RANK_COLORS[i + 1] }}>{RANKS[i + 1]}</span>
            <span style={{ flex: 1, fontFamily: "var(--font-body), sans-serif", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.channel_name}</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{ch.video_count} vids</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
