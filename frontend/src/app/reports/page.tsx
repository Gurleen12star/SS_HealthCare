"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import AppButton from "@/components/ui/AppButton";
import { Edit2, Trash2 } from "lucide-react";

export default function ReportGuru() {
  const { dictionary: t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterDate, setFilterDate] = useState("");

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

      const { data: screeningsData } = await supabase
        .from('screenings')
        .select('*')
        .eq('patient_id', user.id);

      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id);

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
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to process document. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    try {
      if (item.type === 'screening') {
        await supabase.from('screenings').delete().eq('id', item.id);
      } else {
        await supabase.from('reports').delete().eq('id', item.id);
      }
      setTimeline(prev => prev.filter(r => r.id !== item.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  const handleRename = async (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent, item: any) => {
    if (e.type !== 'blur' && (e as React.KeyboardEvent).key !== 'Enter' && e.type !== 'click') return;
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const updatedExtractedData = { ...item.extracted_data, custom_title: editTitle.trim() };
      await supabase.from('reports').update({ extracted_data: updatedExtractedData }).eq('id', item.id);
      
      setTimeline(prev => prev.map(r => r.id === item.id ? { ...r, extracted_data: updatedExtractedData } : r));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to rename record.");
    }
  };

  const handleNavigate = (item: any) => {
    if (editingId) return; // don't navigate if currently editing
    if (item.type === 'report') {
      router.push(`/records/${item.id}`);
    } else if (item.type === 'screening') {
      router.push(`/screening/record/${item.id}`);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/patient" className="text-2xl text-[#526158]">←</Link>
      </div>

      <div className="text-center mt-6 mb-8">
        <span className="text-6xl">📄</span>
        <h1 className="mt-6 text-3xl font-bold text-[#17211b]">Report Guru</h1>
        <p className="mt-4 text-lg text-[#526158]">
          Keep all your health documents safely together and understand them easily.
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
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={cameraInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
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
            type="file" 
            accept="image/*,application/pdf" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </div>
        
        {isUploading && (
          <div className="text-center text-sm text-[#176b4d] font-bold animate-pulse bg-[#eef8f1] p-3 rounded-xl border border-[#dfe7e2]">
            ⏳ Processing Document...
          </div>
        )}

        <Link href="/symptoms" className="block w-full">
          <AppButton variant="primary" className="justify-center gap-3 flex items-center">
            ✨ SUMMARIZE FOR MY SYMPTOMS
          </AppButton>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm border border-[#dfe7e2]">
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search health records..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#176b4d] mb-3"
          />
          <div className="flex gap-2">
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="flex-1 bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-2 py-2 text-sm focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="report">Reports</option>
              <option value="screening">Screenings</option>
            </select>
            <select 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)}
              className="flex-1 bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-2 py-2 text-sm focus:outline-none"
            >
              <option value="">All Risks</option>
              <option value="low">Low Risk</option>
              <option value="elevated">Elevated Risk</option>
              <option value="urgent">Urgent</option>
            </select>
            <select 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)}
              className="flex-1 bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-2 py-2 text-sm focus:outline-none"
            >
              <option value="">All Dates</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <button 
              onClick={() => { setSearchQuery(""); setFilterType(""); setFilterRisk(""); setFilterDate(""); }}
              className="px-3 bg-gray-100 text-gray-600 rounded-xl text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#17211b] mb-4 border-b border-[#dfe7e2] pb-4">
          {searchQuery || filterType || filterRisk || filterDate ? "Search Results" : "Recent Records"}
        </h2>
        
        {loading ? (
          <div className="text-center py-8 text-[#526158]">Loading records...</div>
        ) : timeline.filter(item => {
            const matchesSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = !filterType || item.type === filterType;
            const matchesRisk = !filterRisk || (item.risk_level === filterRisk);
            
            let matchesDate = true;
            if (filterDate) {
              const itemDate = new Date(item.created_at);
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - parseInt(filterDate));
              matchesDate = itemDate >= cutoff;
            }
            
            return matchesSearch && matchesType && matchesRisk && matchesDate;
          }).length === 0 ? (
          <div className="text-center py-8 text-[#526158]">
            <span className="text-4xl mb-2 block">📄</span>
            {searchQuery || filterType || filterRisk || filterDate ? "No health records found matching your search." : "No records yet. Tap 'Add Report' to start."}
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.filter(item => {
              const matchesSearch = !searchQuery || JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
              const matchesType = !filterType || item.type === filterType;
              const matchesRisk = !filterRisk || (item.risk_level === filterRisk);
              
              let matchesDate = true;
              if (filterDate) {
                const itemDate = new Date(item.created_at);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - parseInt(filterDate));
                matchesDate = itemDate >= cutoff;
              }
              
              return matchesSearch && matchesType && matchesRisk && matchesDate;
            }).map((item) => {
              const displayTitle = item.type === 'report' 
                ? (item.extracted_data?.custom_title || item.extracted_data?.subtype || item.report_type.replace('_', ' ')) 
                : `${item.screening_type} Screening`;
              
              return (
                <div key={item.id} className="relative pl-6 border-l-2 border-[#dfe7e2] last:border-l-0 pb-4 last:pb-0">
                  <div className="absolute w-3 h-3 bg-[#176b4d] rounded-full -left-[7px] top-1.5 border border-white"></div>
                  
                  {item.type === 'screening' ? (
                    <div 
                      onClick={() => handleNavigate(item)}
                      className="bg-[#f8faf9] p-4 rounded-xl border border-[#dfe7e2] cursor-pointer hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {item.screening_type === 'anemia' ? '🩸' : item.screening_type === 'jaundice' ? '👁️' : '🩺'}
                          </span>
                          <h3 className="font-bold text-[#17211b] capitalize">{displayTitle}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.follow_up_status && (
                            <span className="text-[10px] uppercase font-bold bg-[#eef8f1] text-[#176b4d] px-2 py-1 rounded-full">
                              {item.follow_up_status}
                            </span>
                          )}
                          <button onClick={(e) => handleDelete(e, item)} className="text-[#a11d1d] hover:text-red-700 p-1 shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#526158] mb-1">
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className={`text-sm font-semibold ${item.risk_level === 'elevated' || item.result_label?.includes('Elevated') ? 'text-[#a11d1d]' : 'text-[#176b4d]'}`}>
                          {item.result_label}
                        </p>
                        <span className="text-[#176b4d] font-bold">→</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleNavigate(item)}
                      className={`block bg-[#f8faf9] p-4 rounded-xl border border-[#dfe7e2] ${editingId !== item.id ? 'cursor-pointer hover:bg-white' : ''} transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <span className="text-xl shrink-0">
                            {item.report_type === 'LAB_REPORT' ? '🧪' : item.report_type === 'RADIOLOGY_REPORT' ? '🩻' : item.report_type === 'PRESCRIPTION' ? '💊' : '📄'}
                          </span>
                          {editingId === item.id ? (
                            <input 
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={(e) => handleRename(e, item)}
                              onKeyDown={(e) => handleRename(e, item)}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-[#17211b] bg-white border border-[#176b4d] rounded px-2 w-full focus:outline-none"
                            />
                          ) : (
                            <h3 className="font-bold text-[#17211b] truncate">{displayTitle}</h3>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {editingId !== item.id && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTitle(displayTitle);
                                setEditingId(item.id);
                              }}
                              className="text-[#526158] hover:text-[#176b4d] p-1"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <button onClick={(e) => handleDelete(e, item)} className="text-[#a11d1d] hover:text-red-700 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[#526158]">
                            {item.extracted_data?.report_date || new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          {item.extracted_data?.hospital_or_lab && (
                            <p className="text-xs text-[#526158] mt-1">{item.extracted_data.hospital_or_lab}</p>
                          )}
                        </div>
                        {editingId !== item.id && <span className="text-[#176b4d] font-bold">→</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
