"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import AppButton from "@/components/ui/AppButton";
import { Pill, Volume2, Camera, Upload, FileText, CheckCircle2 } from "lucide-react";

export default function MedicinesDashboard() {
  const { dictionary: t, language } = useLanguage();
  const router = useRouter();
  
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [adherenceLogs, setAdherenceLogs] = useState<any[]>([]);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: presData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (presData) setPrescriptions(presData);

      const { data: medData } = await supabase
        .from('medications')
        .select('*, prescriptions(patient_id)')
        .eq('verified', true)
        .order('created_at', { ascending: false });

      // Only show meds for this patient (handled by RLS mostly, but filtering just in case)
      if (medData) {
        setMedications(medData.filter((m: any) => m.prescriptions?.patient_id === user.id));
      }

      // Fetch today's adherence
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('medication_adherence')
        .select('*')
        .eq('patient_id', user.id)
        .gte('created_at', today + 'T00:00:00Z');
      
      if (logs) setAdherenceLogs(logs);

    } catch (err) {
      console.error("Failed to load medicines", err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/prescriptions/extract", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      
      const prescription = await res.json();
      router.push(`/prescriptions/${prescription.id}/verify`);
      
    } catch (err) {
      console.error(err);
      alert("Failed to process prescription. Please try again.");
      setIsUploading(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const languageMap: Record<string, string> = {
        en: "en-IN", hi: "hi-IN", pa: "pa-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN", ta: "ta-IN", ur: "ur-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", or: "or-IN"
      };
      utterance.lang = languageMap[language] || "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTake = async (medId: string, time: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const newLog = {
        patient_id: user.id,
        medication_id: medId,
        scheduled_time: time,
        status: 'taken'
      };
      
      const { data } = await supabase.from('medication_adherence').insert(newLog).select().single();
      if (data) {
        setAdherenceLogs(prev => [...prev, data]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group medications by time for the daily view
  const scheduledDoses: {time: string, meds: any[]}[] = [];
  const times = ['8:00 AM', '2:00 PM', '8:00 PM']; // Simplified for MVP display

  medications.forEach(med => {
    try {
      const schedule = med.instructions ? JSON.parse(med.instructions) : [];
      schedule.forEach((time: string) => {
        let group = scheduledDoses.find(g => g.time === time);
        if (!group) {
          group = { time, meds: [] };
          scheduledDoses.push(group);
        }
        group.meds.push(med);
      });
    } catch(e) {}
  });

  scheduledDoses.sort((a, b) => {
    // Simple sort for MVP (assumes format like 8:00 AM)
    const getHour = (t: string) => parseInt(t) + (t.includes('PM') && !t.startsWith('12') ? 12 : 0);
    return getHour(a.time) - getHour(b.time);
  });

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/patient" className="text-2xl text-[#526158]">←</Link>
      </div>

      <div className="text-center mt-6 mb-8">
        <span className="text-6xl">💊</span>
        <h1 className="mt-6 text-3xl font-bold text-[#17211b]">My Medicines</h1>
        <p className="mt-4 text-lg text-[#526158]">
          Upload your prescriptions and we will automatically manage your daily schedule.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AppButton 
            variant="secondary" 
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="justify-center gap-2 flex items-center border-[#176b4d] text-[#176b4d] text-sm px-2"
          >
            📷 CLICK PHOTO
          </AppButton>
          <input 
            type="file" accept="image/*" capture="environment"
            ref={cameraInputRef} className="hidden" onChange={handleFileUpload} 
          />

          <AppButton 
            variant="secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="justify-center gap-2 flex items-center border-[#176b4d] text-[#176b4d] text-sm px-2"
          >
            📄 UPLOAD FILE
          </AppButton>
          <input 
            type="file" accept="image/*,application/pdf"
            ref={fileInputRef} className="hidden" onChange={handleFileUpload} 
          />
        </div>
        
        {isUploading && (
          <div className="text-center text-sm text-[#176b4d] font-bold animate-pulse bg-[#eef8f1] p-3 rounded-xl border border-[#dfe7e2]">
            ⏳ Processing Prescription...
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm border border-[#dfe7e2]">
        <h2 className="text-xl font-bold text-[#17211b] mb-4 border-b border-[#dfe7e2] pb-4">Today's Medicines</h2>
          
          {loading ? (
             <div className="text-center py-8 text-[#526158]">Loading...</div>
          ) : scheduledDoses.length === 0 ? (
            <div className="text-center py-8 text-[#526158]">
              <div className="flex justify-center mb-3 text-[#176b4d] opacity-50"><Pill size={40} /></div>
              <p className="font-medium">No verified medicines scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {scheduledDoses.map((group, i) => (
                <div key={i} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-[3px] top-1.5 w-3 h-3 bg-[#176b4d] rounded-full ring-4 ring-[#eef8f1]"></div>
                  {/* Timeline line */}
                  {i !== scheduledDoses.length - 1 && (
                    <div className="absolute left-[8px] top-4 w-0.5 h-full bg-[#dfe7e2]"></div>
                  )}
                  
                  <h3 className="font-bold text-[#17211b] text-lg mb-3 leading-none">{group.time}</h3>
                  
                  <div className="space-y-3">
                    {group.meds.map((med, j) => (
                      <div key={j} className="bg-[#f8faf9] border border-[#dfe7e2] p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-3 rounded-lg text-[#176b4d] shadow-sm border border-[#dfe7e2]">
                            <Pill size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#17211b]">{med.medicine_name}</h4>
                            <p className="text-xs text-[#526158] mt-0.5">{med.strength} • {med.frequency}</p>
                            {med.timing && <p className="text-xs font-semibold text-[#176b4d] mt-1">{med.timing}</p>}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 items-end">
                          <button 
                            onClick={() => speak(`Take ${med.medicine_name}, ${med.strength}. ${med.frequency}, ${med.timing}.`)}
                            className="text-[#176b4d] p-2 bg-[#eef8f1] rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            <Volume2 size={16} />
                          </button>
                          
                          {adherenceLogs.some(log => log.medication_id === med.id && log.scheduled_time === group.time) ? (
                            <div className="text-xs font-bold text-[#176b4d] flex items-center gap-1">
                              <CheckCircle2 size={16} /> TAKEN
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleTake(med.id, group.time)}
                              className="text-xs font-bold text-[#176b4d] border border-[#176b4d] bg-white px-3 py-1.5 rounded-full hover:bg-[#eef8f1] transition-colors"
                            >
                              TAKE
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm border border-[#dfe7e2]">
          <h2 className="text-xl font-bold text-[#17211b] mb-4 border-b border-[#dfe7e2] pb-4">Saved Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <p className="text-center py-8 text-[#526158]">No saved prescriptions.</p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((pres) => (
                <Link key={pres.id} href={`/prescriptions/${pres.id}/verify`} className="block bg-[#f8faf9] border border-[#dfe7e2] p-4 rounded-xl flex items-center justify-between hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-[#176b4d]">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#17211b]">Prescription</h4>
                      <p className="text-xs text-[#526158]">{new Date(pres.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-[#176b4d] font-bold">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
    </main>
  );
}
