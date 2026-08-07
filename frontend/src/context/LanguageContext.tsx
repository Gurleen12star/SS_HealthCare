"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import en from "@/locales/en";
import hi from "@/locales/hi";
import pa from "@/locales/pa";
import bn from "@/locales/bn";
import te from "@/locales/te";
import mr from "@/locales/mr";
import ta from "@/locales/ta";
import ur from "@/locales/ur";
import gu from "@/locales/gu";
import kn from "@/locales/kn";
import ml from "@/locales/ml";
import or from "@/locales/or";

export type Language = "en" | "hi" | "pa" | "bn" | "te" | "mr" | "ta" | "ur" | "gu" | "kn" | "ml" | "or";

const dictionaries = {
  en, hi, pa, bn, te, mr, ta, ur, gu, kn, ml, or
};

// Simple deep merge for nested translation objects
function deepMerge(target: any, source: any) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: typeof en;
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("en");

  useEffect(() => {
    const stored =
      localStorage.getItem("swasthya-language") as Language | null;

    if (
      stored && Object.keys(dictionaries).includes(stored)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  function setLanguage(language: Language) {
    localStorage.setItem(
      "swasthya-language",
      language
    );

    setLanguageState(language);
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dictionary: deepMerge(en, dictionaries[language] || {}) as typeof en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
