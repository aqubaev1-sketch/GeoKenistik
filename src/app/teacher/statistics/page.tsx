import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

export const instant = false;

type StudentProfile = { full_name: string };
type MemberRow = { student_id: string; profiles: StudentProfile[] };
type GroupRow = { id: string; name: string; group_members: MemberRow[] };
type SubmissionRow = {
  student_id: string;
  score: number | null;
  status: string;
  tasks: { points: number }[];
};

export default async function TeacherStatisticsPage() {
  const { supabase } = await requireRole("teacher");
  const [{ data: rawGroups, error: groupsError }, { data: rawSubmissions, error: submissionsError }] = await Promise.all([
    supabase.from("groups").select("id, name, group_members(student_id, profiles(full_name))").order("name"),
    supabase.from("task_submissions").select("student_id, score, status, tasks(points)"),
  ]);
  if (groupsError || submissionsError) throw new Error("Статистиканы жүктеу мүмкін болмады.");

  const groups = (rawGroups ?? []) as unknown as GroupRow[];
  const submissions = (rawSubmissions ?? []) as unknown as SubmissionRow[];
  const students = new Map<string, { name: string; groups: Set<string>; submitted: number; graded: number; score: number; possible: number }>();

  for (const group of groups) {
    for (const member of group.group_members ?? []) {
      const current = students.get(member.student_id) ?? { name: member.profiles?.[0]?.full_name ?? "Оқушы", groups: new Set<string>(), submitted: 0, graded: 0, score: 0, possible: 0 };
      current.groups.add(group.name);
      students.set(member.student_id, current);
    }
  }

  for (const submission of submissions) {
    const current = students.get(submission.student_id);
    if (!current) continue;
    current.submitted += 1;
    if (submission.status === "graded") {
      current.graded += 1;
      current.score += Number(submission.score ?? 0);
      current.possible += Number(submission.tasks?.[0]?.points ?? 0);
    }
  }

  const rows = [...students.values()].sort((a, b) => a.name.localeCompare(b.name, "kk"));
  const totalSubmitted = submissions.length;
  const totalGraded = submissions.filter((item) => item.status === "graded").length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link>
        <h1 className="mt-4 text-3xl font-bold">Үлгерім статистикасы</h1>
        <p className="mt-2 text-slate-600">Топтардағы оқушылардың тапсырма нәтижелері.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Оқушылар" value={rows.length} />
          <Metric label="Жіберілген жауаптар" value={totalSubmitted} />
          <Metric label="Тексерілген жауаптар" value={totalGraded} />
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead className="bg-slate-100 text-start"><tr><th className="p-4 text-start">Оқушы</th><th className="p-4 text-start">Топ</th><th className="p-4 text-end">Жауап</th><th className="p-4 text-end">Тексерілді</th><th className="p-4 text-end">Балл</th><th className="p-4 text-end">Нәтиже</th></tr></thead>
            <tbody className="divide-y divide-slate-200">{rows.length ? rows.map((student) => { const percent = student.possible > 0 ? Math.round((student.score / student.possible) * 100) : 0; return <tr key={`${student.name}-${[...student.groups].join()}`}><td className="p-4 font-semibold">{student.name}</td><td className="p-4 text-slate-600">{[...student.groups].join(", ")}</td><td className="p-4 text-end tabular-nums">{student.submitted}</td><td className="p-4 text-end tabular-nums">{student.graded}</td><td className="p-4 text-end tabular-nums">{student.score} / {student.possible}</td><td className="p-4 text-end font-semibold tabular-nums">{percent}%</td></tr>; }) : <tr><td colSpan={6} className="p-8 text-center text-slate-600">Топтарда оқушы жоқ.</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></div>;
}
