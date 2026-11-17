import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { joinGroup } from "./actions";

export const instant = false;

export default async function StudentGroupsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const { supabase } = await requireRole("student");
  const { data: memberships, error } = await supabase
    .from("group_members")
    .select("joined_at, groups(id, name, grade, academic_year)")
    .order("joined_at", { ascending: false });

  if (error) throw new Error("Топтарды жүктеу мүмкін болмады.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link>
        <h1 className="mt-4 text-3xl font-bold">Менің топтарым</h1>
        <p className="mt-2 text-slate-600">Мұғалім берген шақыру коды арқылы топқа қосылыңыз.</p>

        <form action={joinGroup} className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-semibold">Шақыру коды<input name="code" required minLength={6} maxLength={6} placeholder="ABC123" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-mono text-base uppercase tracking-widest outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label>
          <button className="min-h-12 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Қосылу</button>
        </form>
        {message && <p role="status" className="mt-4 max-w-xl rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">{message}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {!memberships?.length ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 sm:col-span-2">Сіз әлі топқа қосылмадыңыз.</p>
          ) : memberships.map((membership) => {
            const group = Array.isArray(membership.groups) ? membership.groups[0] : membership.groups;
            if (!group) return null;
            return <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">{group.name}</h2><p className="mt-2 text-sm text-slate-600">{group.grade}-сынып · {group.academic_year}</p></article>;
          })}
        </div>
      </div>
    </main>
  );
}
