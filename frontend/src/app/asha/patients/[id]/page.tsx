"use client";

import Link from "next/link";
import AppButton from "@/components/ui/AppButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AshaPatientDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return;
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        const { data: screeningsData } = await supabase
          .from('screenings')
          .select('*')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        if (screeningsData) {
          setScreenings(screeningsData);
        }
      } catch (err) {
        console.error("Failed to load patient data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28 text-center mt-12 text-[#526158]">
        Loading patient details...
      </main>
    );
  }
  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6">
        <Link href="/asha/patients" className="text-[#526158] font-bold">← Patients</Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase">{profile?.full_name || "Patient"}</h1>
        <p className="text-[#526158]">{profile?.patient_code || "Unknown ID"}</p>
      </div>

      <div className="bg-white border border-[#dfe7e2] p-5 rounded-2xl mb-8">
        <h2 className="text-sm font-bold tracking-wider text-[#526158] uppercase mb-4">Current Follow-up</h2>
        
        <div className="mb-4">
          <StatusBadge status="follow-up" />
        </div>
        
        <p className="text-xs text-[#526158] uppercase tracking-wider font-bold mb-1">Reason:</p>
        <p className="mb-5">Anaemia screening follow-up</p>
        
        <AppButton>MARK COMPLETE</AppButton>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold tracking-wider text-[#526158] uppercase mb-4">Recent Health Activity</h2>
        
        <div className="space-y-4">
          {screenings.length === 0 ? (
            <p className="text-sm text-[#526158]">No recent activity recorded.</p>
          ) : (
            screenings.map(s => (
              <div key={s.id} className="flex gap-4 items-start">
                <span className="text-2xl mt-1">
                  {s.screening_type === 'anemia' ? '🩸' : s.screening_type === 'covid' ? '🦠' : '🩺'}
                </span>
                <div>
                  <p className="font-bold capitalize">{s.screening_type} Screening</p>
                  <p className={`text-sm ${s.risk_level === 'elevated' ? 'text-[#a11d1d]' : 'text-[#526158]'}`}>
                    {s.result_label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <AppButton variant="secondary">VIEW HEALTH HISTORY</AppButton>
    </main>
  );
}
