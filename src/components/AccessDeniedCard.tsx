import Link from "next/link";

type AccessDeniedCardProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function AccessDeniedCard({
  title = "Zugriff verweigert",
  description = "Du hast keine Berechtigung für diesen Bereich.",
  backHref = "/dashboard",
  backLabel = "Zurück zum Dashboard",
}: AccessDeniedCardProps) {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] app-accent-bg text-white p-8 md:p-10 app-brand-shadow">
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-white/25" />

        <div className="relative max-w-4xl">
          <p className="text-sm uppercase tracking-[0.22em] text-white/60 font-black">
            Sicherheit
          </p>

          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-4">
            {title}
          </h1>

          <p className="text-white/70 text-lg leading-8 mt-4">
            {description}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href={backHref}
              className="bg-white text-zinc-950 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-start gap-5">
          <div className="h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl shrink-0">
            🛡️
          </div>

          <div>
            <h2 className="text-2xl font-black text-zinc-950">
              Keine Berechtigung
            </h2>

            <p className="text-zinc-500 mt-2 leading-7">
              Dein aktueller Benutzer darf diesen Bereich nicht öffnen. Falls du Zugriff benötigst, wende dich an einen Administrator.
            </p>

            <Link
              href={backHref}
              className="inline-flex mt-6 app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              {backLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
