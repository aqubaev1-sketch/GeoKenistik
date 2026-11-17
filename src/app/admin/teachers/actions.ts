"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

const allowedStatuses = new Set(["active", "rejected", "blocked"]);

export async function updateTeacherStatus(formData: FormData) {
  const teacherId = String(formData.get("teacherId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!teacherId || !allowedStatuses.has(status)) return;

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", teacherId)
    .eq("role", "teacher");

  if (error) throw new Error("Мұғалім мәртебесін өзгерту мүмкін болмады.");

  revalidatePath("/admin/teachers");
}
