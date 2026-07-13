"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SlideContainer from "@/components/wrapped/SlideContainer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WrappedPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const uploadId = params?.upload_id;

  const [wrappedData, setWrappedData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session?.user?.id) {
      router.push("/");
      return;
    }
    if (!uploadId) return;

    const fetchWrappedData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/wrapped/${uploadId}?user_id=${session.user.id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to fetch wrapped data.");
        }
        const data = await res.json();
        setWrappedData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWrappedData();
  }, [uploadId, session, authStatus, router]);

  if (authStatus === "loading" || isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--void)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Ambient phosphor glow */}
        <div style={{
          position: "fixed", top: "10%", left: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,174,92,0.08), transparent)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {/* Animated phosphor ring */}
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "3px solid transparent",
              borderTopColor: "var(--phosphor)",
              borderRightColor: "var(--rust)",
              animation: "spin 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 6,
              background: "rgba(255,174,92,0.08)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg viewBox="0 0 24 24" fill="var(--phosphor)" width={24} height={24}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-body), sans-serif", color: "var(--text-primary)", fontSize: 18, fontWeight: 600, margin: 0 }}>Generating your Wrapped</p>
            <p style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Crunching your viewing history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--void)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          background: "linear-gradient(145deg, rgba(217,222,230,0.04) 0%, rgba(14,12,9,0.95) 100%)",
          border: "1px solid var(--border-chrome)",
          borderRadius: 28, padding: 40, maxWidth: 400, width: "100%", textAlign: "center",
        }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-body), sans-serif", color: "var(--text-primary)", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{error}</p>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "var(--phosphor)",
              color: "var(--void)", border: "none", borderRadius: 100,
              padding: "12px 28px", fontFamily: "var(--font-body), sans-serif",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,174,92,0.25)",
            }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!wrappedData) return null;

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--void)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background blobs */}
      <div style={{
        position: "fixed", top: "-5%", left: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,174,92,0.06), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "0%", right: "-15%",
        width: 450, height: 450, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,94,60,0.06), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Phone frame */}
      <div style={{
        width: "100%",
        maxWidth: 390,
        height: "min(820px, calc(100vh - 40px))",
        background: "var(--void)",
        borderRadius: 44,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 0 0 1px var(--border-subtle), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(255,174,92,0.06)",
        border: "1px solid rgba(217,222,230,0.06)",
      }}>
        {/* Subtle top chrome shine */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(217,222,230,0.12), transparent)",
          zIndex: 100,
        }} />
        <SlideContainer data={wrappedData} />
      </div>
    </main>
  );
}
