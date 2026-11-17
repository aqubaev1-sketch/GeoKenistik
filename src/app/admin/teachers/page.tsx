import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateTeacherStatus } from "./actions";

export const instant = false;

const statusLabels: Record<string, string> = {
  pending: "Растауды күтуде",
  active: "Белсенді",
  rejected: "Қабылданбады",
  blocked: "Бұғатталған",
};

export default async function AdminTeachersPage() {
  const { supabase } = await requireAdmin();
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select("id, full_name, status, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Мұғалімдер тізімін жүктеу мүмкін болмады.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link>
            <h1 className="mt-4 text-3xl font-bold">Мұғалімдерді басқару</h1>
            <p className="mt-2 text-slate-600">Тіркелген мұғалімдерді растаңыз немесе қолжетімділігін шектеңіз.</p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">Барлығы: {teachers?.length ?? 0}</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!teachers?.length ? (
            <p className="p-8 text-center text-slate-600">Тіркелген мұғалімдер әлі жоқ.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {teachers.map((teacher) => (
                <article key={teacher.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{teacher.full_name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{statusLabels[teacher.status] ?? teacher.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teacher.status !== "active" && <StatusButton teacherId={teacher.id} status="active" label="Растау" primary />}
                    {teacher.status === "pending" && <StatusButton teacherId={teacher.id} status="rejected" label="Қабылдамау" />}
                    {teacher.status === "active" && <StatusButton teacherId={teacher.id} status="blocked" label="Бұғаттау" />}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusButton({ teacherId, status, label, primary = false }: { teacherId: string; status: string; label: string; primary?: boolean }) {
  return (
    <form action={updateTeacherStatus}>
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="status" value={status} />
      <button className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${primary ? "bg-blue-700 text-white hover:bg-blue-800" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`}>
        {label}
      </button>
    </form>
  );
}
