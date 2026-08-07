"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Search, User, ChevronRight, TriangleAlert } from "lucide-react";

type Props = {
  name?: string;
  workerId?: string;
};

export default function AshaHome({ name, workerId }: Props) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emergencyAlert, setEmergencyAlert] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadPatients() {
      if (!workerId) return;
      try {
        const { data, error } = await supabase
          .from('worker_patient_links')
          .select(`
            patient_id,
            profiles!worker_patient_links_patient_id_fkey (
              id,
              full_name,
              sex,
              age
            )
          `)
          .eq('worker_id', workerId)
          .eq('active', true);
          
        if (data) {
          const uniquePatients = Array.from(new Map(data.map(item => [item.patient_id, item])).values());
          setPatients(uniquePatients);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [workerId]);

  // Poll for emergency alerts every 3 seconds
  useEffect(() => {
    if (patients.length === 0) return;
    
    const checkEmergencies = async () => {
      try {
        const patientIds = patients.map(p => p.patient_id);
        const { data } = await supabase
          .from('emergency_alerts')
          .select('*')
          .eq('status', 'active')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (data && data.length > 0) {
          const patientName = patients.find(p => p.patient_id === data[0].patient_id)?.profiles?.full_name || "A patient";
          setEmergencyAlert({ ...data[0], patientName });
          
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 300]);
          }
        } else {
          setEmergencyAlert(null);
        }
      } catch (e) {
        console.error("Error polling emergencies", e);
      }
    };

    checkEmergencies(); // Initial check
    const intervalId = setInterval(checkEmergencies, 3000);
    return () => clearInterval(intervalId);
  }, [patients]);

  const resolveEmergency = async () => {
    if (!emergencyAlert) return;
    try {
      await supabase.from('emergency_alerts').update({ status: 'resolved' }).eq('id', emergencyAlert.id);
      setEmergencyAlert(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col pb-28">
      
      {/* Emergency Banner */}
      {emergencyAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-[#a11d1d] rounded-3xl p-5 shadow-2xl border-4 border-red-500 animate-pulse">
             <div className="flex items-start gap-4">
               <TriangleAlert size={32} className="text-white shrink-0 mt-1" />
               <div className="flex-1">
                 <h2 className="text-white font-black text-xl mb-1">SOS EMERGENCY</h2>
                 <p className="text-red-100 font-bold mb-4">{emergencyAlert.patientName} has triggered an SOS and needs immediate help.</p>
                 <div className="flex gap-2">
                   <Link href={`/asha/patient/${emergencyAlert.patient_id}`} className="flex-1 bg-white text-[#a11d1d] text-center font-bold py-2 rounded-xl text-sm">
                     View Medical Profile
                   </Link>
                   <button onClick={resolveEmergency} className="flex-1 bg-transparent border-2 border-white/30 text-white font-bold py-2 rounded-xl text-sm">
                     Mark Resolved
                   </button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="bg-[#17211b] p-6 pb-10 rounded-b-[2.5rem] shadow-md">
        <p className="text-sm text-[#a6b6ac] font-semibold tracking-wide uppercase">SwasthyaScan Asha</p>
        <h1 className="mt-1 text-3xl font-bold text-white mb-6">Namaste, {name || "Worker"}</h1>
        
        <Link href="/asha/scan" className="w-full bg-[#176b4d] hover:bg-emerald-700 text-white p-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-lg transition-transform active:scale-95">
          <Camera size={24} /> SCAN HEALTH AADHAAR
        </Link>
      </div>

      <div className="px-6 pt-6 -mt-4">
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#526158]">
            <Search size={20} />
          </span>
          <input 
            type="text" 
            placeholder="Search linked patients..." 
            className="w-full bg-white border border-[#dfe7e2] rounded-2xl p-4 pl-12 text-[#17211b] placeholder:text-[#a6b6ac] shadow-sm font-semibold"
          />
        </div>

        <h2 className="text-sm font-bold tracking-wider text-[#526158] uppercase mb-4">Linked Patients</h2>

        {loading ? (
          <div className="text-center py-8 text-[#526158] animate-pulse font-semibold">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-[#dfe7e2] text-center shadow-sm">
            <div className="w-16 h-16 bg-[#eef8f1] rounded-full flex items-center justify-center mx-auto mb-4 text-[#176b4d]">
              <User size={32} />
            </div>
            <h3 className="font-bold text-[#17211b] text-lg mb-2">No Patients Yet</h3>
            <p className="text-[#526158] text-sm">Tap the button above and scan a patient's Health Aadhaar to link them.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map((link: any, idx: number) => {
              const profile = link.profiles || {};
              return (
                <Link key={idx} href={`/asha/patient/${profile.id}`} className="block bg-white border border-[#dfe7e2] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg text-[#17211b]">{profile.full_name || "Unknown"}</h3>
                    <ChevronRight size={20} className="text-[#526158]" />
                  </div>
                  <p className="text-sm text-[#526158] font-semibold">{profile.sex}, {profile.age} yrs • ID: {profile.id?.split('-')[0].toUpperCase()}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
