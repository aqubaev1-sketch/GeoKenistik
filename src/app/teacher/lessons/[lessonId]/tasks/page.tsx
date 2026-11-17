import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createTask, gradeSubmission } from "./actions";

export const instant = false;

const typeLabels: Record<string, string> = { single_choice: "Бір дұрыс жауап", short_text: "Қысқа жауап", long_text: "Толық жауап" };

export default async function TeacherLessonTasksPage({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ message?: string }> }) {
  const { lessonId } = await params;
  const { message } = await searchParams;
  const { supabase } = await requireRole("teacher");
  const { data: lesson } = await supabase.from("lessons").select("id, title, topic_id, topics(course_id)").eq("id", lessonId).single();
  if (!lesson) notFound();
  const [{ data: tasks }, { data: submissions }] = await Promise.all([
    supabase.from("tasks").select("id, title, prompt, type, options, points, check_mode, status, task_solutions(correct_answer, explanation)").eq("lesson_id", lessonId).order("position"),
    supabase.from("task_submissions").select("id, task_id, answer, status, score, feedback, profiles(full_name)").in("task_id", (await supabase.from("tasks").select("id").eq("lesson_id", lessonId)).data?.map((task) => task.id) ?? []),
  ]);
  const courseId = lesson.topics?.[0]?.course_id;

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-6xl"><Link href={courseId ? `/teacher/courses/${courseId}` : "/teacher/courses"} className="text-sm font-semibold text-blue-700 hover:underline">← Курсқа қайту</Link><h1 className="mt-4 text-3xl font-bold">{lesson.title}</h1><p className="mt-2 text-slate-600">Тапсырмалар мен оқушы жауаптары</p>{message && <p role="status" className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
      <TaskForm lessonId={lessonId} />
      <section className="space-y-5">{tasks?.length ? tasks.map((task) => { const taskSubmissions = submissions?.filter((item) => item.task_id === task.id) ?? []; return <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{task.title}</h2><p className="mt-1 text-sm text-slate-600">{typeLabels[task.type]} · {task.points} балл</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{task.status === "published" ? "Жарияланған" : "Жоба"}</span></div><p className="mt-4 leading-7">{task.prompt}</p>{task.options?.length > 0 && <ul className="mt-3 list-inside list-disc text-sm text-slate-600">{task.options.map((option: string) => <li key={option}>{option}</li>)}</ul>}<details className="mt-5"><summary className="cursor-pointer font-semibold">Жауаптар ({taskSubmissions.length})</summary><div className="mt-4 space-y-3">{taskSubmissions.length ? taskSubmissions.map((submission) => <SubmissionCard key={submission.id} lessonId={lessonId} submission={submission} maxScore={Number(task.points)} />) : <p className="text-sm text-slate-600">Жауап жоқ.</p>}</div></details></article>; }) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Бұл сабақта тапсырма жоқ.</p>}</section>
    </div></div></main>;
}

function TaskForm({ lessonId }: { lessonId: string }) {
  const input = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-700";
  return <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Тапсырма қосу</h2><form action={createTask} className="mt-5 space-y-4"><input type="hidden" name="lessonId" value={lessonId} /><label className="block text-sm font-semibold">Атауы<input name="title" required className={input} /></label><label className="block text-sm font-semibold">Сұрақ<textarea name="prompt" required rows={3} className={`${input} py-3`} /></label><label className="block text-sm font-semibold">Жауап түрі<select name="type" className={input}><option value="single_choice">Бір дұрыс жауап</option><option value="short_text">Қысқа жауап</option><option value="long_text">Толық жауап</option></select></label><label className="block text-sm font-semibold">Жауап нұсқалары<textarea name="options" rows={3} placeholder="Әр нұсқа жаңа жолдан" className={`${input} py-3`} /></label><label className="block text-sm font-semibold">Дұрыс жауап<input name="correctAnswer" className={input} /></label><label className="block text-sm font-semibold">Түсіндірме<textarea name="explanation" rows={2} className={`${input} py-3`} /></label><label className="block text-sm font-semibold">Балл<input name="points" type="number" min="0.5" step="0.5" defaultValue="1" required className={input} /></label><label className="block text-sm font-semibold">Күйі<select name="status" className={input}><option value="draft">Жоба</option><option value="published">Жарияланған</option></select></label><button className="min-h-11 w-full rounded-xl bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800">Қосу</button></form></section>;
}

function SubmissionCard({ lessonId, submission, maxScore }: { lessonId: string; submission: any; maxScore: number }) {
  const profile = Array.isArray(submission.profiles) ? submission.profiles[0] : submission.profiles;
  return <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{profile?.full_name ?? "Оқушы"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.answer}</p>{submission.status === "graded" ? <p className="mt-3 text-sm font-semibold text-emerald-700">{submission.score} / {maxScore} балл</p> : <form action={gradeSubmission} className="mt-4 grid gap-3 sm:grid-cols-[7rem_1fr_auto]"><input type="hidden" name="lessonId" value={lessonId} /><input type="hidden" name="submissionId" value={submission.id} /><label className="text-xs font-semibold">Балл<input name="score" type="number" min="0" max={maxScore} step="0.5" required className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 text-sm" /></label><label className="text-xs font-semibold">Пікір<input name="feedback" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><button className="min-h-10 self-end rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white">Бағалау</button></form>}</div>;
}
