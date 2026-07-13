import Link from "next/link";
import styles from "../page.module.css";

export const metadata = {
  title: "How to get your YouTube data — YouTube Wrapped",
  description: "Step-by-step guide to exporting your YouTube watch history from Google Takeout.",
};

export default function OnboardingPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoDot} aria-hidden="true" />
            <span className={styles.logoText}>YouTube Wrapped</span>
          </div>
          <Link href="/auth" className="btn btn-secondary btn-sm">
            Sign In
          </Link>
        </div>
      </nav>

      <section className={styles.hero} style={{ paddingTop: "120px" }}>
        <div className={`container`} style={{ maxWidth: "800px", textAlign: "left" }}>
          <h1 className="text-display" style={{ marginBottom: "24px" }}>
            How to get your <span style={{ color: "var(--phosphor)" }}>YouTube Data</span>
          </h1>
          <p className="text-title" style={{ color: "var(--text-secondary)", marginBottom: "48px" }}>
            Because YouTube doesn&apos;t provide a public API for your private watch history, 
            you need to request it directly from Google Takeout. It takes about 2 minutes to request, 
            and Google usually emails it to you within an hour.
          </p>

          <div className="card panel-chrome" style={{ padding: "40px", marginBottom: "40px" }}>
            <h2 className="text-headline" style={{ marginBottom: "24px" }}>Step-by-step Guide</h2>
            
            <ol style={{ paddingLeft: "24px", color: "var(--text-primary)", fontSize: "1.1rem", lineHeight: "1.8" }}>
              <li style={{ marginBottom: "16px" }}>
                Go to <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--phosphor)", textDecoration: "underline" }}>Google Takeout</a>.
              </li>
              <li style={{ marginBottom: "16px" }}>
                Click <strong>&quot;Deselect all&quot;</strong> at the top of the list. (This is important so you don&apos;t download gigabytes of irrelevant data!)
              </li>
              <li style={{ marginBottom: "16px" }}>
                Scroll all the way down to the bottom and check the box next to <strong>&quot;YouTube and YouTube Music&quot;</strong>.
              </li>
              <li style={{ marginBottom: "16px" }}>
                Click on the <strong>&quot;Multiple formats&quot;</strong> button, and ensure that the &quot;History&quot; format is set to <strong>JSON</strong> (not HTML).
              </li>
              <li style={{ marginBottom: "16px" }}>
                Click on the <strong>&quot;All YouTube data included&quot;</strong> button, click &quot;Deselect all&quot;, and then check ONLY <strong>&quot;history&quot;</strong>. Click OK.
              </li>
              <li style={{ marginBottom: "16px" }}>
                Scroll down and click <strong>&quot;Next step&quot;</strong>.
              </li>
              <li style={{ marginBottom: "16px" }}>
                Leave the destination as &quot;Send download link via email&quot; and click <strong>&quot;Create export&quot;</strong>.
              </li>
            </ol>
          </div>

          <div className="card" style={{ background: "rgba(232, 80, 58, 0.04)", borderColor: "rgba(232, 80, 58, 0.15)", padding: "32px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-body), sans-serif", fontSize: "1.2rem", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)" }}>
              Waiting for Google?
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
              Google is now compiling your data. They will send you an email when it&apos;s ready. 
              Once you download the <strong>.zip</strong> file, come back here to generate your Wrapped!
            </p>
            <Link href="/upload" className="btn btn-primary btn-lg">
              I have my .zip file — Let&apos;s go!
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
