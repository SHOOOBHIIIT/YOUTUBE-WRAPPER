"use client";

import { useState, useEffect, useRef } from "react";

export default function TypewriterText({ text, className, style, speed = 45 }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const raf = requestAnimationFrame(() => {
      if (mq.matches) {
        reducedRef.current = true;
        setDisplayed(text);
        setDone(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [text]);

  useEffect(() => {
    if (reducedRef.current || done) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => setDone(true), 400);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, done]);

  // Blinking cursor
  useEffect(() => {
    if (done) {
      // Keep cursor visible for a moment, then hide
      const t = setTimeout(() => setShowCursor(false), 1200);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, [done]);

  return (
    <span className={className} style={style}>
      {displayed}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.6em",
          height: "1em",
          backgroundColor: "var(--phosphor)",
          marginLeft: "2px",
          verticalAlign: "text-bottom",
          opacity: showCursor ? 1 : 0,
          boxShadow: "0 0 6px rgba(255,174,92,0.6)",
          transition: "opacity 0.1s",
        }}
      />
    </span>
  );
}
