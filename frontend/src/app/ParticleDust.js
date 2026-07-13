"use client";

import { useState, useEffect, useRef } from "react";

function makeParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 20,
      opacity: 0.15 + Math.random() * 0.25,
    });
  }
  return particles;
}

export default function ParticleDust() {
  const [particles, setParticles] = useState([]);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const raf = requestAnimationFrame(() => {
        setParticles(makeParticles(30));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="particle-dust" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle-dot"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
