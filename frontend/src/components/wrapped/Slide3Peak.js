"use client";
import { motion } from "motion/react";

export default function Slide3Peak({ data }) {
  const heat = data?.temporal_heatmap || [];

  const hourCounts = new Array(24).fill(0);
  heat.forEach(h => { hourCounts[h.hour] += h.count; });

  let peakHour = 0;
  let maxCount = 0;
  hourCounts.forEach((c, h) => { if (c > maxCount) { maxCount = c; peakHour = h; } });

  const ampm = peakHour >= 12 ? "PM" : "AM";
  const displayHour = peakHour % 12 === 0 ? 12 : peakHour % 12;
  const hourLabel = `${displayHour} ${ampm}`;

  const isNight = (peakHour >= 20 || peakHour <= 5);
  const isMorning = (peakHour > 5 && peakHour < 12);
  const isAfternoon = (peakHour >= 12 && peakHour < 17);

  const personality = isNight ? "Night Owl" : isMorning ? "Early Bird" : isAfternoon ? "Daydreamer" : "Evening Viewer";
  
  // Cooler phosphor — desaturated blue-amber, oscilloscope cast
  const accentColor = isNight ? "rgba(255,174,92,0.6)" : isMorning ? "#FFAE5C" : isAfternoon ? "rgba(255,174,92,0.8)" : "rgba(217,222,230,0.7)";
  const barColor = isNight ? "rgba(255,174,92,0.3)" : "rgba(255,174,92,0.5)";

  const barMax = Math.max(...hourCounts);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "linear-gradient(175deg, #12100d 0%, #0E0C09 40%, #0a0908 100%)",
    }}>
      {/* Oscilloscope glow orb — cooler phosphor */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "15%", right: "-15%",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}, transparent 65%)`,
          filter: "blur(50px)", pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 28px 24px", position: "relative", zIndex: 10 }}>
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "var(--font-mono), monospace",
            color: "var(--rust)", fontSize: 10, fontWeight: 600,
            letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 20
          }}
        >
          When You Watch
        </motion.p>

        {/* Personality Badge */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            alignSelf: "flex-start", padding: "8px 16px", borderRadius: 100,
            background: "rgba(255,174,92,0.06)", border: "1px solid rgba(255,174,92,0.12)",
            color: "#FFAE5C", fontFamily: "var(--font-mono), monospace",
            fontSize: 13, fontWeight: 600, marginBottom: 24,
          }}
        >
          {personality}
        </motion.div>

        {/* Hero Time — VT323 display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.65, bounce: 0.4 }}
          style={{ marginBottom: "auto" }}
        >
          <div style={{
            fontFamily: "var(--font-display), monospace",
            fontSize: "clamp(80px, 22vw, 110px)", fontWeight: 400, lineHeight: 0.95,
            color: "#FFAE5C", letterSpacing: "-0.02em",
            textShadow: "0 0 60px rgba(255,174,92,0.4), 0 0 15px rgba(255,174,92,0.2)",
          }}>
            {hourLabel}
          </div>
          <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 14, fontWeight: 500, marginTop: 12 }}>
            is your peak viewing hour
          </p>
        </motion.div>

        {/* Heatmap Bar Chart — oscilloscope style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            color: "var(--text-muted)", fontSize: 9, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12
          }}>
            Activity by Hour
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
            {hourCounts.map((c, h) => {
              const heightPct = barMax > 0 ? (c / barMax) * 100 : 0;
              const isPeak = h === peakHour;
              return (
                <motion.div
                  key={h}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 1.4 + h * 0.02, ease: "easeOut", duration: 0.4 }}
                  style={{
                    flex: 1, borderRadius: 2, transformOrigin: "bottom",
                    height: `${Math.max(heightPct, 3)}%`,
                    background: isPeak ? "#FFAE5C" : barColor,
                    boxShadow: isPeak ? "0 0 12px rgba(255,174,92,0.5)" : "none",
                  }}
                />
              );
            })}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", marginTop: 8,
            fontFamily: "var(--font-mono), monospace",
            color: "var(--text-muted)", fontSize: 10, fontWeight: 500
          }}>
            <span>12A</span><span>6A</span><span>12P</span><span>6P</span><span>11P</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
