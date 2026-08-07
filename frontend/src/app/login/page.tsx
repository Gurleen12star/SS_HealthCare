"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { dictionary: t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    const {
      data,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError || !data.user) {
      setError(
        loginError?.message ??
          ((t as any).auth?.loginFailed || "Login failed.")
      );

      setLoading(false);
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError(
        (t as any).auth?.profileLoadFailed || "Your health profile could not be loaded."
      );

      setLoading(false);
      return;
    }

    if (profile.role === "asha") {
      router.push("/asha");
    } else {
      router.push("/patient");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Hackathon Demo Buttons */}
        <div className="bg-[#176b4d]/10 border border-[#176b4d]/30 p-4 rounded-2xl mb-8">
          <h2 className="text-sm font-bold text-[#176b4d] uppercase tracking-wider mb-3 text-center">Hackathon Demo Access</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setEmail('patient@example.com'); setPassword('password123'); }}
              className="bg-white border border-[#176b4d] text-[#176b4d] py-2 rounded-xl font-bold text-sm hover:bg-[#eef8f1]"
            >
              Patient Mode
            </button>
            <button
              type="button"
              onClick={() => { setEmail('asha@example.com'); setPassword('password123'); }}
              className="bg-[#176b4d] text-white py-2 rounded-xl font-bold text-sm hover:bg-emerald-700"
            >
              ASHA Mode
            </button>
          </div>
          <p className="text-xs text-center text-[#526158] mt-2">Tap a button above to auto-fill credentials.</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
        <h1 className="text-3xl font-bold">
          {(t as any).auth?.loginTitle || "Welcome back"}
        </h1>

        <input
          className="w-full border rounded-xl p-4 text-black bg-white"
          type="email"
          placeholder={(t as any).auth?.emailPlaceholder || "Email"}
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          className="w-full border rounded-xl p-4 text-black bg-white"
          type="password"
          placeholder={(t as any).auth?.passwordPlaceholder || "Password"}
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {error && (
          <p className="text-red-700">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-xl border p-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
          disabled={loading}
        >
          {loading
            ? ((t as any).auth?.signingIn || "Signing in...")
            : ((t as any).auth?.signIn || "Sign in")}
        </button>

        <div className="mt-6 text-center space-y-4">
          <p>
            <Link href="/signup" className="text-emerald-500 font-bold hover:underline">
              {(t as any).auth?.dontHaveAccount || "Don't have an account? Sign up"}
            </Link>
          </p>
          <p>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {(t as any).auth?.backToLanding || "← Back to Landing"}
            </Link>
          </p>
        </div>
      </form>
      </div>
    </main>
  );
}
