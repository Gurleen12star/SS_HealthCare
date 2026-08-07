"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";

export default function HealthAadhaar() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#526158] bg-[#f8faf9]">Loading...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-[#a11d1d] bg-[#f8faf9]">Profile not found</div>;

  const qrValue = JSON.stringify({ patient_id: profile.id });

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28 flex flex-col items-center">
      <div className="w-full mb-6 flex items-center justify-between">
        <Link href="/patient" className="text-2xl text-[#526158]">←</Link>
      </div>

      <div className="text-center mt-2 mb-8">
        <h1 className="text-3xl font-bold text-[#17211b]">Health Aadhaar</h1>
        <p className="mt-2 text-lg text-[#526158]">
          Show this QR code to your ASHA worker or doctor to share your health history.
        </p>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-lg border border-[#dfe7e2] overflow-hidden">
        <div className="bg-[#176b4d] p-6 text-white text-center">
          <h2 className="text-2xl font-bold">{profile.full_name}</h2>
          <p className="text-emerald-100 mt-1">{profile.sex}, {profile.age} years</p>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center bg-white">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#dfe7e2] inline-block">
            <QRCodeSVG 
              value={qrValue} 
              size={220}
              bgColor={"#ffffff"}
              fgColor={"#17211b"}
              level={"Q"}
              includeMargin={false}
            />
          </div>
          <p className="text-[#526158] text-sm mt-6 font-mono bg-[#f8faf9] px-4 py-2 rounded-lg border border-[#dfe7e2]">
            ID: {profile.id.split('-')[0].toUpperCase()}
          </p>
        </div>
        
        <div className="bg-[#f8faf9] p-4 text-center border-t border-[#dfe7e2]">
          <p className="text-xs text-[#526158] font-bold uppercase tracking-widest">Verified by Cardiofy</p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-[#526158]">
        <p>Scanning this grants <strong>temporary secure access</strong> to your reports, prescriptions, and screenings.</p>
      </div>
    </main>
  );
}
