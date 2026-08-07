"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import AppButton from "@/components/ui/AppButton";
import { Check, Camera, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function VerifyPrescription() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [prescription, setPrescription] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User's schedule preferences
  const [breakfast, setBreakfast] = useState("08:00");
  const [lunch, setLunch] = useState("14:00");
  const [dinner, setDinner] = useState("20:00");

  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchRecord() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', id)
          .eq('patient_id', user.id)
          .single();

        if (data) {
          setPrescription(data);
          
          let rawMeds = [];
          if (data.ocr_text) {
            try {
              const parsed = JSON.parse(data.ocr_text);
              rawMeds = parsed.medications || [];
            } catch(e) {}
          }
          
          // initialize state with verified=false
          setMeds(rawMeds.map((m: any) => ({ ...m, verified: false })));
        }
      } catch (err) {
        console.error("Failed to load prescription:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRecord();
  }, [id]);

  const verifyMed = (index: number) => {
    // In a real app, this would open the camera and OCR the physical pack.
    // For this hackathon demo, we just mark it as verified immediately to simulate success.
    setMeds(prev => prev.map((m, i) => i === index ? { ...m, verified: true } : m));
  };

  const formatAMPM = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  const generateSchedule = (frequency: string) => {
    const freq = frequency.toLowerCase();
    const times: string[] = [];
    
    if (freq.includes('od') || freq.includes('once')) {
      times.push(formatAMPM(breakfast));
    } else if (freq.includes('bd') || freq.includes('twice')) {
      times.push(formatAMPM(breakfast));
      times.push(formatAMPM(dinner));
    } else if (freq.includes('tds') || freq.includes('three')) {
      times.push(formatAMPM(breakfast));
      times.push(formatAMPM(lunch));
      times.push(formatAMPM(dinner));
    } else if (freq.includes('hs') || freq.includes('bed')) {
      // 10 PM default for bed
      times.push("10:00 PM");
    } else {
      times.push(formatAMPM(breakfast)); // fallback
    }
    return times;
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      // Create medications in DB
      const inserts = meds.map(m => ({
        prescription_id: id,
        medicine_name: m.name_raw || m.name,
        strength: m.strength || "",
        frequency: m.frequency || "",
        timing: m.food_relation || "",
        instructions: JSON.stringify(generateSchedule(m.frequency || "")),
        verified: m.verified
      }));

      if (inserts.length > 0) {
        await supabase.from('medications').insert(inserts);
      }

      router.push('/prescriptions');
    } catch (err) {
      console.error(err);
      alert("Failed to save schedule.");
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#526158]">Loading...</div>;

  const allVerified = meds.length > 0 && meds.every(m => m.verified);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col font-sans pb-28">
      <div className="bg-white p-5 border-b border-[#dfe7e2] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-xl font-bold text-[#526158]">←</button>
          <h1 className="font-bold text-[#17211b] text-lg">Verify Prescription</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="mt-2 rounded-2xl bg-white p-5 shadow-sm border border-[#dfe7e2] mb-6">
          <h2 className="text-xl font-bold text-[#17211b] mb-4 border-b border-[#dfe7e2] pb-4">
            Your Schedule
          </h2>
          <p className="text-sm text-[#526158] mb-5">When do you usually eat? We will use this to automatically schedule your doses safely.</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#17211b] text-sm">Breakfast</span>
              <input type="time" value={breakfast} onChange={e => setBreakfast(e.target.value)} className="bg-[#f8faf9] border border-[#dfe7e2] rounded-lg px-3 py-1 text-sm font-bold" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#17211b] text-sm">Lunch</span>
              <input type="time" value={lunch} onChange={e => setLunch(e.target.value)} className="bg-[#f8faf9] border border-[#dfe7e2] rounded-lg px-3 py-1 text-sm font-bold" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#17211b] text-sm">Dinner</span>
              <input type="time" value={dinner} onChange={e => setDinner(e.target.value)} className="bg-[#f8faf9] border border-[#dfe7e2] rounded-lg px-3 py-1 text-sm font-bold" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#17211b] mb-4 ml-1">Extracted Medicines</h2>
        
        {meds.length === 0 ? (
          <p className="text-[#526158] text-sm text-center py-8">No medications were found in this document.</p>
        ) : (
          <div className="space-y-4">
            {meds.map((med, idx) => (
              <div key={idx} className={`bg-white p-5 rounded-2xl border shadow-sm transition-colors ${med.verified ? 'border-[#176b4d] bg-[#f2fbf6]' : 'border-[#dfe7e2]'}`}>
                <div className="flex justify-between items-start mb-4 border-b border-[#dfe7e2] pb-4">
                  <div>
                    <h3 className="font-bold text-[#17211b] text-lg">{med.name_raw || med.name}</h3>
                    <p className="text-sm text-[#526158] mt-1 font-semibold">{med.dose} • {med.strength}</p>
                  </div>
                  {med.verified && (
                    <span className="text-[#176b4d] bg-[#eef8f1] p-2 rounded-full"><CheckCircle2 size={24} /></span>
                  )}
                </div>
                
                <div className="bg-[#f8faf9] p-3 rounded-lg mb-4 text-sm text-[#17211b]">
                  <p><strong>Dr Wrote:</strong> {med.frequency} • {med.food_relation}</p>
                  <p className="mt-1"><strong>Scheduled:</strong> {generateSchedule(med.frequency || "").join(', ')}</p>
                </div>

                {!med.verified ? (
                  <button 
                    onClick={() => verifyMed(idx)}
                    className="w-full flex items-center justify-center gap-2 bg-[#17211b] text-white py-3 rounded-xl font-bold text-sm"
                  >
                    <Camera size={18} /> SCAN PACK TO VERIFY
                  </button>
                ) : (
                  <p className="text-xs text-[#176b4d] font-bold text-center">✓ Verified with Medicine Pack</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <AppButton 
            variant={allVerified ? "primary" : "secondary"} 
            className="w-full justify-center"
            onClick={handleConfirm}
            disabled={saving || meds.length === 0}
          >
            {saving ? "SAVING..." : allVerified ? "CONFIRM SCHEDULE" : "SAVE UNVERIFIED SCHEDULE"}
          </AppButton>
          {!allVerified && (
            <p className="text-center text-xs text-[#a11d1d] font-bold mt-2 flex items-center justify-center gap-1">
              <AlertTriangle size={12} /> It is highly recommended to verify all medicines first.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
