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
    <section className="bg-zinc-900 text-white rounded-3xl p-8 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-zinc-300">
              {eyebrow}
            </p>
          )}

          <h1 className="text-4xl font-bold mt-2">
            {title}
          </h1>

          {description && (
            <p className="text-zinc-300 mt-3 max-w-3xl">
              {description}
            </p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-6">
              {badges.map(
                (badge) => (
                  <span
                    key={badge.label}
                    className="bg-white/10 text-white px-4 py-2 rounded-full text-sm"
                  >
                    {badge.label}
                  </span>
                )
              )}
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