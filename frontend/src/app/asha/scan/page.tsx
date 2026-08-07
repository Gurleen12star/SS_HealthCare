"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function ASHAQRScanner() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (result: any) => {
    if (!result || !result.length) return;
    const text = result[0].rawValue;
    
    try {
      if (loading) return;
      setLoading(true);
      setError(null);
      
      const parsed = JSON.parse(text);
      if (!parsed.patient_id) {
        throw new Error("Invalid QR Code format.");
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Create worker_patient_link
      const { error: linkError } = await supabase
        .from('worker_patient_links')
        .insert({
          worker_id: user.id,
          patient_id: parsed.patient_id,
          active: true
        });

      if (linkError) {
        console.error("Link error:", linkError);
        // We might just ignore it if it already exists due to unique constraints
      }

      // 2. Create physical consent override
      const { error: consentError } = await supabase
        .from('consents')
        .insert({
          patient_id: parsed.patient_id,
          worker_id: user.id,
          granted: true,
          screenings: true,
          reports: true,
          prescriptions: true,
          followups: true
        });

      if (consentError) {
         console.error("Consent error:", consentError);
      }
      
      // 3. Redirect to the patient's unified view
      router.push(`/asha/patient/${parsed.patient_id}`);

    } catch (err: any) {
      console.error(err);
      setError("Failed to link patient. " + (err.message || ""));
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#17211b] flex flex-col items-center">
      <div className="w-full p-6 flex items-center justify-between">
        <Link href="/asha" className="text-2xl text-white">←</Link>
        <h1 className="text-lg font-bold text-white">Scan Patient</h1>
        <div className="w-6"></div>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 pb-28">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Scan Health Aadhaar</h2>
          <p className="text-[#a6b6ac]">
            Point your camera at the patient's QR code to instantly link their profile to your dashboard.
          </p>
        </div>
        
        <div className="w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-4 border-[#176b4d] shadow-[0_0_30px_rgba(23,107,77,0.5)] relative">
          {!loading ? (
             <Scanner 
               onScan={handleScan} 
               onError={(e) => console.error(e)}
             />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 flex-col">
               <div className="w-10 h-10 border-4 border-[#176b4d] border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="text-white font-bold animate-pulse">Linking Profile...</p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mt-6 bg-[#a11d1d] text-white p-4 rounded-xl text-center text-sm font-bold w-full max-w-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
