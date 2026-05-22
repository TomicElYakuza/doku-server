type FeatureDisabledCardProps = {
  title?: string;
  description?: string;
};

export default function FeatureDisabledCard({
  title = "Feature deaktiviert",
  description = "Dieses Modul ist aktuell in den Einstellungen deaktiviert.",
}: FeatureDisabledCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
      <h1 className="text-3xl font-bold">
        {title}
      </h1>

      <p className="text-zinc-500 mt-2">
        {description}
      </p>
    </div>
  );
}