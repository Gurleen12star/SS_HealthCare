"use client";

import { useEffect, useState } from "react";
import { getBackendHealth } from "@/lib/api";


export default function BackendStatus() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    async function checkBackend() {
      try {
        const data = await getBackendHealth();

        if (data.status === "ok") {
          setStatus("Backend connected ✓");
        } else {
          setStatus("Backend unavailable");
        }
      } catch {
        setStatus("Backend unavailable");
      }
    }

    checkBackend();
  }, []);

  return (
    <p className="mt-4 text-sm">
      {status}
    </p>
  );
}
