import Link from "next/link";

type FeatureDisabledCardProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function FeatureDisabledCard({
  title = "Modul deaktiviert",
  description = "Dieses Modul ist aktuell in den Systemeinstellungen deaktiviert.",
  backHref = "/dashboard",
  backLabel = "Zum Dashboard",
}: FeatureDisabledCardProps) {
  return (
    <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-start gap-5">
        <div className="h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl shrink-0">
          â¸
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-black">
            Feature Gate
          </p>

          <h1 className="text-3xl font-black tracking-[-0.03em] mt-2">
            {title}
          </h1>

          <p className="text-zinc-500 mt-3 leading-7">
            {description}
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
  );
}
