"use client";

import { useState, useEffect } from "react";

export default function ConnectionStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#fff1f1] px-4 py-2 text-center text-sm font-medium text-[#a11d1d]">
      <p>📴 Offline</p>
      <p className="text-xs">Some actions will be saved until your connection returns.</p>
    </div>
  );
}
