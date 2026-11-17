import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { submitTask } from "./actions";

export const instant = false;

export default async function StudentLessonTasksPage({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ message?: string }> }) {
  const { lessonId } = await params;
  const { message } = await searchParams;
  const { supabase, user } = await requireRole("student");
  const { data: lesson } = await supabase.from("lessons").select("id, title, topic_id, topics(course_id)").eq("id", lessonId).eq("status", "published").single();
  if (!lesson) notFound();
  const [{ data: tasks }, { data: submissions }] = await Promise.all([
    supabase.from("tasks").select("id, title, prompt, type, options, points, check_mode").eq("lesson_id", lessonId).eq("status", "published").order("position"),
    supabase.from("task_submissions").select("task_id, answer, status, score, feedback").eq("student_id", user.id),
  ]);
  const submissionMap = new Map(submissions?.map((submission) => [submission.task_id, submission]) ?? []);
  const courseId = lesson.topics?.[0]?.course_id;

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-4xl"><Link href={courseId ? `/student/courses/${courseId}` : "/student/courses"} className="text-sm font-semibold text-blue-700 hover:underline">← Сабаққа қайту</Link><h1 className="mt-4 text-3xl font-bold">{lesson.title}</h1><p className="mt-2 text-slate-600">Сабақ тапсырмалары</p>{message && <p role="status" className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}<div className="mt-8 space-y-5">{tasks?.length ? tasks.map((task, index) => <TaskCard key={task.id} lessonId={lessonId} task={task} index={index + 1} submission={submissionMap.get(task.id)} />) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Бұл сабақта тапсырма жоқ.</p>}</div></div></main>;
}

function TaskCard({ lessonId, task, index, submission }: { lessonId: string; task: any; index: number; submission: any }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">{index}-тапсырма</p><h2 className="mt-1 text-xl font-bold">{task.title}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">{task.points} балл</span></div><p className="mt-4 whitespace-pre-wrap leading-7">{task.prompt}</p>
    {submission ? <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Сіздің жауабыңыз</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.answer}</p>{submission.status === "graded" ? <p className="mt-3 font-semibold text-emerald-700">Нәтиже: {submission.score} / {task.points}</p> : <p className="mt-3 text-sm font-semibold text-amber-700">Мұғалім тексеруде</p>}{submission.feedback && <p className="mt-2 text-sm text-slate-700">Пікір: {submission.feedback}</p>}</div> : <form action={submitTask} className="mt-5"><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="taskId" value={task.id} />{task.type === "single_choice" ? <fieldset className="space-y-2"><legend className="sr-only">Жауап нұсқалары</legend>{task.options.map((option: string) => <label key={option} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 has-checked:border-blue-700 has-checked:bg-blue-50"><input type="radio" name="answer" value={option} required /><span>{option}</span></label>)}</fieldset> : task.type === "short_text" ? <label className="block text-sm font-semibold">Жауап<input name="answer" required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-normal outline-none focus:border-blue-700" /></label> : <label className="block text-sm font-semibold">Толық жауап<textarea name="answer" required rows={5} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-700" /></label>}<button className="mt-4 min-h-11 rounded-xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800">Жауапты жіберу</button></form>}
  </article>;
}
