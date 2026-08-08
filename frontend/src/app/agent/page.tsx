// @ts-nocheck
"use client";

import { useChat } from '@ai-sdk/react';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase/client';

export default function AgentPage() {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    api: '/api/agent',
    maxSteps: 5,
    onToolCall({ toolCall }) {
      if (toolCall.toolName === 'generate_health_summary_pdf') {
        const args = toolCall.args as { screening_id: string };
        generatePDF(args.screening_id);
      }
    },
  });
  
  const isLoading = status === 'streaming' || status === 'submitted';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ content: input, role: 'user' });
    setInput("");
  };
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generatePDF = async (screening_id: string) => {
    setDownloading(true);
    const supabase = createClient();
    const { data: screening } = await supabase.from('screenings').select('*').eq('id', screening_id).single();
    if (!screening) {
      setDownloading(false);
      return;
    }
    
    // fetch follow-up
    const { data: { user } } = await supabase.auth.getUser();
    let followUpStatus = 'Pending';
    let followUpNote = 'None';
    if (user) {
      const { data: followups } = await supabase.from('followups').select('*').eq('patient_id', user.id);
      if (followups) {
        const linked = followups.find((f: any) => {
          try { return JSON.parse(f.reason).screening_id === screening_id; } catch { return false; }
        });
        if (linked) {
          followUpStatus = linked.status;
          try { followUpNote = JSON.parse(linked.reason).note || 'None'; } catch {}
        }
      }
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(23, 107, 77);
    doc.text("SwasthyaScan Health Summary", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Record Date: ${new Date(screening.created_at).toLocaleDateString()}`, 20, 30);
    doc.text(`Screening Type: ${screening.screening_type.toUpperCase()}`, 20, 38);
    
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Detail']],
      body: [
        ['Result', screening.result_label || 'N/A'],
        ['Risk Level', (screening.risk_level || 'unknown').toUpperCase()],
        ['Value', screening.numeric_value ? `${screening.numeric_value} ${screening.unit || ''}` : 'N/A'],
        ['AI Guidance', screening.recommendation || 'No specific guidance stored.'],
        ['Follow-up Status', followUpStatus.toUpperCase()],
        ['Follow-up Note', followUpNote]
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
    setDownloading(false);
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col font-sans">
      <div className="bg-white p-5 border-b border-[#dfe7e2] shadow-sm sticky top-0 z-10">
        <Link href="/patient" className="text-[#176b4d] font-bold mb-2 block">← Dashboard</Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <div>
            <h1 className="text-xl font-black text-[#17211b]">Swasthya Health Agent</h1>
            <p className="text-xs text-[#526158]">Find and understand your health information.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-36">
        {messages.length === 0 && (
          <div className="text-center text-[#526158] mt-10">
            <p>I can help you find past screenings, search your reports, and generate health summaries for your doctor.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={() => setInput("Prepare a health summary for my doctor.")} className="bg-white border p-3 rounded-xl text-left text-sm hover:bg-gray-50 text-[#176b4d] font-semibold">
                "Prepare a health summary for my doctor."
              </button>
              <button onClick={() => setInput("What happened after my last anaemia screening?")} className="bg-white border p-3 rounded-xl text-left text-sm hover:bg-gray-50 text-[#176b4d] font-semibold">
                "What happened after my last anaemia screening?"
              </button>
              <button onClick={() => setInput("Find my anaemia records.")} className="bg-white border p-3 rounded-xl text-left text-sm hover:bg-gray-50 text-[#176b4d] font-semibold">
                "Find my anaemia records."
              </button>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            {m.role === 'assistant' && m.toolInvocations?.map((tool) => (
              <div key={tool.toolCallId} className="text-xs text-[#176b4d] font-bold bg-[#eef8f1] px-3 py-1 rounded-full mb-2 animate-pulse">
                {tool.toolName === 'search_health_records' && 'Searching your saved health records...'}
                {tool.toolName === 'get_screening_record' && 'Checking relevant screenings...'}
                {tool.toolName === 'get_follow_up' && 'Checking follow-up history...'}
                {tool.toolName === 'get_relevant_health_history' && 'Understanding your symptoms...'}
                {tool.toolName === 'create_patient_summary' && 'Preparing your health summary...'}
                {tool.toolName === 'generate_health_summary_pdf' && 'Generating PDF...'}
                {tool.toolName === 'get_medical_document' && 'Reading medical document...'}
                {tool.toolName === 'get_medications' && 'Checking stored medications...'}
              </div>
            ))}
            {m.content && (
              <div className={`
                max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                ${m.role === 'user' 
                  ? 'bg-[#176b4d] text-white rounded-tr-sm' 
                  : 'bg-white text-[#17211b] border border-[#dfe7e2] rounded-tl-sm'}
              `}>
                {(m as any).content}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-white text-[#526158] border border-[#dfe7e2] rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm flex gap-1 animate-pulse">
               <span>●</span><span>●</span><span>●</span>
             </div>
           </div>
        )}
        {downloading && (
           <div className="flex justify-start">
             <div className="text-xs text-[#176b4d] font-bold bg-[#eef8f1] px-3 py-1 rounded-full mb-2 animate-pulse">
               Downloading PDF...
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-[#dfe7e2] p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your health assistant..."
            disabled={isLoading}
            className="flex-1 bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#176b4d]"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#176b4d] hover:bg-emerald-800 text-white px-5 rounded-xl disabled:opacity-50 transition-colors font-bold"
          >
            SEND
          </button>
        </form>
      </div>
    </main>
  );
}
