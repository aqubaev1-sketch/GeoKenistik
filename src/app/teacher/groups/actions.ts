"use server";

import { requireRole } from "@/lib/auth/require-role";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function groupsRedirect(message: string): never {
  redirect(`/teacher/groups?message=${encodeURIComponent(message)}`);
}

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const academicYear = String(formData.get("academicYear") ?? "").trim();

  if (name.length < 2 || !/^20\d{2}–20\d{2}$/.test(academicYear)) {
    groupsRedirect("Топ атауы мен оқу жылын дұрыс енгізіңіз.");
  }

  const { supabase, user } = await requireRole("teacher");
  let errorMessage = "Топты құру мүмкін болмады.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inviteCode = randomBytes(3).toString("hex").toUpperCase();
    const { error } = await supabase.from("groups").insert({
      teacher_id: user.id,
      name,
      grade: 10,
      academic_year: academicYear,
      invite_code: inviteCode,
    });

    if (!error) {
      revalidatePath("/teacher/groups");
      groupsRedirect("Топ сәтті құрылды.");
    }

    errorMessage = error.message;
    if (error.code !== "23505") break;
  }

  groupsRedirect(errorMessage);
}
