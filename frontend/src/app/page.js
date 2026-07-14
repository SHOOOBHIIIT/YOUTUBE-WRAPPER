import Link from "next/link";
import styles from "./page.module.css";
import CRTHeroSection from "./CRTHeroSection";
import ScrollReveals from "./ScrollReveals";
import TypewriterText from "../components/TypewriterText";
import WarmUpPing from "../components/WarmUpPing";
import PlayButtonSpotlight from "./PlayButtonSpotlight";
import ParticleDust from "./ParticleDust";

export default function Home() {
  return (
    <main className={styles.main}>
      <WarmUpPing />
      <ScrollReveals />

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoDot} aria-hidden="true" />
            <span className={styles.logoText}>YouTube Wrapped</span>
          </div>
          <Link href="/auth" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <PlayButtonSpotlight />
        <ParticleDust />
        <div className={`container ${styles.heroInner}`}>
          <CRTHeroSection />

          <h1 className={`text-display ${styles.headline}`}>
            <TypewriterText text="Your year in YouTube, decoded." />
          </h1>

          <p className={styles.subtitle}>
            Upload your Google Takeout export and get a personalized
            breakdown of your viewing habits — top channels, binge sessions,
            hidden patterns, and more.
          </p>

          <div className={styles.heroCta}>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Start Your Wrapped
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/wrapped/demo" className="btn btn-ghost btn-lg">
              View Sample
            </Link>
          </div>

          {/* Stats strip */}
          <div className={styles.statsStrip} data-gsap-reveal="stats-strip" role="list">
            {[
              { value: "100%", label: "Private" },
              { value: "Free", label: "Always" },
              { value: "5min", label: "Setup" },
            ].map((stat) => (
              <div key={stat.label} className={styles.stat} role="listitem">
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className={styles.features} aria-label="Features">
        <div className="container">
          <h2 className={`text-headline ${styles.featuresTitle}`} data-gsap-reveal="features-title">
            Everything about your watch history
          </h2>
          <div className={styles.featureGrid} role="list">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10,8 16,10 10,12"/>
                  </svg>
                ),
                title: "Top Channels",
                desc: "See which channels you've spent the most time on, ranked by watch sessions.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                  </svg>
                ),
                title: "Watch Patterns",
                desc: "Discover when you watch — late-night habit? Weekend binge? We'll show you.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                ),
                title: "Binge Sessions",
                desc: "Your longest uninterrupted YouTube sessions, down to the minute.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 0 0 8 0"/><line x1="12" y1="2" x2="12" y2="4"/>
                  </svg>
                ),
                title: "Genre Clusters",
                desc: "ML-powered categorization of your viewing — beyond YouTube's basic categories.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                ),
                title: "Taste Drift",
                desc: "Did your interests shift over the year? See how your viewing changed month by month.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                title: "100% Private",
                desc: "Your data is processed locally and tied only to your account. Never shared.",
              },
            ].map((feature) => (
              <article key={feature.title} className={`card ${styles.featureCard}`} data-gsap-reveal="feature-card" role="listitem">
                <div className={styles.featureIcon} aria-hidden="true">{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className={styles.ctaSection} aria-label="Call to action">
        <div className="container">
          <div className={styles.ctaCard} data-gsap-reveal="cta-card">
            <h2 className="text-headline">Your data&apos;s ready. Your story&apos;s waiting.</h2>
            <p className={styles.ctaSubtitle}>
              Sign in with Google and upload your Takeout export. The whole
              process takes about 5 minutes.
            </p>
            <Link href="/auth" className="btn btn-primary btn-lg">
              Generate My Wrapped →
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>YouTube Wrapped is not affiliated with YouTube or Google.</p>
      </footer>
    </main>
  );
}
