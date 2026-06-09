import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-3xl bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden relative">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative p-8 md:p-12 text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center text-4xl font-black">
            401
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-blue-600">
            Nicht angemeldet
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Bitte melde dich an.
          </h1>

          <p className="mt-5 text-zinc-500 text-lg leading-8 max-w-2xl mx-auto">
            Deine Sitzung ist möglicherweise abgelaufen oder du bist noch nicht
            angemeldet. Melde dich erneut an, um fortzufahren.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto app-accent-bg text-white px-6 py-4 rounded-2xl transition font-bold app-brand-shadow text-center"
            >
              Zum Login
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-4 rounded-2xl transition font-bold text-center"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}