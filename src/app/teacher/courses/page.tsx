import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createCourse } from "./actions";

export const instant = false;

export default async function TeacherCoursesPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const { supabase } = await requireRole("teacher");
  const { data: courses, error } = await supabase.from("courses").select("id, title, description, status, topics(count)").order("created_at", { ascending: false });
  if (error) throw new Error("Курстарды жүктеу мүмкін болмады.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[22rem_1fr]">
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Жаңа курс</h1>
            {message && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message}</p>}
            <form action={createCourse} className="mt-6 space-y-5">
              <label className="block text-sm font-semibold">Курс атауы<input name="title" required minLength={2} placeholder="Стереометрия" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="block text-sm font-semibold">Сипаттамасы<textarea name="description" rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label>
              <button className="min-h-12 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">Курс құру</button>
            </form>
          </section>
          <section>
            <h2 className="text-3xl font-bold">Менің курстарым</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {!courses?.length ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 sm:col-span-2">Әзірге курс жоқ.</p> : courses.map((course) => (
                <Link key={course.id} href={`/teacher/courses/${course.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{course.title}</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{course.status === "published" ? "Жарияланған" : "Жоба"}</span></div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{course.description || "Сипаттама жоқ"}</p>
                  <p className="mt-4 text-sm font-semibold text-blue-700">{course.topics?.[0]?.count ?? 0} тақырып</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
