import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center">
        <p className="mb-4 text-sm font-semibold text-blue-700">GeoKenistik</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">10-сынып геометриясын интерактивті үйрену платформасы</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Мұғалім сабақтар мен тапсырмалар жасайды, ал оқушы оларды орындап, өз нәтижесін бақылайды.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register" className="min-h-12 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Тіркелу</Link>
          <Link href="/login" className="min-h-12 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Кіру</Link>
        </div>
      </div>
    </main>
  );
}
