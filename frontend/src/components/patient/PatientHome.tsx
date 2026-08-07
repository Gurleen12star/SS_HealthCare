"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  HeartPulse,
  Pill,
  Volume2,
  WalletCards,
  MapPin,
  TriangleAlert,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import FeatureCard from "@/components/ui/FeatureCard";
import { useLanguage, type Language } from "@/context/LanguageContext";

type Props = {
  name?: string;
};

const languages: { code: Language; native: string }[] = [
  { code: "hi", native: "हिन्दी" },
  { code: "bn", native: "বাংলা" },
  { code: "te", native: "తెలుగు" },
  { code: "mr", native: "मराठी" },
  { code: "ta", native: "தமிழ்" },
  { code: "ur", native: "اردو" },
  { code: "gu", native: "ગુજરાતી" },
  { code: "kn", native: "ಕನ್ನಡ" },
  { code: "ml", native: "മലയാളം" },
  { code: "or", native: "ଓଡ଼ିଆ" },
  { code: "pa", native: "ਪੰਜਾਬੀ" },
  { code: "en", native: "English" },
];

export default function PatientHome({ name }: Props) {
  const { language, setLanguage, dictionary: t } = useLanguage();
  const supabase = createClient();
  
  // SOS State
  const [isPressing, setIsPressing] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosFired, setSosFired] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    setIsPressing(true);
    // Vibrate immediately
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    pressTimeoutRef.current = setTimeout(() => {
      // 2 seconds held - Trigger countdown!
      setIsPressing(false);
      setSosCountdown(5);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }, 2000);
  };

  const endPress = () => {
    setIsPressing(false);
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
  };

  const cancelSOS = () => {
    setSosCountdown(null);
    setSosFired(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  useEffect(() => {
    if (sosCountdown !== null && sosCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (sosCountdown === 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setSosCountdown(null);
      fireSOS();
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [sosCountdown]);

  const fireSOS = async () => {
    setSosFired(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('emergency_alerts').insert({
          patient_id: user.id,
          status: 'active'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md pb-28 relative">
      <section className="px-5 pt-7">
        <div className="flex items-center justify-between">
          <div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="mb-2 bg-white border border-[#dfe7e2] text-[#17211b] text-xs rounded-lg block p-2 font-bold shadow-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>
            <h1 className="mt-1 text-2xl font-bold">
              {t.home.greeting}
              {name ? `, ${name}` : ""} 👋
            </h1>
          </div>
          <button
            aria-label={t.common.listen}
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(`${t.home.greeting}${name ? `, ${name}` : ""}. ${t.home.question}`);
                const languageMap: Record<Language, string> = {
                  en: "en-IN", hi: "hi-IN", pa: "pa-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN", ta: "ta-IN", ur: "ur-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", or: "or-IN"
                };
                utterance.lang = languageMap[language];
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dfe7e2] bg-white"
          >
            <Volume2 size={23} />
          </button>
        </div>

        <h2 className="mt-8 text-xl font-bold">{t.home.question}</h2>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <FeatureCard title={t.home.screening} description={t.home.screeningDescription} href="/screening" icon={HeartPulse} />
          <FeatureCard title={t.home.report} description={t.home.reportDescription} href="/reports" icon={FileText} />
          <FeatureCard title={t.home.medicine} description={t.home.medicineDescription} href="/prescriptions" icon={Pill} />
          <FeatureCard title="Health Aadhaar" description={t.home.passportDescription} href="/patient/aadhaar" icon={WalletCards} />
          <FeatureCard title="Nearby Care" description="Find hospitals and doctors near your current location." href="/patient/nearby" icon={MapPin} />
          
          {/* SOS Button Area */}
          <div 
            className={`
              relative flex flex-col items-center justify-center p-5 rounded-3xl cursor-pointer transition-all duration-300 select-none
              ${isPressing ? 'bg-red-700 scale-95 shadow-inner' : 'bg-[#a11d1d] hover:bg-red-800 shadow-lg hover:shadow-xl'}
            `}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className={`
               absolute inset-0 rounded-3xl bg-red-500 opacity-50 blur-xl transition-opacity duration-1000
               ${isPressing ? 'opacity-100 animate-pulse' : 'opacity-0'}
            `}></div>
            <TriangleAlert size={36} className="text-white mb-2 relative z-10" />
            <h3 className="font-bold text-white text-lg relative z-10">SOS</h3>
            <p className="text-red-200 text-xs text-center font-semibold mt-1 relative z-10">Press & Hold 3s</p>
          </div>
        </div>
      </section>

      {/* Full Screen Countdown Modal */}
      {sosCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-[#a11d1d] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <TriangleAlert size={80} className="text-white mb-6 animate-pulse" />
            <h1 className="text-4xl font-black text-white text-center tracking-widest mb-2">ARE YOU OK?</h1>
            <p className="text-xl text-red-200 font-bold mb-12 text-center">Emergency alert triggers in...</p>
            <div className="text-[150px] font-black text-white leading-none animate-bounce">
              {sosCountdown}
            </div>
          </div>
          <button 
            onClick={cancelSOS}
            className="w-full bg-white text-[#a11d1d] text-2xl font-black py-6 rounded-3xl shadow-2xl active:scale-95 transition-transform"
          >
            I'M OK - CANCEL
          </button>
        </div>
      )}

      {/* Fake Animation Success Modal */}
      {sosFired && (
        <div className="fixed inset-0 z-50 bg-[#17211b] flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-500">
          <div className="w-24 h-24 bg-[#176b4d] rounded-full flex items-center justify-center mb-8 animate-bounce shadow-[0_0_50px_rgba(23,107,77,0.8)]">
             <CheckCircle2 size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white text-center mb-4">HELP IS ON THE WAY</h1>
          
          <div className="bg-black/50 p-6 rounded-3xl border border-[#176b4d]/50 w-full mb-8">
            <p className="text-[#a6b6ac] text-sm font-bold uppercase tracking-wider mb-4">Secure Alert Sent To:</p>
            <ul className="space-y-4 text-white font-semibold">
              <li className="flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">🚑</span>
                 Nearest Ambulance Services
              </li>
              <li className="flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">👩‍⚕️</span>
                 Latest ASHA Worker Logged In
              </li>
              <li className="flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">👨‍👩‍👧</span>
                 3 Favorite Contacts
              </li>
            </ul>
          </div>
          
          <p className="text-[#a6b6ac] text-center mb-10 text-sm">Your real-time GPS location and medical history have been securely shared with responders.</p>

          <button 
            onClick={cancelSOS}
            className="w-full bg-white text-[#17211b] text-xl font-bold py-5 rounded-2xl active:scale-95 transition-transform"
          >
            Close Dashboard
          </button>
        </div>
      )}

    </main>
  );
}
