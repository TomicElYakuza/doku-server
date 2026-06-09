import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-3xl bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden relative">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full app-accent-bg opacity-10 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative p-8 md:p-12 text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl app-accent-soft app-accent-text flex items-center justify-center text-4xl font-black">
            404
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] app-accent-text">
            Seite nicht gefunden
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
            Diese Seite existiert nicht.
          </h1>

          <p className="mt-5 text-zinc-500 text-lg leading-8 max-w-2xl mx-auto">
            Der Link ist möglicherweise veraltet, falsch geschrieben oder die
            Seite wurde verschoben. Prüfe die Adresse oder gehe zurück zum
            Dashboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto app-accent-bg text-white px-6 py-4 rounded-2xl transition font-bold app-brand-shadow text-center"
            >
              Zum Dashboard
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-4 rounded-2xl transition font-bold text-center"
            >
              Zur Startseite
            </Link>
          </div>

          <div className="mt-8 bg-zinc-50 border border-zinc-100 rounded-3xl p-5 text-left">
            <p className="font-black text-zinc-950">Hinweis</p>
            <p className="text-zinc-500 mt-2">
              Wenn du diese Seite über die Navigation erreicht hast, sollte der
              Link im Admin-Bereich oder in der Modulliste geprüft werden.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}