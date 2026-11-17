import Link from "next/link";
import { signOut } from "@/app/auth/sign-out";
import { createClient } from "@/lib/supabase/server";
import { PlatformNav } from "./platform-nav";

type Role = "admin" | "teacher" | "student";

const navigation: Record<Role, { href: string; label: string }[]> = {
  admin: [{ href: "/admin/teachers", label: "Мұғалімдер" }],
  teacher: [
    { href: "/teacher/courses", label: "Курстар" },
    { href: "/teacher/groups", label: "Топтар" },
    { href: "/teacher/statistics", label: "Статистика" },
  ],
  student: [
    { href: "/student/courses", label: "Курстар" },
    { href: "/student/groups", label: "Топтар" },
    { href: "/student/statistics", label: "Нәтижелер" },
  ],
};

const roleNames: Record<Role, string> = {
  admin: "Әкімші",
  teacher: "Мұғалім",
  student: "Оқушы",
};

export async function PlatformHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("full_name, role, status").eq("id", user.id).single();
  if (!profile || profile.status !== "active" || !isRole(profile.role)) return null;

  const initials = profile.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toLocaleUpperCase("kk-KZ");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="group flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" aria-label="GeoKenistik — жеке кабинет">
          <span aria-hidden="true" className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-blue-700 text-white shadow-sm">
            <svg viewBox="0 0 40 40" className="size-8" fill="none">
              <path d="M7 25.5 20 8l13 17.5L20 32 7 25.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="m7 25.5 13-4 13 4M20 8v24" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
            </svg>
          </span>
          <span>
            <span className="block text-base font-extrabold tracking-tight text-slate-950">GeoKenistik</span>
            <span className="block text-xs font-medium text-slate-500">10-сынып геометриясы</span>
          </span>
        </Link>

        <PlatformNav items={navigation[profile.role]} />

        <div className="ms-auto flex items-center gap-2">
          <Link href="/dashboard" className="hidden min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</span>
            <span className="hidden text-start lg:block">
              <span className="block max-w-32 truncate text-sm font-semibold text-slate-900">{profile.full_name}</span>
              <span className="block text-xs text-slate-500">{roleNames[profile.role]}</span>
            </span>
          </Link>
          <form action={signOut}>
            <button className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Шығу</button>
          </form>
        </div>
      </div>
    </header>
  );
}

function isRole(value: string): value is Role {
  return value === "admin" || value === "teacher" || value === "student";
}
