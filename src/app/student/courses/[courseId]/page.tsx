import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getYouTubeVideoId } from "@/lib/youtube";

export const instant = false;

function youtubeEmbedUrl(value: string | null) {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
}

export default async function StudentCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { supabase } = await requireRole("student");
  const { data: course } = await supabase.from("courses").select("id, title, description, topics(id, title, position, lessons(id, title, summary, content, youtube_url, position))").eq("id", courseId).eq("status", "published").single();
  if (!course) notFound();
  const topics = [...(course.topics ?? [])].sort((a, b) => a.position - b.position);

    return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-4xl"><Link href="/student/courses" className="text-sm font-semibold text-blue-700 hover:underline">← Курстар</Link><h1 className="mt-4 text-3xl font-bold">{course.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{course.description}</p><div className="mt-8 space-y-6">{topics.map((topic) => <section key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">{topic.title}</h2><div className="mt-5 space-y-5">{[...(topic.lessons ?? [])].sort((a, b) => a.position - b.position).map((lesson) => { const embedUrl = youtubeEmbedUrl(lesson.youtube_url); return <article key={lesson.id} className="rounded-xl bg-slate-50 p-5"><h3 className="text-lg font-bold">{lesson.title}</h3>{lesson.summary && <p className="mt-2 leading-7 text-slate-600">{lesson.summary}</p>}{embedUrl && <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-black"><iframe src={embedUrl} title={`${lesson.title} бейнесі`} className="h-full w-full" allowFullScreen /></div>}{lesson.content && <div className="mt-5 whitespace-pre-wrap leading-8 text-slate-800">{lesson.content}</div>}<div className="mt-5 flex flex-wrap gap-3"><Link href={`/student/lessons/${lesson.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">Тапсырмаларды орындау</Link><Link href={`/student/lessons/${lesson.id}/materials`} className="inline-flex min-h-11 items-center rounded-xl border border-blue-700 px-5 font-semibold text-blue-700 hover:bg-blue-50">Материалдарды ашу</Link></div></article>; })}</div></section>)}</div></div></main>;
}
