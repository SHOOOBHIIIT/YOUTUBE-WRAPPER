"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import Slide1Totals from "./Slide1Totals";
import Slide2Channels from "./Slide2Channels";
import Slide3Peak from "./Slide3Peak";
import Slide4Binge from "./Slide4Binge";
import Slide5Genres from "./Slide5Genres";
import Slide6TasteDrift from "./Slide6TasteDrift";
import Slide7Summary from "./Slide7Summary";

const SLIDE_DURATION_MS = 8000;

function StaticFlicker({ active }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        background: "var(--void)",
        animation: "crt-flicker 0.15s steps(2) 1",
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
        <filter id="static-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#static-noise)" opacity="0.5" />
      </svg>
    </div>
  );
}

export default function SlideContainer({ data }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressStartTimeRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [showFlicker, setShowFlicker] = useState(false);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    progressStartTimeRef.current = Date.now();
  }, []);

  const slides = useMemo(() => [
    { id: "totals",    component: Slide1Totals },
    { id: "channels",  component: Slide2Channels },
    { id: "peak",      component: Slide3Peak },
    { id: "binge",     component: Slide4Binge },
    { id: "genres",    component: Slide5Genres },
    { id: "tastedrift",component: Slide6TasteDrift },
    { id: "summary",   component: Slide7Summary },
  ], []);

  const resetTimer = () => {
    progressStartTimeRef.current = Date.now();
    setProgress(0);
  };

  const triggerFlicker = () => {
    setShowFlicker(true);
    setTimeout(() => setShowFlicker(false), 150);
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      triggerFlicker();
      setCurrentIndex((p) => p + 1);
      resetTimer();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      triggerFlicker();
      setCurrentIndex((p) => p - 1);
      resetTimer();
    }
  };

  const goNextRef = useRef(goNext);

  useEffect(() => {
    goNextRef.current = goNext;
  });

  useEffect(() => {
    let frame;
    const tick = () => {
      if (!isPaused && currentIndex < slides.length - 1) {
        const elapsed = Date.now() - progressStartTimeRef.current;
        const pct = Math.min((elapsed / SLIDE_DURATION_MS) * 100, 100);
        setProgress(pct);
        if (pct >= 100) goNextRef.current();
        else frame = requestAnimationFrame(tick);
      } else if (currentIndex === slides.length - 1) {
        // last slide, just show full progress bar
        setProgress(100);
      }
      // when paused, dont schedule another frame — saves cpu cycles
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentIndex, isPaused, slides.length]);

  const handleTap = (e) => {
    if (e.target.closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  // Touch swipe support
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only register horizontal swipes (dx > dy)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const CurrentSlide = slides[currentIndex].component;

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", background: "var(--void)", userSelect: "none", display: "flex", flexDirection: "column" }}
      onPointerDown={(e) => { if (!e.target.closest("button")) setIsPaused(true); }}
      onPointerUp={(e) => { setIsPaused(false); handleTap(e); }}
      onPointerLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Static flicker transition */}
      <StaticFlicker active={showFlicker} />

      {/* Progress bars */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        zIndex: 60,
        padding: "14px 14px 0",
        display: "flex", gap: 4,
        background: "linear-gradient(to bottom, rgba(14,12,9,0.8) 0%, transparent 100%)",
      }}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            style={{
              flex: 1, height: 3, borderRadius: 99,
              background: "rgba(217,222,230,0.1)",
              overflow: "hidden",
            }}
          >
            <div style={{
              height: "100%",
              borderRadius: 99,
              background: i === currentIndex ? "#FFAE5C" : i < currentIndex ? "var(--rust)" : "transparent",
              width: i === currentIndex ? `${progress}%` : i < currentIndex ? "100%" : "0%",
              transition: i === currentIndex && !isPaused ? "width 0.1s linear" : "none",
              boxShadow: i === currentIndex ? "0 0 8px rgba(255,174,92,0.6)" : "none",
            }} />
          </div>
        ))}
      </div>

      {/* YouTube badge (top-right) */}
      <div style={{
        position: "absolute", top: 22, right: 14,
        zIndex: 61,
        display: "flex", alignItems: "center", gap: 5,
        background: "rgba(14,12,9,0.6)",
        borderRadius: 99, padding: "4px 10px 4px 7px",
        border: "1px solid var(--border-subtle)",
      }}>
        <svg viewBox="0 0 24 24" fill="var(--signal)" width={14} height={14}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em" }}>WRAPPED</span>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }} id="wrapped-slide-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
          >
            <CurrentSlide data={data} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide counter (bottom center) */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex", gap: 5,
      }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: i === currentIndex ? 16 : 5,
            height: 5, borderRadius: 99,
            background: i === currentIndex ? "#FFAE5C" : "rgba(217,222,230,0.2)",
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}
