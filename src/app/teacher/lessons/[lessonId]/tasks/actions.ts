"use server";

import { requireRole } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function pageRedirect(lessonId: string, message: string): never {
  redirect(`/teacher/lessons/${lessonId}/tasks?message=${encodeURIComponent(message)}`);
}

export async function createTask(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const rawOptions = String(formData.get("options") ?? "");
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const points = Number(formData.get("points") ?? 1);
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!lessonId || title.length < 2 || prompt.length < 2 || !["single_choice", "short_text", "long_text"].includes(type) || !Number.isFinite(points) || points <= 0) return;

  const options = type === "single_choice" ? rawOptions.split("\n").map((item) => item.trim()).filter(Boolean) : [];
  if (type === "single_choice" && (options.length < 2 || !options.includes(correctAnswer))) pageRedirect(lessonId, "Нұсқаларды әр жолға жазыңыз және дұрыс жауапты дәл көрсетіңіз.");
  if (type !== "long_text" && !correctAnswer) pageRedirect(lessonId, "Автоматты тексеру үшін дұрыс жауап қажет.");

  const { supabase } = await requireRole("teacher");
  const { data: task, error } = await supabase.from("tasks").insert({ lesson_id: lessonId, title, prompt, type, options, points, check_mode: type === "long_text" ? "manual" : "automatic", status }).select("id").single();
  if (error || !task) pageRedirect(lessonId, "Тапсырманы құру мүмкін болмады.");

  const { error: solutionError } = await supabase.from("task_solutions").insert({ task_id: task.id, correct_answer: correctAnswer || "manual", explanation });
  if (solutionError) {
    await supabase.from("tasks").delete().eq("id", task.id);
    pageRedirect(lessonId, "Тапсырма жауабын сақтау мүмкін болмады.");
  }

  revalidatePath(`/teacher/lessons/${lessonId}/tasks`);
  pageRedirect(lessonId, "Тапсырма қосылды.");
}

export async function gradeSubmission(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const score = Number(formData.get("score"));
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!lessonId || !submissionId || !Number.isFinite(score) || score < 0) return;

  const { supabase } = await requireRole("teacher");
  const { error } = await supabase.from("task_submissions").update({ score, feedback, status: "graded", graded_at: new Date().toISOString() }).eq("id", submissionId);
  if (error) pageRedirect(lessonId, "Бағаны сақтау мүмкін болмады.");
  revalidatePath(`/teacher/lessons/${lessonId}/tasks`);
}
