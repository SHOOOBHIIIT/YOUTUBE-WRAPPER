"use client";

import { useEffect } from "react";

export default function WarmUpPing() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    // ping render so its warm by the time the user uploads their zip
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

  return null;
}
