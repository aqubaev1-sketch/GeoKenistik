"use server";

import { requireRole } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function studentGroupsRedirect(message: string): never {
  redirect(`/student/groups?message=${encodeURIComponent(message)}`);
}

export async function joinGroup(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) studentGroupsRedirect("Алты таңбалы кодты енгізіңіз.");

  const { supabase } = await requireRole("student");
  const { error } = await supabase.rpc("join_group_by_code", { code });
  if (error) studentGroupsRedirect("Топ табылмады немесе қосылу мүмкін болмады.");

  revalidatePath("/student/groups");
  studentGroupsRedirect("Топқа сәтті қосылдыңыз.");
}
