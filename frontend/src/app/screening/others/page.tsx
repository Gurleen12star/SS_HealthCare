"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import VoiceReader from "@/components/ui/VoiceReader";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OthersScreening() {
  const router = useRouter();
  const { dictionary: t, language } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: (t as any).aiDoctor?.greeting || "Namaste! I am your AI Health Assistant. Please describe your symptoms. You can type or use the microphone to speak in your regional language." }
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert((t as any).ui?.noSpeechSupport || "Your browser does not support speech recognition. Please type your symptoms.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Attempt to map language to a BCP 47 language tag for recognition
    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      bn: "bn-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      ur: "ur-IN",
    };
    recognition.lang = langMap[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          language: language // Pass language to the API if we want to enforce response language
        })
      });

      if (!res.ok) throw new Error("Failed to get response");
      
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "assistant", content: (t as any).aiDoctor?.error || "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/screening" className="text-2xl text-emerald-700 font-bold">←</Link>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🤖</span> {t.screenings?.others || "AI Doctor"}
          </h1>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 pb-32">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm relative group ${
                msg.role === "user" 
                  ? "bg-emerald-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && (
                <div className="mt-2 -ml-2 -mb-2 opacity-50 hover:opacity-100 transition-opacity">
                  <VoiceReader 
                    text={msg.content} 
                    autoPlay={idx === messages.length - 1} // Only autoplay the latest response
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white border border-gray-100 rounded-tl-sm shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4 fixed bottom-0 w-full max-w-md">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-full flex-shrink-0 transition-colors ${
              isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            }`}
          >
            {isRecording ? "⏹" : "🎤"}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={(t as any).aiDoctor?.placeholder || "Type or speak symptoms..."}
            className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-emerald-600 text-white rounded-full flex-shrink-0 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
          >
            ➤
          </button>
        </form>
      </div>
    </main>
  );
}
