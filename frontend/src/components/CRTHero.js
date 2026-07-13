"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function CRTBody({ bootComplete, mouseRef }) {
  const groupRef = useRef();
  const screenRef = useRef();
  const glowRef = useRef();

  const screenTexture = useMemo(() => {
    if (!bootComplete) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 512, 256);

    ctx.font = "600 44px 'VT323', monospace";
    ctx.fillStyle = "#5C3A1E";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(92, 58, 30, 0.9)";
    ctx.shadowBlur = 8;
    ctx.fillText("YOUTUBE", 256, 108);
    ctx.fillText("WRAPPED", 256, 158);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [bootComplete]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Screen emissive flicker
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = bootComplete
        ? 0.3 + Math.sin(t * 8) * 0.03
        : 0.15 + Math.sin(t * 4) * 0.05;
    }

    // Pulsing screen point light
    if (glowRef.current) {
      glowRef.current.intensity = 0.8 + Math.sin(t * 2) * 0.3;
    }

    // Mouse-driven rotation only
    if (groupRef.current) {
      const m = mouseRef.current;
      const mouseRotX = m.y * 0.08;
      const mouseRotY = m.x * 0.12;

      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mouseRotX,
        0.06
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouseRotY,
        0.06
      );
    }
  });

  const chromeProps = {
    color: "#D9DEE6",
    roughness: 0.12,
    metalness: 0.92,
  };

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
      <group ref={groupRef}>
        {/* Main CRT housing — lighter so it's visible on dark bg */}
        <mesh castShadow>
          <boxGeometry args={[3.2, 2.4, 2.2]} />
          <meshStandardMaterial color="#3a3530" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Screen bezel */}
        <mesh position={[0, 0, 1.11]}>
          <boxGeometry args={[2.92, 2.12, 0.06]} />
          <meshStandardMaterial color="#121010" roughness={0.95} metalness={0.05} />
        </mesh>

        {/* Screen surface — phosphor glow */}
        <mesh position={[0, 0, 1.15]}>
          <planeGeometry args={[2.64, 1.84]} />
          <meshStandardMaterial
            ref={screenRef}
            color={bootComplete ? "#112211" : "#111010"}
            emissive={bootComplete ? "#FFAE5C" : "#553300"}
            emissiveIntensity={bootComplete ? 0.3 : 0.15}
            toneMapped={false}
          />
        </mesh>

        {/* Screen text — glowing CRT title */}
        {screenTexture && (
          <mesh position={[0, 0, 1.16]}>
            <planeGeometry args={[2.64, 1.84]} />
            <meshBasicMaterial
              map={screenTexture}
              transparent
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Screen glow light */}
        <pointLight
          ref={glowRef}
          position={[0, 0, 2.2]}
          color="#FFAE5C"
          intensity={0.5}
          distance={8}
          decay={2}
        />

        {/* Chrome frame — top */}
        <mesh position={[0, 1.2, 1.14]}>
          <boxGeometry args={[3.04, 0.08, 0.14]} />
          <meshStandardMaterial {...chromeProps} />
        </mesh>

        {/* Chrome frame — bottom */}
        <mesh position={[0, -1.2, 1.14]}>
          <boxGeometry args={[3.04, 0.08, 0.14]} />
          <meshStandardMaterial {...chromeProps} />
        </mesh>

        {/* Chrome frame — left */}
        <mesh position={[-1.56, 0, 1.14]}>
          <boxGeometry args={[0.08, 2.4, 0.14]} />
          <meshStandardMaterial {...chromeProps} />
        </mesh>

        {/* Chrome frame — right */}
        <mesh position={[1.56, 0, 1.14]}>
          <boxGeometry args={[0.08, 2.4, 0.14]} />
          <meshStandardMaterial {...chromeProps} />
        </mesh>

        {/* Ventilation slots */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 1.22, -0.3]}>
            <boxGeometry args={[0.15, 0.025, 0.8]} />
            <meshStandardMaterial color="#121010" roughness={0.95} />
          </mesh>
        ))}

        {/* Base foot */}
        <mesh position={[0, -1.45, 0.15]}>
          <cylinderGeometry args={[0.85, 1.05, 0.15, 32]} />
          <meshStandardMaterial color="#3a3530" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Chrome neck */}
        <mesh position={[0, -1.32, 0.15]}>
          <cylinderGeometry args={[0.18, 0.18, 0.22, 16]} />
          <meshStandardMaterial {...chromeProps} />
        </mesh>

        {/* Power LED */}
        <mesh position={[1.2, -1.05, 1.15]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color="#E8503A"
            emissive="#E8503A"
            emissiveIntensity={4}
            toneMapped={false}
          />
        </mesh>

        {/* LED glow */}
        <pointLight position={[1.2, -1.05, 1.3]} color="#E8503A" intensity={0.3} distance={2} decay={2} />
      </group>
    </Float>
  );
}

function BootText({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  const bootSequence = useMemo(
    () => [
      // boot sequence text, could make this configurable later
      { text: "LOADING 2026 ARCHIVE...", delay: 0 },
      { text: "SCANNING WATCH_HISTORY.JSON", delay: 600 },
      { text: "PARSING 47,291 ENTRIES...", delay: 1200 },
      { text: "BUILDING WRAPPED...", delay: 1800 },
      { text: "", delay: 2200 },
    ],
    []
  );

  useEffect(() => {
    const timers = [];
    bootSequence.forEach(({ text, delay }) => {
      timers.push(
        setTimeout(() => setLines((prev) => [...prev, text]), delay)
      );
    });
    timers.push(setTimeout(() => onComplete(), 2600));
    return () => timers.forEach(clearTimeout);
  }, [bootSequence, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px 16px",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "clamp(9px, 1.8vw, 13px)",
        color: "#FFAE5C",
        textShadow: "0 0 8px rgba(255,174,92,0.6)",
        textAlign: "center",
        lineHeight: 1.8,
        overflow: "hidden",
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: line === "" ? 0 : 1 }}>
          {line && (
            <>
              <span style={{ color: "#8B5E3C" }}>{">"} </span>
              {line}
            </>
          )}
        </div>
      ))}
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 14,
          background: "#FFAE5C",
          marginTop: 4,
          opacity: cursorVisible ? 1 : 0,
          boxShadow: "0 0 6px rgba(255,174,92,0.8)",
        }}
      />
    </div>
  );
}

export default function CRTHero() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // respect reduced motion pref (accessibility win)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      const raf = requestAnimationFrame(() => {
        setReducedMotion(true);
        setBootDone(true);
      });
      return () => cancelAnimationFrame(raf);
    }
    const handler = (e) => {
      if (e.matches) {
        setReducedMotion(true);
        setBootDone(true);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // mouse parallax — normalized -1 to 1
  // took a while to get the math right on this
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseRef.current = { x, y };
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const handleBootComplete = useCallback(() => setBootDone(true), []);

  // Static fallback
  if (reducedMotion) {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse, rgba(255,174,92,0.08) 0%, transparent 70%)",
          borderRadius: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 14,
            color: "var(--phosphor)",
            textShadow: "0 0 8px rgba(255,174,92,0.4)",
          }}
        >
          <span style={{ color: "var(--rust)" }}>{">"} </span>
          LOADING 2026 ARCHIVE...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* 3D Canvas */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.3, 5.5], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: "default" }}
          style={{ background: "transparent" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
          }}
        >
          {/* Strong multi-directional lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.9} color="#D9DEE6" />
          <directionalLight position={[-4, 3, 4]} intensity={0.5} color="#FFAE5C" />
          <directionalLight position={[0, -2, 3]} intensity={0.3} color="#E8503A" />
          <pointLight position={[3, 2, 3]} intensity={0.4} color="#ffffff" />
          <pointLight position={[-3, -1, 2]} intensity={0.3} color="#FFAE5C" />

          {/* CRT 3D model */}
          <CRTBody bootComplete={bootDone} mouseRef={mouseRef} />
        </Canvas>
      </div>

      {/* Boot text overlay — positioned over the screen area */}
      {!bootDone && (
        <div
          style={{
            position: "absolute",
            top: "22%",
            left: "18%",
            right: "18%",
            bottom: "28%",
            pointerEvents: "none",
          }}
        >
          <BootText onComplete={handleBootComplete} />
        </div>
      )}
    </div>
  );
}
