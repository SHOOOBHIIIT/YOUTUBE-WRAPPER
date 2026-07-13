"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./upload.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const UPLOAD_STATES = {
  IDLE: "idle",
  DRAGGING: "dragging",
  UPLOADING: "uploading",
  ERROR: "error",
};  // could use an enum but this is simpler

export default function UploadClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const inputRef = useRef(null);

  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [pastWraps, setPastWraps] = useState([]);
  const [isLoadingPastWraps, setIsLoadingPastWraps] = useState(true);
  const intervalRefs = useRef([]);

  const handleDeleteWrap = async (e, uploadId) => {
    e.preventDefault();
    e.stopPropagation();  // stop the click from bubbling up to the parent Link
    if (!confirm("Are you sure you want to delete this Wrapped result?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/wrapped/${uploadId}?user_id=${session.user.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPastWraps(prev => prev.filter(w => w.upload_id !== uploadId));
      } else {
        alert("Failed to delete.");
      }
    } catch {
      alert("Error deleting.");
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchPastWraps = async () => {
        try {
          setIsLoadingPastWraps(true);
          const res = await fetch(`${API_URL}/api/wrapped/user/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            setPastWraps(data || []);
          }
        } catch {
          // ignore — past wraps are non-critical
        } finally {
          setIsLoadingPastWraps(false);
        }
      };
      fetchPastWraps();
    }
  }, [status, session]);

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
    };
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setErrorMsg("Please select a .zip file from Google Takeout.");
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }
    setSelectedFile(file);
    setUploadState(UPLOAD_STATES.IDLE);
    setErrorMsg("");
  }, []);

  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setUploadState(UPLOAD_STATES.IDLE);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setUploadState(UPLOAD_STATES.DRAGGING);
  };

  const onDragLeave = () => {
    if (uploadState === UPLOAD_STATES.DRAGGING) {
      setUploadState(UPLOAD_STATES.IDLE);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState(UPLOAD_STATES.UPLOADING);
    setProgress(0);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (session?.user?.id) {
      formData.append("user_id", session.user.id);
    }
    
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) formData.append("timezone", tz);
    } catch {
      // timezone not critical
    }

    const clearAll = () => {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
    };
    clearAll();  // clear any existing intervals first

    const uploadInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 5, 50));
    }, 200);
    intervalRefs.current.push(uploadInterval);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(uploadInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed." }));
        throw new Error(err.detail || "Upload failed.");
      }

      const data = await res.json();
      const uploadId = data.upload_id;
      
      const pollInterval = setInterval(async () => {
        try {
          const userIdParam = session?.user?.id ? `?user_id=${session.user.id}` : "";
          const statusRes = await fetch(`${API_URL}/api/upload/${uploadId}/status${userIdParam}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setProgress((p) => Math.min(p + Math.random() * 2, 95));
            
            if (statusData.status === "complete") {
              clearAll();
              setProgress(100);
              router.push(`/wrapped/${uploadId}`);
            } else if (statusData.status === "failed") {
              clearAll();
              throw new Error(statusData.error_message || "Processing failed.");
            }
          }
        } catch (pollErr) {
          clearAll();
          setErrorMsg(pollErr.message || "Error checking status.");
          setUploadState(UPLOAD_STATES.ERROR);
        }
      }, 2000);
      intervalRefs.current.push(pollInterval);

    } catch (err) {
      clearAll();
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setUploadState(UPLOAD_STATES.ERROR);
    }
  };

  if (status === "loading") {
    return <div className={styles.spinner} aria-label="Loading session" />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px", maxWidth: 400 }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          You need to sign in first.
        </p>
        <Link href="/auth" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className="text-headline">Upload Your Watch History</h1>
        <p className={styles.headerSubtitle}>
          Upload your Google Takeout <strong>.zip</strong> file to generate your Wrapped.
          Don&apos;t have one yet?{" "}
          <Link href="/onboarding" className={styles.link}>
            Here&apos;s how to export it →
          </Link>
        </p>
      </div>

      <div
        id="upload-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Drop your Takeout zip file here or click to browse"
        className={`card ${styles.dropzone} ${uploadState === UPLOAD_STATES.DRAGGING ? styles.dragging : ""} ${selectedFile ? styles.hasFile : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id="file-input"
          type="file"
          accept=".zip"
          className={styles.hiddenInput}
          onChange={onFileChange}
          aria-hidden="true"
        />

        {selectedFile ? (
          <div className={styles.fileSelected}>
            <div className={styles.fileIcon} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <p className={styles.fileName}>{selectedFile.name}</p>
              <p className={styles.fileSize}>
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <div className={styles.dropIcon} aria-hidden="true">
              {uploadState === UPLOAD_STATES.DRAGGING ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              )}
            </div>
            <p className={styles.dropTitle}>
              {uploadState === UPLOAD_STATES.DRAGGING
                ? "Drop it!"
                : "Drag & drop your Takeout zip here"}
            </p>
            <p className={styles.dropHint}>or click to browse — .zip files only</p>
          </div>
        )}
      </div>

      {uploadState === UPLOAD_STATES.ERROR && (
        <div className={styles.errorBox} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {uploadState === UPLOAD_STATES.UPLOADING && (
        <div className={styles.progressWrap} role="status" aria-label="Uploading">
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressLabel}>Processing... {Math.round(progress)}%</p>
        </div>
      )}

      <button
        id="upload-submit-btn"
        className={`btn btn-primary btn-lg ${styles.uploadBtn}`}
        onClick={handleUpload}
        disabled={!selectedFile || uploadState === UPLOAD_STATES.UPLOADING}
        type="button"
      >
        {uploadState === UPLOAD_STATES.UPLOADING ? (
          <>
            <span className={styles.spinnerSmall} aria-hidden="true" />
            Processing...
          </>
        ) : (
          "Generate My Wrapped →"
        )}
      </button>

      <p className={styles.privacyNote}>
        Your file is processed securely and only associated with your account.
        We never share your viewing history.
      </p>

      {!isLoadingPastWraps && pastWraps.length > 0 && (
        <div style={{ marginTop: 40, width: "100%" }}>
          <h2 className="text-title" style={{ marginBottom: 16 }}>Your Past Wraps</h2>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {pastWraps.map((wrap) => (
              <Link key={wrap.upload_id} href={`/wrapped/${wrap.upload_id}`} style={{ textDecoration: "none" }}>
                <div className="card panel-chrome" style={{ transition: "transform 0.2s", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                  <div style={{ color: "var(--phosphor)", opacity: 0.7 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><polygon points="10,8 16,10 10,12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono), monospace" }}>
                      {new Date(wrap.generated_at).toLocaleDateString()}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                      {wrap.video_count.toLocaleString()} videos watched
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                      Top: {wrap.top_channel}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteWrap(e, wrap.upload_id)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "var(--signal-dim)",
                      color: "var(--signal)",
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                    title="Delete this wrap"
                  >
                    ×
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
