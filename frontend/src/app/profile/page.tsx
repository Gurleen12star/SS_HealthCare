"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import { useLanguage } from "@/context/LanguageContext";

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<{full_name: string, village: string | null} | null>(null);

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, village").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    }
    getProfile();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const langNames = {
    en: "English", hi: "हिन्दी", pa: "ਪੰਜਾਬੀ",
    bn: "বাংলা", te: "తెలుగు", mr: "मराठी",
    ta: "தமிழ்", ur: "اردو", gu: "ગુજરાતી",
    kn: "ಕನ್ನಡ", ml: "മലയാളം", or: "ଓଡ଼ିଆ"
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-[#f8faf9] p-6 pb-28">
      <h1 className="text-2xl font-bold uppercase tracking-wider text-[#526158] mb-8">My Profile</h1>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl">👤</span>
          <div>
            <p className="text-sm text-[#526158]">Name</p>
            <p className="font-bold">{profile?.full_name || "Loading..."}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl">🌐</span>
          <div>
            <p className="text-sm text-[#526158]">Language</p>
            <p className="font-bold">{langNames[language]}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-sm text-[#526158]">Village</p>
            <p className="font-bold">{profile?.village || "Not specified"}</p>
          </div>
        </div>
      </div>

      <hr className="my-8 border-[#dfe7e2]" />

      <h2 className="font-bold mb-4">Health Data Sharing</h2>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">👩‍⚕️</span>
          <p className="font-bold">Community Health Worker</p>
        </div>
        <span className="text-[#526158]">Manage access {">"}</span>
      </div>

      <hr className="my-8 border-[#dfe7e2]" />

      <div className="space-y-4">
        <Link href="/" className="flex items-center justify-between p-4 bg-white border border-[#dfe7e2] rounded-2xl">
          <span className="font-bold">Change Language</span>
          <span className="text-[#526158]">{">"}</span>
        </Link>
        
        <AppButton variant="secondary" onClick={handleLogout}>
          Sign Out
        </AppButton>
      </div>
    </main>
  );
}
