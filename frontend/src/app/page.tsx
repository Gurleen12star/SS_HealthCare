"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { HeartPulse, FileText, Pill, WalletCards, Activity, Crosshair, Camera, Sparkles, CheckSquare } from "lucide-react";

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

const bgImages = [
  "/images/bg-1.png",
  "/images/bg-2.png",
  "/images/bg-3.png",
  "/images/bg-4.png",
];

// Hooks removed for static visibility

export default function LandingPage() {
  const { language, setLanguage, dictionary: t } = useLanguage();
  const [bgIndex, setBgIndex] = useState(0);

  // Background rotator
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-black font-sans text-white">
      {/* Fixed Background Layer: Rotating Images */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {bgImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === bgIndex ? "opacity-40" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(3px) brightness(0.5)",
              transform: "scale(1.05)",
            }}
          />
        ))}

        {/* Decorative Overlay: Rings & Waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="absolute w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[spin_30s_linear_infinite] mix-blend-screen" />
          <div className="absolute w-[800px] h-[800px] border border-emerald-400/10 rounded-full animate-[spin_40s_linear_infinite_reverse] mix-blend-screen" />
          <Activity className="absolute top-32 left-10 text-emerald-400/30 animate-pulse" size={48} />
          <Crosshair className="absolute bottom-64 right-12 text-emerald-300/20 animate-[spin_10s_linear_infinite]" size={64} />
          <div className="absolute bottom-0 w-full h-48 opacity-30">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full animate-[wave_10s_linear_infinite]">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,130.85,121.22,201.5,114.22,243.68,110,283.47,94.27,321.39,56.44Z" fill="url(#wave-gradient)" />
              <defs>
                <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Header with language selector */}
      <header className="fixed top-0 w-full max-w-md p-4 z-50 flex justify-end items-center">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-black/40 backdrop-blur-md border border-emerald-500/30 text-white text-sm rounded-full block p-2 px-4 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-gray-800">
              {lang.native}
            </option>
          ))}
        </select>
      </header>

      {/* Screen 1: Hero */}
      <section className="relative min-h-screen flex flex-col z-10 pt-20 px-6 pb-12">
        {/* Glassmorphic Hero */}
        <div className="mt-4 mb-10 flex flex-col items-center text-center bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            <HeartPulse size={40} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-white mb-2 leading-tight">
            {(t as any).landing?.welcome || "Welcome to SS Health"}
          </h1>
          <p className="text-emerald-100/80 text-sm mt-2">
            {(t as any).landing?.subtitle || "AI-Powered Healthcare Access"}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="group bg-black/40 backdrop-blur-lg border border-white/10 p-5 rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1">
            <HeartPulse className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="font-bold text-white mb-1">{t.home.screening}</h3>
            <p className="text-xs text-gray-300">{t.home.screeningDescription}</p>
          </div>
          
          <div className="group bg-black/40 backdrop-blur-lg border border-white/10 p-5 rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1">
            <FileText className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="font-bold text-white mb-1">{t.home.report}</h3>
            <p className="text-xs text-gray-300">{t.home.reportDescription}</p>
          </div>
          
          <div className="group bg-black/40 backdrop-blur-lg border border-white/10 p-5 rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1">
            <Pill className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="font-bold text-white mb-1">{t.home.medicine}</h3>
            <p className="text-xs text-gray-300">{t.home.medicineDescription}</p>
          </div>
          
          <div className="group bg-black/40 backdrop-blur-lg border border-white/10 p-5 rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-400/50 transition-all duration-300 transform hover:-translate-y-1">
            <WalletCards className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={28} />
            <h3 className="font-bold text-white mb-1">{t.home.passport}</h3>
            <p className="text-xs text-gray-300">{t.home.passportDescription}</p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-auto flex justify-center pb-4">
          <div className="w-8 h-12 rounded-full border-2 border-emerald-500/50 flex justify-center p-1">
            <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-[bounce_1.5s_infinite]" />
          </div>
        </div>
      </section>

      {/* Screen 2: How it works (Steps Animation) */}
      <section className="relative min-h-screen flex flex-col z-10 px-6 py-16 bg-gradient-to-b from-transparent to-black/90">
        <h2 className="text-3xl font-extrabold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
          {(t as any).howItWorks?.title || "How It Works"}
        </h2>

        <div className="relative flex-1 flex flex-col gap-12 max-w-sm mx-auto">
          {/* Glowing Connection Line */}
          <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-500/80 via-teal-500/50 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

          {/* Step 1 */}
          <div className="relative flex items-start gap-6 transition-all duration-1000 transform">
            <div className="z-10 flex items-center justify-center w-20 h-20 rounded-full bg-black border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
              <CheckSquare className="text-emerald-400" size={32} />
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold text-white mb-2">{(t as any).howItWorks?.step1Title || "1. Choose Screening"}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {(t as any).howItWorks?.step1Desc || "Select the health issue you want to check (Anemia, Jaundice, etc)."}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-start gap-6 transition-all duration-1000 transform">
            <div className="z-10 flex items-center justify-center w-20 h-20 rounded-full bg-black border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
              <Camera className="text-emerald-400" size={32} />
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold text-white mb-2">{(t as any).howItWorks?.step2Title || "2. Let AI Analyze"}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {(t as any).howItWorks?.step2Desc || "Use your phone's camera to capture required images securely."}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-start gap-6 transition-all duration-1000 transform">
            <div className="z-10 flex items-center justify-center w-20 h-20 rounded-full bg-emerald-600 border border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)] shrink-0 animate-pulse">
              <Sparkles className="text-white" size={32} />
            </div>
            <div className="pt-3">
              <h3 className="text-xl font-bold text-white mb-2">{(t as any).howItWorks?.step3Title || "3. Get Instant Results"}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {(t as any).howItWorks?.step3Desc || "Receive instant, offline-first analysis in your native language."}
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 pb-8 text-center">
          <p className="text-emerald-200/90 italic mb-6 font-medium">
            "{(t as any).landing?.slogan || "Bringing Healthcare to Every Home"}"
          </p>
          <Link href="/login">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-5 rounded-full text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all transform hover:scale-[1.02] active:scale-95">
              {(t as any).landing?.getStarted || "Get Started"}
            </button>
          </Link>
        </div>
      </section>

      <style jsx global>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-5%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </main>
  );
}
