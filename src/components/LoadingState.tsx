type LoadingStateProps = {
  title?: string;
  description?: string;
};

export default function LoadingState({
  title = "Daten werden geladen...",
  description = "Bitte kurz warten, die aktuellen Informationen werden vorbereitet.",
}: LoadingStateProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white border border-zinc-200 p-8 xl:p-10 text-center shadow-sm">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-3xl app-accent-soft app-accent-text flex items-center justify-center">
          <span className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>

        <h2 className="text-2xl xl:text-3xl font-black tracking-[-0.04em] mt-6">
          {title}
        </h2>

        <p className="text-zinc-500 leading-7 max-w-2xl mx-auto mt-3">
          {description}
        </p>
      </div>
    </section>
  );
}