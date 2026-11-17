import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getYouTubeThumbnail } from "@/lib/youtube";
import { createLesson, createTopic, toggleCourseGroup, updateCourseStatus } from "../actions";

export const instant = false;

export default async function TeacherCoursePage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ message?: string }> }) {
  const { courseId } = await params;
  const { message } = await searchParams;
  const { supabase } = await requireRole("teacher");
  const [{ data: course }, { data: groups }, { data: assignments }] = await Promise.all([
    supabase.from("courses").select("id, title, description, status, topics(id, title, position, lessons(id, title, summary, youtube_url, status, position))").eq("id", courseId).single(),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("course_groups").select("group_id").eq("course_id", courseId),
  ]);
  if (!course) notFound();
  const assignedIds = new Set(assignments?.map((item) => item.group_id) ?? []);
  const topics = [...(course.topics ?? [])].sort((a, b) => a.position - b.position);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/teacher/courses" className="text-sm font-semibold text-blue-700 hover:underline">← Курстар</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div><h1 className="text-3xl font-bold">{course.title}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">{course.description || "Сипаттама жоқ"}</p></div>
          <form action={updateCourseStatus}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="status" value={course.status === "published" ? "draft" : "published"} /><button className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800">{course.status === "published" ? "Жобаға қайтару" : "Курсты жариялау"}</button></form>
        </div>
        {message && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section className="space-y-5">
            {topics.map((topic) => {
              const lessons = [...(topic.lessons ?? [])].sort((a, b) => a.position - b.position);
              return <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">{topic.title}</h2>
                <div className="mt-4 space-y-3">{lessons.length ? lessons.map((lesson) => {
                  const thumbnail = getYouTubeThumbnail(lesson.youtube_url);
                  return <div key={lesson.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{lesson.title}</h3><span className="text-xs font-semibold text-slate-600">{lesson.status === "published" ? "Жарияланған" : "Жоба"}</span></div>{thumbnail && lesson.youtube_url && <a href={lesson.youtube_url} target="_blank" rel="noreferrer" className="group relative mt-4 block aspect-video max-w-xl overflow-hidden rounded-xl bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"><img src={thumbnail} alt={`${lesson.title} — YouTube бейнесінің мұқабасы`} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" /><span className="absolute inset-0 grid place-items-center bg-black/10"><span className="grid size-14 place-items-center rounded-full bg-red-600 text-white shadow-lg" aria-hidden="true"><svg viewBox="0 0 24 24" className="ms-1 size-7" fill="currentColor"><path d="m9 7 8 5-8 5V7Z" /></svg></span></span></a>}<p className="mt-3 text-sm leading-6 text-slate-600">{lesson.summary || "Қысқаша сипаттама жоқ"}</p><div className="mt-3 flex flex-wrap gap-3">{lesson.youtube_url && <a href={lesson.youtube_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-red-700 hover:underline">YouTube бейнесі ↗</a>}<Link href={`/teacher/lessons/${lesson.id}/tasks`} className="text-sm font-semibold text-blue-700 hover:underline">Тапсырмалар →</Link><Link href={`/teacher/lessons/${lesson.id}/files`} className="text-sm font-semibold text-blue-700 hover:underline">Материалдар →</Link></div></div>;
                }) : <p className="text-sm text-slate-600">Бұл тақырыпта сабақ жоқ.</p>}</div>
                <details className="mt-4 rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-semibold">Сабақ қосу</summary><LessonForm courseId={course.id} topicId={topic.id} /></details>
              </article>;
            })}
            {!topics.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Алдымен тақырып қосыңыз.</p>}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Тақырып қосу</h2><form action={createTopic} className="mt-4 space-y-3"><input type="hidden" name="courseId" value={course.id} /><label className="block text-sm font-semibold">Тақырып атауы<input name="title" required minLength={2} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-700" /></label><button className="min-h-11 w-full rounded-xl border border-blue-700 px-4 font-semibold text-blue-700 hover:bg-blue-50">Қосу</button></form></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Топтарға тағайындау</h2><div className="mt-4 space-y-2">{groups?.length ? groups.map((group) => { const assigned = assignedIds.has(group.id); return <form key={group.id} action={toggleCourseGroup} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="groupId" value={group.id} /><input type="hidden" name="assigned" value={String(assigned)} /><span className="text-sm font-medium">{group.name}</span><button className={`rounded-lg px-3 py-2 text-xs font-semibold ${assigned ? "bg-emerald-100 text-emerald-800" : "bg-white text-blue-700 shadow-sm"}`}>{assigned ? "Тағайындалды" : "Тағайындау"}</button></form>; }) : <p className="text-sm leading-6 text-slate-600">Алдымен оқу тобын құрыңыз.</p>}</div></section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function LessonForm({ courseId, topicId }: { courseId: string; topicId: string }) {
  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-700";
  return <form action={createLesson} className="mt-4 space-y-4"><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="topicId" value={topicId} /><label className="block text-sm font-semibold">Сабақ атауы<input name="title" required minLength={2} className={inputClass} /></label><label className="block text-sm font-semibold">Қысқаша сипаттама<textarea name="summary" rows={2} className={`${inputClass} py-3`} /></label><label className="block text-sm font-semibold">Сабақ мәтіні<textarea name="content" rows={5} className={`${inputClass} py-3`} /></label><label className="block text-sm font-semibold">YouTube сілтемесі<input name="youtubeUrl" type="url" placeholder="https://youtube.com/..." className={inputClass} /></label><label className="block text-sm font-semibold">Күйі<select name="status" className={inputClass}><option value="draft">Жоба</option><option value="published">Жарияланған</option></select></label><button className="min-h-11 w-full rounded-xl bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800">Сабақ қосу</button></form>;
}
