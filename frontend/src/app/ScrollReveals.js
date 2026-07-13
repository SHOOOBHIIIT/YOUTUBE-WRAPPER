"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ScrollReveals() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Feature cards — stagger fade up
      const featureCards = document.querySelectorAll("[data-gsap-reveal='feature-card']");
      if (featureCards.length) {
        gsap.set(featureCards, { opacity: 0, y: 40 });
        ScrollTrigger.batch(featureCards, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              stagger: 0.12,
            });
          },
          start: "top 85%",
        });
      }

      // Stats strip — slide up
      const statsStrip = document.querySelector("[data-gsap-reveal='stats-strip']");
      if (statsStrip) {
        gsap.from(statsStrip, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: statsStrip,
            start: "top 90%",
          },
        });
      }

      // CTA card — scale in
      const ctaCard = document.querySelector("[data-gsap-reveal='cta-card']");
      if (ctaCard) {
        gsap.from(ctaCard, {
          opacity: 0,
          scale: 0.95,
          y: 30,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ctaCard,
            start: "top 85%",
          },
        });
      }

      // Features title
      const featuresTitle = document.querySelector("[data-gsap-reveal='features-title']");
      if (featuresTitle) {
        gsap.from(featuresTitle, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresTitle,
            start: "top 88%",
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
