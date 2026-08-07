"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export default function SignupPage() {
  const router = useRouter();
  const { dictionary: t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    const {
      data,
      error: signupError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          age: age ? parseInt(age, 10) : null,
          sex: sex || null,
          blood_group: bloodGroup || null,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        (t as any).auth?.signupFailed || "Account creation could not be completed."
      );
      setLoading(false);
      return;
    }

    // Wait a moment for the database trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    setLoading(false);

    // After signup, attempt to login if session isn't immediately available (in case email confirmation is required)
    if (!data.session) {
      setError((t as any).auth?.checkEmail || "Please check your email to confirm your account before logging in.");
      return;
    }

    router.push("/patient");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-3xl font-bold">
          {(t as any).auth?.signupTitle || "Create your profile"}
        </h1>

        <input
          className="w-full border rounded-xl p-4 text-black bg-white"
          placeholder={(t as any).auth?.namePlaceholder || "Your name"}
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />

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
          minLength={8}
        />

        <div className="flex gap-4">
          <input
            className="w-1/2 border rounded-xl p-4 text-black bg-white"
            type="number"
            placeholder={(t as any).auth?.agePlaceholder || "Age (Optional)"}
            value={age}
            onChange={(e) =>
              setAge(e.target.value)
            }
            min={0}
            max={120}
          />

          <select
            className="w-1/2 border rounded-xl p-4 bg-white text-black"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
          >
            <option value="">{(t as any).auth?.sexPlaceholder || "Sex (Optional)"}</option>
            <option value="Male">{(t as any).auth?.male || "Male"}</option>
            <option value="Female">{(t as any).auth?.female || "Female"}</option>
            <option value="Other">{(t as any).auth?.other || "Other"}</option>
          </select>
        </div>

        <select
          className="w-full border rounded-xl p-4 bg-white text-black"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
        >
          <option value="">{(t as any).auth?.bloodGroupPlaceholder || "Blood Group (Optional)"}</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

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
            ? ((t as any).auth?.creating || "Creating...")
            : ((t as any).auth?.createAccount || "Create account")}
        </button>

        <div className="mt-6 text-center space-y-4">
          <p>
            <Link href="/login" className="text-emerald-500 font-bold hover:underline">
              {(t as any).auth?.alreadyHaveAccount || "Already have an account? Sign in"}
            </Link>
          </p>
          <p>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              {(t as any).auth?.backToLanding || "← Back to Landing"}
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
