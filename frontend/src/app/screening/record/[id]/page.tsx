"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ScreeningDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [screening, setScreening] = useState<any>(null);
  const [followUp, setFollowUp] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: screeningData } = await supabase
        .from("screenings")
        .select("*")
        .eq("id", id)
        .single();

      if (screeningData) setScreening(screeningData);

      // Search followups where reason contains this ID
      const { data: followups } = await supabase
        .from("followups")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (followups) {
        const linked = followups.find((f: any) => {
          try {
            const parsed = JSON.parse(f.reason);
            return parsed.screening_id === id;
          } catch {
            return false;
          }
        });
        if (linked) {
          setFollowUp(linked);
          setStatus(linked.status);
          try {
            const parsed = JSON.parse(linked.reason);
            setNote(parsed.note || "");
          } catch {}
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const saveFollowUp = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = JSON.stringify({ screening_id: id, note });
    if (followUp) {
      await supabase.from("followups").update({ status, reason: payload }).eq("id", followUp.id);
    } else {
      const { data } = await supabase.from("followups").insert({
        patient_id: user.id,
        status,
        reason: payload,
        priority: "routine"
      }).select().single();
      if (data) setFollowUp(data);
    }
    setSaving(false);
    alert("Follow-up updated successfully!");
  };

  const downloadPDF = () => {
    if (!screening) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(23, 107, 77); // Brand color
    doc.text("SwasthyaScan Health Summary", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Record Date: ${new Date(screening.created_at).toLocaleDateString()}`, 20, 30);
    doc.text(`Screening Type: ${screening.screening_type.toUpperCase()}`, 20, 38);
    
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Detail']],
      body: [
        ['Symptoms', 'None recorded during this screening.'],
        ['Result', screening.result_label || 'N/A'],
        ['Risk Level', (screening.risk_level || 'unknown').toUpperCase()],
        ['Value', screening.numeric_value ? `${screening.numeric_value} ${screening.unit || ''}` : 'N/A'],
        ['AI Guidance', screening.recommendation || 'No specific guidance stored.'],
        ['Medicines / Reminders', 'Consult your dashboard for active prescriptions.'],
        ['Follow-up Status', status.toUpperCase()],
        ['Follow-up Note', note || 'None'],
        ['Next Steps', screening.recommendation || 'Follow clinical advice.']
      ],
      theme: 'grid',
      headStyles: { fillColor: [23, 107, 77] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Disclaimer: This AI-assisted screening is not a diagnosis. Please consult", 20, finalY);
    doc.text("an appropriate healthcare professional for clinical evaluation and confirmation.", 20, finalY + 6);

    doc.save(`Swasthya_Summary_${screening.screening_type}_${new Date().getTime()}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Loading record...</div>;
  if (!screening) return <div className="p-8 text-center">Record not found.</div>;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <Link href="/reports" className="text-[#176b4d] font-bold mb-6 block">← Back to Records</Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-[#dfe7e2] p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🩺</span>
          <h1 className="text-2xl font-black text-[#17211b] capitalize">{screening.screening_type} Screening</h1>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Date</span>
            <span className="font-bold">{new Date(screening.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Result</span>
            <span className={`font-bold ${screening.risk_level === 'elevated' || screening.risk_level === 'urgent' ? 'text-red-600' : 'text-green-600'}`}>
              {screening.result_label}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Risk Level</span>
            <span className="font-bold uppercase">{screening.risk_level}</span>
          </div>
          {screening.recommendation && (
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Stored AI Guidance</span>
              <p className="bg-gray-50 p-3 rounded text-gray-700 italic border">{screening.recommendation}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={downloadPDF}
          className="mt-6 w-full bg-[#17211b] text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black"
        >
          📄 Download Health Summary PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#dfe7e2] p-5">
        <h2 className="text-xl font-bold text-[#17211b] mb-4 flex items-center gap-2">
          {status === 'completed' ? '✅' : status === 'pending' ? '🟡' : status === 'reviewed' ? '🔵' : status === 'acted_upon' ? '🟢' : '🔴'} Follow-up Tracker
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="w-full border p-2 rounded focus:outline-none focus:border-[#176b4d]"
            >
              <option value="pending">🟡 Pending</option>
              <option value="reviewed">🔵 Reviewed</option>
              <option value="acted_upon">🟢 Acted Upon</option>
              <option value="escalated">🔴 Escalated</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Clinician / User Note</label>
            <textarea 
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Patient advised to obtain Hb test..."
              className="w-full border p-2 rounded focus:outline-none focus:border-[#176b4d] h-24"
            />
          </div>
          
          <button 
            onClick={saveFollowUp}
            disabled={saving}
            className="w-full bg-[#176b4d] text-white p-3 rounded-xl font-bold hover:bg-[#12583f] disabled:opacity-50"
          >
            {saving ? "Saving..." : "SAVE UPDATE"}
          </button>
        </div>
      </div>
    </main>
  );
}
