import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-700">GeoKenistik</p>
        <h1 className="mt-4 text-3xl font-bold">Жеке кабинет</h1>
        <p className="mt-3 text-slate-600">Қош келдіңіз, {profile.full_name}.</p>
        {profile.role === "admin" && (
          <Link href="/admin/teachers" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            Мұғалімдерді басқару
          </Link>
        )}
        {profile.role === "teacher" && <div className="mt-8 flex flex-wrap gap-3"><DashboardLink href="/teacher/groups">Менің топтарым</DashboardLink><DashboardLink href="/teacher/courses">Менің курстарым</DashboardLink><DashboardLink href="/teacher/statistics">Статистика</DashboardLink></div>}
        {profile.role === "student" && <div className="mt-8 flex flex-wrap gap-3"><DashboardLink href="/student/groups">Менің топтарым</DashboardLink><DashboardLink href="/student/courses">Менің курстарым</DashboardLink><DashboardLink href="/student/statistics">Нәтижелерім</DashboardLink></div>}
      </div>
    </main>
  );
}

function DashboardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-12 items-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{children}</Link>;
}
