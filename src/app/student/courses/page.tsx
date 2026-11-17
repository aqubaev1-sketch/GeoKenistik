import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

export const instant = false;

export default async function StudentCoursesPage() {
  const { supabase } = await requireRole("student");
  const { data: courses, error } = await supabase.from("courses").select("id, title, description, grade, topics(count)").eq("status", "published").order("created_at", { ascending: false });
  if (error) throw new Error("Курстарды жүктеу мүмкін болмады.");
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-5xl"><Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Жеке кабинет</Link><h1 className="mt-4 text-3xl font-bold">Менің курстарым</h1><p className="mt-2 text-slate-600">Мұғалім тобыңызға тағайындаған курстар.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{courses?.length ? courses.map((course) => <Link key={course.id} href={`/student/courses/${course.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><h2 className="font-bold">{course.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{course.description || "Сипаттама жоқ"}</p><p className="mt-4 text-sm font-semibold text-blue-700">{course.topics?.[0]?.count ?? 0} тақырып</p></Link>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 sm:col-span-2">Сізге курс әлі тағайындалмады.</p>}</div></div></main>;
}
