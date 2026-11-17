import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

export const instant = false;

type SubmissionRow = { id: string; answer: string; status: string; score: number | null; feedback: string; submitted_at: string; tasks: { title: string; points: number }[] };

export default async function StudentStatisticsPage() {
  const { supabase, user } = await requireRole("student");
  const { data, error } = await supabase.from("task_submissions").select("id, answer, status, score, feedback, submitted_at, tasks(title, points)").eq("student_id", user.id).order("submitted_at", { ascending: false });
  if (error) throw new Error("Нәтижелерді жүктеу мүмкін болмады.");
  const submissions = (data ?? []) as unknown as SubmissionRow[];
  const graded = submissions.filter((item) => item.status === "graded");
  const score = graded.reduce((sum, item) => sum + Number(item.score ?? 0), 0);
  const possible = graded.reduce((sum, item) => sum + Number(item.tasks?.[0]?.points ?? 0), 0);
  const percent = possible > 0 ? Math.round((score / possible) * 100) : 0;

  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-5xl"><Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link><h1 className="mt-4 text-3xl font-bold">Менің нәтижелерім</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Жауаптар" value={String(submissions.length)} /><Metric label="Тексерілді" value={String(graded.length)} /><Metric label="Жалпы нәтиже" value={`${percent}%`} /></div><div className="mt-8 space-y-4">{submissions.length ? submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-bold">{submission.tasks?.[0]?.title ?? "Тапсырма"}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${submission.status === "graded" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{submission.status === "graded" ? `${submission.score} / ${submission.tasks?.[0]?.points ?? 0} балл` : "Тексерілуде"}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">Жауап: {submission.answer}</p>{submission.feedback && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Мұғалім пікірі: {submission.feedback}</p>}</article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">Сіз әлі тапсырма орындамадыңыз.</p>}</div></div></main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></div>;
}
