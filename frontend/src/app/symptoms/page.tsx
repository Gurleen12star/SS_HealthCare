"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import AppButton from "@/components/ui/AppButton";

export default function SymptomsInput() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { dictionary: t } = useLanguage();

  const handleSummarize = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/symptoms/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");
      
      const data = await res.json();
      
      localStorage.setItem("symptom_summary_data", JSON.stringify(data));
      router.push("/symptoms/summary");

    } catch (err) {
      console.error(err);
      alert("Failed to summarize symptoms. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/reports" className="text-2xl text-[#526158]">←</Link>
      </div>

      <div className="mt-6 mb-8 text-center">
        <span className="text-6xl">✨</span>
        <h1 className="mt-6 text-3xl font-bold text-[#17211b]">
          What are you experiencing?
        </h1>
        <p className="mt-4 text-lg text-[#526158]">
          Describe your symptoms. We'll search your health records for relevant history to share with your doctor.
        </p>
      </div>

      <div className="flex flex-col flex-1">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. I'm feeling very tired, dizzy and weak."
          className="w-full h-40 p-5 rounded-2xl border border-[#dfe7e2] focus:border-[#176b4d] focus:outline-none focus:ring-1 focus:ring-[#176b4d] resize-none text-base shadow-sm text-[#17211b]"
          disabled={loading}
        />

        <div className="mt-8">
          <AppButton
            onClick={handleSummarize}
            disabled={!symptoms.trim() || loading}
          >
            {loading ? "SEARCHING RECORDS..." : "SUMMARIZE RECORDS"}
          </AppButton>
        </div>

        {loading && (
          <div className="mt-8 text-center text-[#526158] animate-pulse">
            Analyzing symptoms and retrieving relevant medical history...
          </div>
        )}
      </div>
    </main>
  );
}
