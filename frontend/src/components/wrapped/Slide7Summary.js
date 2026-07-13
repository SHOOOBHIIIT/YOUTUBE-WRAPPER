"use client";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { toJpeg } from "html-to-image";
import { Download } from "lucide-react";

function StatCard({ label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", bounce: 0.35 }}
      style={{
        display: "flex", flexDirection: "column",
        background: "linear-gradient(145deg, rgba(217,222,230,0.04) 0%, rgba(217,222,230,0.01) 100%)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 20, padding: 16,
        boxShadow: "inset 0 1px 0 rgba(217,222,230,0.06)",
      }}
    >
      <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-body), sans-serif", color: color || "var(--text-primary)", fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>
        {value}
      </span>
    </motion.div>
  );
}

export default function Slide7Summary({ data }) {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const heatmap = data?.temporal_heatmap || [];
  const videoCount = heatmap.reduce((s, h) => s + h.count, 0);
  const hourCounts = new Array(24).fill(0);
  heatmap.forEach(h => { hourCounts[h.hour] += h.count; });
  let peakHour = 0; let maxCount = 0;
  hourCounts.forEach((c, h) => { if (c > maxCount) { maxCount = c; peakHour = h; } });
  const ampm = peakHour >= 12 ? "PM" : "AM";
  const displayHour = peakHour % 12 === 0 ? 12 : peakHour % 12;
  const peakTime = `${displayHour} ${ampm}`;

  const topChannel = data?.top_channels?.[0]?.channel_name || "—";
  const topBinge = data?.binge_sessions?.top_by_duration?.[0];
  const bingeStr = topBinge
    ? `${Math.floor((topBinge.total_duration_seconds || 0) / 3600)}h ${Math.round(((topBinge.total_duration_seconds || 0) % 3600) / 60)}m`
    : "None";
  const topGenre = data?.genre_breakdown?.[0]?.label?.split(" · ")[0] || "—";
  const dailyAvg = videoCount > 0 ? Math.round(videoCount / 365) : 0;

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const url = await toJpeg(cardRef.current, {
        quality: 0.95, backgroundColor: "#0E0C09", pixelRatio: 3,
      });
      const a = document.createElement("a");
      a.download = "YouTube_Wrapped.jpg";
      a.href = url;
      a.click();
    } catch {
      // export failed silently
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 0%, rgba(255,174,92,0.08) 0%, var(--void) 50%)",
    }}>
      {/* Phosphor glow top */}
      <div style={{
        position: "absolute", top: "-5%", left: "50%", transform: "translateX(-50%)",
        width: 380, height: 200, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,174,92,0.15), transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "48px 20px 24px", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--rust)", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 6 }}>
            Your Year in Review
          </p>
          <h2 style={{ fontFamily: "var(--font-display), monospace", fontSize: 26, fontWeight: 400, color: "#FFAE5C", letterSpacing: "0.05em" }}>YouTube Wrapped</h2>
        </motion.div>

        {/* Exportable Card — NO backdrop-filter, layered gradients + borders instead */}
        <div ref={cardRef} style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: "linear-gradient(145deg, rgba(217,222,230,0.04) 0%, rgba(14,12,9,0.95) 100%)",
          border: "1px solid var(--border-chrome)",
          borderRadius: 32, padding: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(217,222,230,0.08)",
        }}>
          {/* Accent Line — holo gradient */}
          <div style={{ height: 4, borderRadius: 99, background: "var(--holo)", marginBottom: 20, opacity: 0.7 }} />

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
            <StatCard label="Videos Watched" value={videoCount.toLocaleString()} color="#FFAE5C" delay={0.4} />
            <StatCard label="Daily Average" value={`~${dailyAvg} / day`} color="var(--rust)" delay={0.5} />
            <StatCard label="Top Channel" value={topChannel} color="var(--chrome)" delay={0.6} />
            <StatCard label="Peak Hour" value={peakTime} color="#FFAE5C" delay={0.7} />
            <StatCard label="Top Genre" value={topGenre} color="var(--signal)" delay={0.8} />
            <StatCard label="Longest Binge" value={bingeStr} color="var(--rust)" delay={0.9} />
          </div>

          <div style={{ marginTop: 20, textAlign: "center", fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            youtube-wrapped.app
          </div>
        </div>

        {/* Action Button — phosphor, not red gradient */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={handleExport}
          disabled={isExporting}
          style={{
            marginTop: 20, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: 18, borderRadius: 24, border: "none", cursor: "pointer",
            background: "var(--phosphor)", color: "var(--void)",
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
            boxShadow: "0 8px 30px rgba(255,174,92,0.25)", transform: "scale(1)", transition: "transform 0.15s ease",
            opacity: isExporting ? 0.8 : 1,
          }}
          onPointerDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
          onPointerUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          onPointerLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Download size={20} strokeWidth={2.5} />
          {isExporting ? "Saving Image..." : "Save & Share"}
        </motion.button>
      </div>
    </div>
  );
}
