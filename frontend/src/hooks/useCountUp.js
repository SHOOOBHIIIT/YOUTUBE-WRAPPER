"use client";
import { useState, useEffect } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms,
 * starting after `delay` ms. Resets cleanly on remount.
 */
export function useCountUp(target, duration = 2000, delay = 300) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) return;
    let raf;
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return count;
}
