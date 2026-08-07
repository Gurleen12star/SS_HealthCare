"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ScreeningMenu() {
  const { dictionary: t } = useLanguage();

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patient" className="text-2xl">←</Link>
          <h1 className="text-2xl font-bold">{t.features.screeningTitle}</h1>
        </div>
      </div>
      
      <p className="mb-6 text-[#526158]">{t.actions.whatToCheck}</p>
      
      <div className="space-y-4">
        <Link href="/screening/anemia" className="flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-white p-5 active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🩸</span>
            <div>
              <p className="font-bold text-lg">{t.screenings.anaemia}</p>
              <p className="text-sm text-[#526158]">{t.screenings.anaemiaDesc}</p>
            </div>
          </div>
          <span className="text-xl text-[#526158]">→</span>
        </Link>

        <Link href="/screening/jaundice" className="flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-white p-5 active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">👁</span>
            <div>
              <p className="font-bold text-lg">{t.screenings.jaundice}</p>
              <p className="text-sm text-[#526158]">{t.screenings.jaundiceDesc}</p>
            </div>
          </div>
          <span className="text-xl text-[#526158]">→</span>
        </Link>

        <Link href="/screening/heart-rate" className="flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-white p-5 active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">❤️</span>
            <div>
              <p className="font-bold text-lg">{t.screenings.heartRate}</p>
              <p className="text-sm text-[#526158]">{t.screenings.heartRateDesc}</p>
            </div>
          </div>
          <span className="text-xl text-[#526158]">→</span>
        </Link>

        <Link href="/screening/others" className="flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-white p-5 active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🤖</span>
            <div>
              <p className="font-bold text-lg">{t.screenings.others}</p>
              <p className="text-sm text-[#526158]">{t.screenings.othersDesc}</p>
            </div>
          </div>
          <span className="text-xl text-[#526158]">→</span>
        </Link>
      </div>
    </main>
  );
}
