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
    <section className="relative overflow-hidden rounded-[2rem] app-accent-bg text-white p-7 xl:p-10 shadow-sm">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%)]" />

      <div className="relative flex flex-col 2xl:flex-row 2xl:items-end 2xl:justify-between gap-8">
        <div className="max-w-6xl">
          {eyebrow && (
            <p className="inline-flex rounded-full bg-white/15 border border-white/15 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-white/80">
              {eyebrow}
            </p>
          )}

          <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.075em] leading-[0.95] mt-5">
            {title}
          </h1>

          {description && (
            <p className="text-white/72 leading-8 text-lg max-w-4xl mt-5">
              {description}
            </p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className="bg-white/15 border border-white/15 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}