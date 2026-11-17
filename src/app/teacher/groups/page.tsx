import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createGroup } from "./actions";

export const instant = false;

export default async function TeacherGroupsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const { supabase } = await requireRole("teacher");
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, grade, academic_year, invite_code, group_members(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Топтарды жүктеу мүмкін болмады.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[22rem_1fr]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Жаңа топ құру</h1>
            <p className="mt-2 leading-7 text-slate-600">10-сынып оқушылары код арқылы қосылады.</p>
            {message && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">{message}</p>}
            <form action={createGroup} className="mt-6 space-y-5">
              <label className="block text-sm font-semibold">Топ атауы<input name="name" required minLength={2} placeholder="Мысалы, 10А Геометрия" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-semibold">Оқу жылы<input name="academicYear" required defaultValue="2026–2027" pattern="20[0-9]{2}–20[0-9]{2}" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label>
              <button className="min-h-12 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Топ құру</button>
            </form>
          </section>

          <section>
            <h2 className="text-3xl font-bold">Менің топтарым</h2>
            <p className="mt-2 text-slate-600">Оқушыларға алты таңбалы шақыру кодын беріңіз.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {!groups?.length ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 sm:col-span-2">Әзірге топ жоқ.</p>
              ) : groups.map((group) => (
                <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-bold">{group.name}</h3><p className="mt-1 text-sm text-slate-600">{group.grade}-сынып · {group.academic_year}</p></div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">{group.group_members?.[0]?.count ?? 0} оқушы</span>
                  </div>
                  <div className="mt-5 rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-900">Шақыру коды</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-blue-950">{group.invite_code}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
