"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";

export default function MyHealthRecords() {
  const { dictionary: t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch Screenings
      const { data: screeningsData } = await supabase
        .from('screenings')
        .select('*')
        .eq('patient_id', user.id);

      // Fetch Reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id);

      // Combine and Sort by Date (descending)
      const combined = [
        ...(screeningsData || []).map(s => ({ ...s, type: 'screening', date: new Date(s.created_at).getTime() })),
        ...(reportsData || []).map(r => ({ ...r, type: 'report', date: new Date(r.created_at).getTime() }))
      ].sort((a, b) => b.date - a.date);

      setTimeline(combined);
    } catch (err) {
      console.error("Failed to load records", err);
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
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      await loadData(); // Reload timeline
    } catch (err) {
      console.error(err);
      alert("Failed to process document. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] font-sans pb-28">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-6">
          <Link href="/patient" className="text-xl font-bold">← {(t as any).common?.back || "Back"}</Link>
        </div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
          📁 My Health Records
        </h1>
        <p className="text-emerald-100 mb-2">
          All your medical records in one place
        </p>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 relative z-10">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-white border-2 border-emerald-500 text-emerald-600 py-4 rounded-2xl font-bold text-lg shadow-sm hover:bg-emerald-50 flex items-center justify-center gap-2 transition-all"
          >
            {isUploading ? (
              <span className="animate-pulse">⏳ Processing Document...</span>
            ) : (
              <><span>+</span> ADD REPORT</>
            )}
          </button>
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
          />

          <Link href="/symptoms" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-sm hover:opacity-90 flex items-center justify-center gap-2 transition-all">
            ✨ SUMMARIZE FOR MY SYMPTOMS
          </Link>
        </div>

        {/* Timeline */}
        <div className="mt-8 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-50 pb-2">Recent Records</h2>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 animate-pulse">Loading records...</div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <span className="text-4xl mb-2 block">📄</span>
              No records yet. Tap 'Add Report' to start.
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.id} className="relative pl-6 border-l-2 border-emerald-100 last:border-l-0 pb-4 last:pb-0">
                  <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[9px] top-1 border-4 border-white"></div>
                  
                  {item.type === 'screening' ? (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {item.screening_type === 'anemia' ? '🩸' : item.screening_type === 'jaundice' ? '👁️' : '🩺'}
                        </span>
                        <h3 className="font-bold text-gray-800 capitalize">{item.screening_type} Screening</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className={`text-sm font-semibold ${item.risk_level === 'elevated' || item.result_label?.includes('Elevated') ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.result_label}
                      </p>
                    </div>
                  ) : (
                    <Link href={`/records/${item.id}`} className="block bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {item.report_type === 'LAB_REPORT' ? '🧪' : item.report_type === 'RADIOLOGY_REPORT' ? '🩻' : item.report_type === 'PRESCRIPTION' ? '💊' : '📄'}
                          </span>
                          <h3 className="font-bold text-gray-800">
                            {item.extracted_data?.subtype || item.report_type.replace('_', ' ')}
                          </h3>
                        </div>
                        <span className="text-emerald-600 font-bold">→</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.extracted_data?.report_date || new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {item.extracted_data?.hospital_or_lab && (
                        <p className="text-xs text-gray-400 mt-1">{item.extracted_data.hospital_or_lab}</p>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
