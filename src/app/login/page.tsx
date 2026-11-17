import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="text-sm font-semibold text-blue-700">GeoKenistik</Link>
        <h1 className="mt-5 text-3xl font-bold">Кіру</h1>
        <p className="mt-2 leading-7 text-slate-600">Жеке кабинетке кіру үшін деректеріңізді енгізіңіз.</p>
        {message && <p role="status" className="mt-5 rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-900">{message}</p>}
        <form action={signIn} className="mt-6 space-y-5">
          <label className="block text-sm font-semibold">Электрондық пошта<input type="email" name="email" autoComplete="email" required className={inputClass} /></label>
          <label className="block text-sm font-semibold">Құпиясөз<input type="password" name="password" autoComplete="current-password" required className={inputClass} /></label>
          <button className="min-h-12 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Кіру</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Аккаунтыңыз жоқ па? <Link href="/register" className="font-semibold text-blue-700 hover:underline">Тіркелу</Link></p>
      </div>
    </main>
  );
}
