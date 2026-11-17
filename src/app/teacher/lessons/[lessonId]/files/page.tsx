import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { deleteLessonFile } from "./actions";
import { UploadForm } from "./upload-form";

export const instant = false;

export default async function TeacherLessonFilesPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { supabase, user } = await requireRole("teacher");
  const [{ data: lesson }, { data: files }] = await Promise.all([
    supabase.from("lessons").select("id, title, topics(course_id)").eq("id", lessonId).single(),
    supabase.from("lesson_files").select("id, file_name, mime_type, size_bytes, storage_path, created_at").eq("lesson_id", lessonId).order("created_at", { ascending: false }),
  ]);
  if (!lesson) notFound();
  const courseId = lesson.topics?.[0]?.course_id;
  const filesWithUrls = await Promise.all((files ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("lesson-files").createSignedUrl(file.storage_path, 3600);
    return { ...file, url: data?.signedUrl ?? null };
  }));

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-5xl"><Link href={courseId ? `/teacher/courses/${courseId}` : "/teacher/courses"} className="text-sm font-semibold text-blue-700 hover:underline">← Курсқа қайту</Link><h1 className="mt-4 text-3xl font-bold">{lesson.title}</h1><p className="mt-2 text-slate-600">Сабақ материалдары</p><div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]"><section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Материал жүктеу</h2><p className="mt-2 text-sm leading-6 text-slate-600">PDF, JPG, PNG, WebP немесе GIF. Ең көбі 20 МБ.</p><UploadForm lessonId={lessonId} userId={user.id} /></section><section className="space-y-3">{filesWithUrls.length ? filesWithUrls.map((file) => <article key={file.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{file.file_name}</h2><p className="mt-1 text-sm text-slate-600">{formatBytes(file.size_bytes)}</p></div><div className="flex gap-2">{file.url && <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-blue-50 px-4 text-sm font-semibold text-blue-700">Ашу</a>}<form action={deleteLessonFile}><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="fileId" value={file.id} /><input type="hidden" name="storagePath" value={file.storage_path} /><button className="min-h-10 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">Өшіру</button></form></div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Материалдар әлі жүктелмеді.</p>}</section></div></div></main>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
