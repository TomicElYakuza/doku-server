import {
  ReactNode,
} from "react";

type PageHeroBadge = {
  label: string;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: PageHeroBadge[];
  actions?: ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#111217] text-white p-7 xl:p-8 shadow-sm border border-white/10">
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full opacity-25 blur-3xl app-accent-bg" />
      <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full opacity-25 blur-3xl app-accent-bg" />
      <div className="absolute inset-x-0 top-0 h-1 app-accent-bg" />

      <div className="relative flex flex-col xl:flex-row xl:items-start xl:justify-between gap-7">
        <div className="min-w-0 max-w-4xl">
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.28em] font-black text-white/70">
              {eyebrow}
            </p>
          )}

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight mt-3">
            {title}
          </h1>

          {description && (
            <p className="text-zinc-200 mt-4 leading-7 max-w-3xl">
              {description}
            </p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="rounded-full bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="relative flex flex-wrap gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}