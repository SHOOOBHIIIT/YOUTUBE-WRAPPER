"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [showFlicker, setShowFlicker] = useState(false);
  const prevPathRef = useRef(pathname);
  const flickerTimerRef = useRef(null);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      // Defer flicker start to next tick
      const t = setTimeout(() => {
        setShowFlicker(true);
        flickerTimerRef.current = setTimeout(() => setShowFlicker(false), 150);
      }, 0);
      return () => {
        clearTimeout(t);
        if (flickerTimerRef.current) clearTimeout(flickerTimerRef.current);
      };
    }
  }, [pathname]);

  return (
    <>
      {showFlicker && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "none",
            background: "var(--void)",
            animation: "crt-flicker 0.15s steps(2) 1",
          }}
        >
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            <filter id="page-static">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#page-static)" opacity="0.5" />
          </svg>
        </div>
      )}
      {children}
    </>
  );
}
