import PatientHome from "@/components/patient/PatientHome";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PatientPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "patient") {
    redirect("/asha");
  }

  return (
    <PatientHome
      name={profile.full_name.split(" ")[0]}
    />
  );
}
