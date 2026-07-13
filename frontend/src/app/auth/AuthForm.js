"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./auth.module.css";

export default function AuthForm() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/upload");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className={styles.card}>
        <div className={styles.spinner} aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className={`card panel-chrome animate-fade-in-scale ${styles.card}`}>
      {/* Power LED */}
      <span className={styles.powerLed} aria-hidden="true" />

      {/* Logo */}
      <div className={styles.logoWrap} aria-hidden="true">
        <span className={styles.logoDot} />
      </div>

      <h1 className={`text-title ${styles.title}`}>Welcome to YouTube Wrapped</h1>
      <p className={styles.subtitle}>
        Sign in with Google to get your personalized YouTube viewing summary.
        We only use your account for identity — your watch history stays private.
      </p>

      <button
        id="google-signin-btn"
        className={`btn btn-google ${styles.googleBtn}`}
        onClick={() => signIn("google", { callbackUrl: "/upload" })}
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      <p className={styles.disclaimer}>
        By continuing, you agree that YouTube Wrapped will only access your Google
        account name and email for login purposes. Your YouTube watch history is
        never accessed via OAuth — you upload it manually via Google Takeout.
      </p>
    </div>
  );
}
