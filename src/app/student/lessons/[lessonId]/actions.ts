"use server";

import { requireRole } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitTask(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();
  if (!lessonId || !taskId || !answer) return;

  const { supabase } = await requireRole("student");
  const { error } = await supabase.rpc("submit_task_answer", { target_task_id: taskId, submitted_answer: answer });
  if (error) redirect(`/student/lessons/${lessonId}?message=${encodeURIComponent("Жауапты жіберу мүмкін болмады.")}`);
  revalidatePath(`/student/lessons/${lessonId}`);
  redirect(`/student/lessons/${lessonId}?message=${encodeURIComponent("Жауап қабылданды.")}`);
}
