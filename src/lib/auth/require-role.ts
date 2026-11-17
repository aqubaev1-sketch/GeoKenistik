import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireRole(role: "teacher" | "student") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active" || profile.role !== role) {
    redirect("/dashboard");
  }

  return { supabase, user };
}
