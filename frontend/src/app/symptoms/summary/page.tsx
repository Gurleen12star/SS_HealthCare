"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function SymptomSummary() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  const { dictionary: t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem("symptom_summary_data");
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      router.push("/symptoms");
    }
  }, [router]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-[#526158]">Loading...</div>;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/symptoms" className="text-2xl text-[#526158]">←</Link>
      </div>

      <div className="text-center mt-6 mb-8">
        <span className="text-6xl">🩺</span>
        <h1 className="mt-6 text-2xl font-bold text-[#17211b]">
          Relevant History
        </h1>
        <p className="mt-2 text-sm text-[#526158]">
          {data.relevant_count} relevant records found
        </p>
      </div>

      <div className="mt-4">
        <div className="bg-[#eef8f1] p-5 rounded-2xl border border-[#dfe7e2] mb-8">
          <p className="text-[#176b4d] text-sm leading-relaxed">
            {data.summary_text}
          </p>
        </div>

        <div className="space-y-4">
          {data.relevant_records?.map((record: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-[#dfe7e2]">
              <h3 className="font-bold text-[#17211b] text-lg mb-3">{record.title}</h3>
              
              <div className="space-y-2 mb-4">
                {record.relevant_findings?.map((finding: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-[#176b4d] mt-1">•</span>
                    <p className="text-[#17211b] text-sm">{finding}</p>
                  </div>
                ))}
              </div>
              
              {record.explanation && (
                <div className="bg-[#f8faf9] p-3 rounded-xl mb-4 border border-[#dfe7e2]">
                  <p className="text-xs text-[#526158] italic">{record.explanation}</p>
                </div>
              )}
              
              <Link 
                href={`/records/${record.record_id}`}
                className="inline-block w-full text-center bg-white border border-[#dfe7e2] text-[#17211b] py-3 rounded-xl font-bold text-sm hover:bg-[#f8faf9] transition-colors"
              >
                VIEW ORIGINAL RECORD
              </Link>
            </div>
          ))}

          {data.relevant_records?.length === 0 && (
            <div className="text-center py-10 text-[#526158]">
              No highly relevant records found for these symptoms.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
