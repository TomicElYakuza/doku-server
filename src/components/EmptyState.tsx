import {
  ReactNode,
} from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon = "✨",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="bg-white border border-dashed border-zinc-200 rounded-3xl p-10 shadow-sm text-center overflow-hidden relative">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full app-accent-bg opacity-5 blur-3xl" />

      <div className="relative max-w-2xl mx-auto">
        <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
          {icon}
        </div>

        <h2 className="text-2xl font-black tracking-[-0.03em] text-zinc-950 mt-5">
          {title}
        </h2>

        {description && (
          <p className="text-zinc-500 mt-3 leading-7">
            {description}
          </p>
        )}

        {action && (
          <div className="mt-7 flex justify-center">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
