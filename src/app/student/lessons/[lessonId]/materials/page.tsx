import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";

export const instant = false;

export default async function StudentLessonMaterialsPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { supabase } = await requireRole("student");
  const [{ data: lesson }, { data: files }] = await Promise.all([
    supabase.from("lessons").select("id, title, status, topics(course_id)").eq("id", lessonId).eq("status", "published").single(),
    supabase.from("lesson_files").select("id, file_name, mime_type, size_bytes, storage_path, created_at").eq("lesson_id", lessonId).order("created_at", { ascending: false }),
  ]);

  if (!lesson) notFound();
  const courseId = lesson.topics?.[0]?.course_id;
  const filesWithUrls = await Promise.all((files ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("lesson-files").createSignedUrl(file.storage_path, 3600);
    return { ...file, url: data?.signedUrl ?? null };
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href={courseId ? `/student/courses/${courseId}` : "/student/courses"} className="text-sm font-semibold text-blue-700 hover:underline">← Сабаққа қайту</Link>
        <h1 className="mt-4 text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-2 text-slate-600">Сабақ материалдары</p>
        <section className="mt-8 space-y-3">
          {filesWithUrls.length ? filesWithUrls.map((file) => (
            <article key={file.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">{file.file_name}</h2>
                <p className="mt-1 text-sm text-slate-600">{file.mime_type === "application/pdf" ? "PDF құжаты" : "Сурет"} · {formatBytes(file.size_bytes)}</p>
              </div>
              {file.url ? <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">Ашу</a> : <span className="text-sm text-red-700">Файл уақытша қолжетімсіз</span>}
            </article>
          )) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Бұл сабаққа материалдар әлі қосылмады.</p>}
        </section>
      </div>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
