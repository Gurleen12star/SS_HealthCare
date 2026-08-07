"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import AppButton from "@/components/ui/AppButton";
import { Send, Search, Image as ImageIcon, Edit2, Trash2, X } from "lucide-react";

export default function RecordDetail() {
  const params = useParams();
  const id = params.id as string;
  const { language } = useLanguage();
  const router = useRouter();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  const [messages, setMessages] = useState<{role: 'assistant' | 'user', content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRecord() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .eq('patient_id', user.id)
          .single();

        if (data) {
          setReport(data);
          
          if (data.file_path && data.file_path !== "failed_upload.jpg") {
            const { data: urlData } = supabase.storage
              .from('medical_documents')
              .getPublicUrl(data.file_path);
            setOriginalUrl(urlData.publicUrl);
          }

          const extracted = data.extracted_data || {};
          let initialMessage = "I have read your report. ";
          if (extracted.simple_explanation) {
            initialMessage += extracted.simple_explanation + "\n\n";
          }
          
          const outOfRange = (extracted.tests || []).filter((t: any) => t.is_out_of_range);
          if (outOfRange.length > 0) {
            initialMessage += "I noticed some abnormal values:\n";
            outOfRange.forEach((test: any) => {
              initialMessage += `• ${test.name}: ${test.value} ${test.unit} (Range: ${test.reference_range})\n`;
            });
          }

          initialMessage += "\nWhat else would you like to know about this report? You can ask me to summarize it further or extract specific tests/symptoms.";

          setMessages([{ role: 'assistant', content: initialMessage }]);
        }
      } catch (err) {
        console.error("Failed to load record:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRecord();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryType: 'chat' | 'extraction' = 'chat', overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/documents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentContext: report?.extracted_data || {},
          queryType,
          language
        })
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble analyzing the document for that question. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await supabase.from('reports').delete().eq('id', id);
      router.push('/reports');
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  const handleRename = async () => {
    if (!newTitle.trim() || !report) {
      setIsRenaming(false);
      return;
    }
    try {
      const updatedExtractedData = { ...report.extracted_data, custom_title: newTitle.trim() };
      await supabase.from('reports').update({ extracted_data: updatedExtractedData }).eq('id', id);
      setReport({ ...report, extracted_data: updatedExtractedData });
      setIsRenaming(false);
    } catch (err) {
      console.error(err);
      alert("Failed to rename record.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#526158]">Loading...</div>;
  if (!report) return <div className="min-h-screen flex items-center justify-center text-[#526158]">Record not found.</div>;

  const data = report.extracted_data || {};
  const displayTitle = data.custom_title || data.subtype || report.report_type.replace('_', ' ');

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col font-sans">
      <div className="bg-white p-5 border-b border-[#dfe7e2] shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 mr-2 overflow-hidden">
          <button onClick={() => router.back()} className="text-xl font-bold text-[#526158] hover:text-[#17211b] transition-colors shrink-0">
            ←
          </button>
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="font-bold text-[#17211b] text-lg bg-[#f8faf9] border border-[#dfe7e2] rounded px-2 w-full focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-[#17211b] text-lg leading-tight truncate">
                  {displayTitle}
                </h1>
                <button 
                  onClick={() => { setNewTitle(displayTitle); setIsRenaming(true); }} 
                  className="text-[#526158] hover:text-[#176b4d] shrink-0 p-1"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <p className="text-xs text-[#526158]">
              {data.report_date || new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleDelete} className="text-[#a11d1d] bg-[#fef2f2] p-2 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 size={20} />
          </button>
          {originalUrl && (
            <button 
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-[#176b4d] bg-[#eef8f1] p-2 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <ImageIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {showOriginal && originalUrl && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <span className="text-white font-bold">Original Document</span>
            <button onClick={() => setShowOriginal(false)} className="text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <img src={originalUrl} alt="Original Document" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-36">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
              ${msg.role === 'user' 
                ? 'bg-[#176b4d] text-white rounded-tr-sm' 
                : 'bg-white text-[#17211b] border border-[#dfe7e2] rounded-tl-sm'}
            `}>
              {msg.role === 'assistant' && idx === 0 && (
                <div className="text-xl mb-2">🤖</div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white text-[#526158] border border-[#dfe7e2] rounded-2xl rounded-tl-sm p-4 shadow-sm text-sm flex gap-1 animate-pulse">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-[#dfe7e2] p-4 pb-8 space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="text-xs text-[#526158] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <Search size={14} /> Extract Test or Symptom
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend('chat')}
            placeholder="e.g., Hemoglobin, fatigue..."
            className="flex-1 bg-[#f8faf9] border border-[#dfe7e2] rounded-xl px-4 text-sm focus:outline-none focus:border-[#176b4d]"
            disabled={isSending}
          />
          <button 
            onClick={() => handleSend('extraction')}
            disabled={!input.trim() || isSending}
            className="bg-[#176b4d] hover:bg-emerald-800 text-white p-3 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
