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
    <section className="relative overflow-hidden rounded-[2rem] bg-white border border-zinc-200 p-8 xl:p-10 text-center shadow-sm">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full app-accent-bg opacity-5 blur-3xl" />

      <div className="relative">
        <div className="mx-auto h-16 w-16 rounded-3xl app-accent-soft app-accent-text flex items-center justify-center text-3xl">
          {icon}
        </div>

        <h2 className="text-2xl xl:text-3xl font-black tracking-[-0.04em] mt-6">
          {title}
        </h2>

        {description && (
          <p className="text-zinc-500 leading-7 max-w-2xl mx-auto mt-3">
            {description}
          </p>
        )}

        {action && (
          <div className="flex justify-center mt-6">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}