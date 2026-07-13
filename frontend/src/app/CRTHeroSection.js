"use client";

import dynamic from "next/dynamic";
import styles from "./page.module.css";

const CRTHero = dynamic(() => import("@/components/CRTHero"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse, rgba(255,174,92,0.05) 0%, transparent 70%)",
        borderRadius: 24,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: "var(--phosphor)",
          opacity: 0.5,
        }}
      >
        INITIALIZING...
      </div>
    </div>
  ),
});

export default function CRTHeroSection() {
  return (
    <div className={styles["crt-hero-wrapper"]}>
      <CRTHero />
    </div>
  );
}
