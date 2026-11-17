"use server";

import { requireRole } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";

export async function deleteLessonFile(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const fileId = String(formData.get("fileId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  if (!lessonId || !fileId || !storagePath) return;

  const { supabase } = await requireRole("teacher");
  const { error: storageError } = await supabase.storage.from("lesson-files").remove([storagePath]);
  if (storageError) throw new Error("Файлды өшіру мүмкін болмады.");
  await supabase.from("lesson_files").delete().eq("id", fileId).eq("lesson_id", lessonId);
  revalidatePath(`/teacher/lessons/${lessonId}/files`);
}
