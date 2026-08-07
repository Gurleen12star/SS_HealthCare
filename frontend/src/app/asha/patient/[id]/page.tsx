"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HeartPulse, FileText, Pill, Activity, ChevronRight, User } from "lucide-react";

export default function AshaPatientUnifiedView() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadPatientData() {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw new Error("Could not load patient profile (Check if they are linked).");
        setProfile(profileData);

        // 2. Fetch Timeline (Screenings & Reports)
        const { data: screenings } = await supabase.from('screenings').select('*').eq('patient_id', id);
        const { data: reports } = await supabase.from('reports').select('*').eq('patient_id', id);

        const combined = [
          ...(screenings || []).map(s => ({ ...s, type: 'screening', date: new Date(s.created_at).getTime() })),
          ...(reports || []).map(r => ({ ...r, type: 'report', date: new Date(r.created_at).getTime() }))
        ].sort((a, b) => b.date - a.date);
        
        setTimeline(combined);

        // 3. Fetch Active Medications
        const { data: medData } = await supabase
          .from('medications')
          .select('*, prescriptions(patient_id)')
          .eq('verified', true)
          .order('created_at', { ascending: false });

        if (medData) {
          setMeds(medData.filter((m: any) => m.prescriptions?.patient_id === id));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center text-[#176b4d] font-bold">Loading Patient Data...</div>;
  if (error) return <div className="min-h-screen bg-[#f8faf9] flex flex-col items-center justify-center p-6"><p className="text-[#a11d1d] font-bold text-center mb-4">{error}</p><Link href="/asha" className="bg-[#17211b] text-white px-6 py-2 rounded-xl">Go Back</Link></div>;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col pb-28">
      {/* Header */}
      <div className="bg-[#17211b] p-6 pb-8 rounded-b-[2.5rem] shadow-md relative">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/asha')} className="text-white">←</button>
          <h1 className="text-sm font-bold text-[#a6b6ac] tracking-wide uppercase">Patient Profile</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#176b4d] rounded-full flex items-center justify-center text-white border-4 border-[#243128]">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile?.full_name}</h2>
            <p className="text-[#a6b6ac] font-semibold">{profile?.sex}, {profile?.age} yrs • ID: {id.split('-')[0].toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="p-5 -mt-4 space-y-6">
        
        {/* Active Medications */}
        <div className="bg-white p-5 rounded-3xl border border-[#dfe7e2] shadow-sm">
          <h3 className="font-bold text-[#17211b] text-lg mb-4 flex items-center gap-2"><Pill className="text-[#176b4d]"/> Active Medications</h3>
          {meds.length === 0 ? (
            <p className="text-[#526158] text-sm font-semibold">No active verified medications.</p>
          ) : (
            <div className="space-y-3">
              {meds.map((med, i) => (
                <div key={i} className="bg-[#f8faf9] p-3 rounded-xl border border-[#dfe7e2]">
                  <h4 className="font-bold text-[#17211b] text-sm">{med.medicine_name}</h4>
                  <p className="text-xs text-[#526158] font-semibold mt-1">{med.strength} • {med.frequency}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Timeline */}
        <div className="bg-white p-5 rounded-3xl border border-[#dfe7e2] shadow-sm">
          <h3 className="font-bold text-[#17211b] text-lg mb-4 flex items-center gap-2"><Activity className="text-[#176b4d]"/> Health Timeline</h3>
          
          {timeline.length === 0 ? (
            <p className="text-[#526158] text-sm font-semibold text-center py-4">No records found for this patient.</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => {
                const isScreening = item.type === 'screening';
                const displayTitle = isScreening ? `${item.screening_type} Screening` : (item.extracted_data?.custom_title || item.extracted_data?.subtype || item.report_type?.replace('_', ' ') || 'Report');
                const isWarning = item.risk_level === 'elevated' || item.result_label?.includes('Elevated');

                return (
                  <div key={item.id} className="relative pl-6 border-l-2 border-[#dfe7e2] last:border-l-0 pb-4 last:pb-0">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1.5 border-2 border-white ${isScreening ? 'bg-[#2970ff]' : 'bg-[#176b4d]'}`}></div>
                    
                    <div className="bg-[#f8faf9] p-4 rounded-xl border border-[#dfe7e2] flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-lg">{isScreening ? (item.screening_type === 'anemia' ? '🩸' : '👁️') : '📄'}</span>
                           <h4 className="font-bold text-[#17211b] text-sm capitalize">{displayTitle}</h4>
                         </div>
                         <p className="text-xs text-[#526158] font-semibold mb-2">
                           {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                         </p>
                         {isScreening && (
                           <p className={`text-xs font-bold px-2 py-1 inline-block rounded-lg ${isWarning ? 'bg-[#fef2f2] text-[#a11d1d]' : 'bg-[#eef8f1] text-[#176b4d]'}`}>
                             {item.result_label}
                           </p>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
