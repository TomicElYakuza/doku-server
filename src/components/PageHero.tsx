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
    <section className="relative overflow-hidden rounded-[2rem] app-accent-bg text-white p-8 md:p-10 app-brand-shadow">
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-1 bg-white/25" />

      <div className="relative flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
        <div className="min-w-0 max-w-5xl">
          {eyebrow && (
            <p className="text-sm uppercase tracking-[0.22em] text-white/60 font-black">
              {eyebrow}
            </p>
          )}

          <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-[-0.055em] mt-4 leading-[0.95]">
            {title}
          </h1>

          {description && (
            <p className="text-white/72 text-lg leading-8 mt-5 max-w-4xl">
              {description}
            </p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-7">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/80 font-bold backdrop-blur"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap xl:justify-end gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

