"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export default function PlayButtonSpotlight() {
  const wrapRef = useRef(null);
  const maskRef = useRef(null);
  const [active, setActive] = useState(false);

  const onMouseMove = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !maskRef.current) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    maskRef.current.style.setProperty("--mx", `${x}%`);
    maskRef.current.style.setProperty("--my", `${y}%`);
  }, []);

  useEffect(() => {
    const onDocMove = (e) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      setActive(inside);
      if (inside) onMouseMove(e);
    };
    document.addEventListener("mousemove", onDocMove, { passive: true });
    return () => document.removeEventListener("mousemove", onDocMove);
  }, [onMouseMove]);

  return (
    <div ref={wrapRef} className="play-spotlight-wrap" aria-hidden="true">
      <div
        ref={maskRef}
        className={`play-spotlight-mask${active ? " active" : ""}`}
      >
        <div className="play-spotlight-position">
          <div className="play-spotlight-spin">
            {/* Primary triangle */}
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="play-spotlight-svg"
            >
              <polygon
                points="60,30 60,170 170,100"
                stroke="var(--chrome)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Ghost triangle — glass depth */}
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="play-spotlight-ghost"
            >
              <polygon
                points="60,30 60,170 170,100"
                stroke="var(--phosphor)"
                strokeWidth="0.8"
                strokeLinejoin="round"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
