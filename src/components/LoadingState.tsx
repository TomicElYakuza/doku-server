type LoadingStateProps = {
  title?: string;
  description?: string;
};

export default function LoadingState({
  title = "Daten werden geladen...",
  description = "Bitte kurz warten, die aktuellen Informationen werden vorbereitet.",
}: LoadingStateProps) {
  return (
    <section className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative flex items-center gap-5">
        <div className="h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center shrink-0">
          <span className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>

        <div>
          <p className="font-black text-zinc-950">
            {title}
          </p>

          <p className="text-zinc-500 mt-1 leading-7">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
