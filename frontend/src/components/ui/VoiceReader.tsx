"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface VoiceReaderProps {
  text: string;
  autoPlay?: boolean;
}

export default function VoiceReader({ text, autoPlay = false }: VoiceReaderProps) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (autoPlay && supported && text) {
      // Small delay to ensure any previous speech is cancelled
      const timer = setTimeout(() => {
        play();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay, supported]);

  const play = () => {
    if (!supported || !text) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to map language to a BCP 47 language tag
    // For hackathon purposes, these are common defaults
    const langMap: Record<string, string> = {
      en: "en-US",
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
    
    utterance.lang = langMap[language] || "en-US";
    utterance.rate = 0.9; // Slightly slower for better comprehension

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      // Completely silence speech errors. Mobile browsers often block autoplay
      // and throw "interrupted" or "not-allowed" errors which crash the Next.js dev server overlay.
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={isPlaying ? stop : play}
      className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 ${
        isPlaying 
          ? "bg-emerald-100 text-emerald-700 shadow-inner animate-pulse scale-95" 
          : "bg-white text-emerald-600 shadow-sm hover:bg-emerald-50 active:scale-90 border border-emerald-100"
      }`}
      aria-label={isPlaying ? "Stop reading" : "Read text aloud"}
      title={isPlaying ? "Stop" : "Listen"}
    >
      {isPlaying ? (
        <span className="text-lg leading-none">⏹</span>
      ) : (
        <span className="text-lg leading-none">🔊</span>
      )}
    </button>
  );
}
