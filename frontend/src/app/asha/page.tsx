import AshaHome from "@/components/asha/AshaHome";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AshaPage() {
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

  if (profile.role !== "asha") {
    redirect("/patient");
  }

  return (
    <AshaHome
      name={profile.full_name.split(" ")[0]}
      workerId={user.id}
    />
  );
}
