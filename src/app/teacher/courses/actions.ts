"use server";

import { requireRole } from "@/lib/auth/require-role";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function createCourse(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (title.length < 2) redirectWithMessage("/teacher/courses", "Курс атауын енгізіңіз.");

  const { supabase, user } = await requireRole("teacher");
  const { data, error } = await supabase.from("courses").insert({ teacher_id: user.id, title, description, grade: 10 }).select("id").single();
  if (error || !data) redirectWithMessage("/teacher/courses", "Курсты құру мүмкін болмады.");
  redirect(`/teacher/courses/${data.id}`);
}

export async function createTopic(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || title.length < 2) return;
  const { supabase } = await requireRole("teacher");
  const { error } = await supabase.from("topics").insert({ course_id: courseId, title });
  if (error) redirectWithMessage(`/teacher/courses/${courseId}`, "Тақырыпты қосу мүмкін болмады.");
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function createLesson(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const topicId = String(formData.get("topicId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rawYoutubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!courseId || !topicId || title.length < 2) return;
  let youtubeUrl: string | null = null;
  if (rawYoutubeUrl) {
    try {
      const url = new URL(rawYoutubeUrl);
      if (!["youtube.com", "www.youtube.com", "youtu.be"].includes(url.hostname)) throw new Error();
      youtubeUrl = url.toString();
    } catch {
      redirectWithMessage(`/teacher/courses/${courseId}`, "YouTube сілтемесі дұрыс емес.");
    }
  }

  const { supabase } = await requireRole("teacher");
  const { error } = await supabase.from("lessons").insert({ topic_id: topicId, title, summary, content, youtube_url: youtubeUrl, status });
  if (error) redirectWithMessage(`/teacher/courses/${courseId}`, "Сабақты қосу мүмкін болмады.");
  revalidatePath(`/teacher/courses/${courseId}`);
}

export async function updateCourseStatus(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const status = formData.get("status") === "published" ? "published" : "draft";
  if (!courseId) return;
  const { supabase } = await requireRole("teacher");
  await supabase.from("courses").update({ status }).eq("id", courseId);
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/teacher/courses");
}

export async function toggleCourseGroup(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const assigned = String(formData.get("assigned") ?? "") === "true";
  if (!courseId || !groupId) return;
  const { supabase } = await requireRole("teacher");
  if (assigned) await supabase.from("course_groups").delete().eq("course_id", courseId).eq("group_id", groupId);
  else await supabase.from("course_groups").insert({ course_id: courseId, group_id: groupId });
  revalidatePath(`/teacher/courses/${courseId}`);
}
