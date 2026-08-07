"use client";

import { Volume2 } from "lucide-react";
import { useLanguage, type Language } from "@/context/LanguageContext";

type Props = {
  text: string;
};

export default function ListenButton({
  text,
}: Props) {
  const { language, dictionary: t } = useLanguage();

  function speak() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    const languageMap: Record<Language, string> = {
      en: "en-IN",
      hi: "hi-IN",
      pa: "pa-IN",
      bn: "bn-IN",
      te: "te-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      ur: "ur-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      or: "or-IN"
    };

    utterance.lang = languageMap[language];

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      onClick={speak}
      className="
        inline-flex min-h-12
        items-center gap-2
        rounded-2xl border
        border-[#dfe7e2]
        bg-white px-4
        font-semibold
      "
    >
      <Volume2 size={21} />

      {t.common.listen}
    </button>
  );
}
