import Link from "next/link";

type FeatureDisabledCardProps = {
  title?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export default function FeatureDisabledCard({
  title = "Funktion nicht verfügbar",
  description = "Diese Funktion ist aktuell deaktiviert oder wurde im PostgreSQL-Umbau entfernt.",
  href = "/admin",
  linkLabel = "Zum Admin-Dashboard",
}: FeatureDisabledCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
      <h1 className="text-3xl font-bold">
        {title}
      </h1>

      <p className="text-zinc-500 mt-3 leading-relaxed">
        {description}
      </p>

      <Link
        href={href}
        className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
      >
        {linkLabel}
      </Link>
    </div>
  );
}