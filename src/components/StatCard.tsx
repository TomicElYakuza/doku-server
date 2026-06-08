import {
  ReactNode,
} from "react";

type StatCardTone =
  | "default"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "indigo";

type StatCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  active?: boolean;
  onClick?: () => void;
};

function getToneClass(tone: StatCardTone) {
  if (tone === "blue") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (tone === "green") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (tone === "orange") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (tone === "red") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (tone === "purple") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (tone === "indigo") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "app-accent-soft app-accent-text app-accent-border";
}

function getCardClass(active?: boolean, clickable?: boolean) {
  const base =
    "group relative overflow-hidden bg-white border rounded-3xl p-6 shadow-sm transition text-left w-full";

  if (active) {
    return `${base} app-accent-border ring-4 ring-[var(--app-accent-ring)]`;
  }

  if (clickable) {
    return `${base} border-zinc-200 hover:border-indigo-200 hover:shadow-md cursor-pointer`;
  }

  return `${base} border-zinc-200`;
}

export default function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  active = false,
  onClick,
}: StatCardProps) {
  const clickable = Boolean(onClick);
  const Wrapper = clickable ? "button" : "div";

  return (
    <Wrapper
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={getCardClass(active, clickable)}
    >
      <div className="absolute inset-x-0 top-0 h-1 app-accent-bg" />
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full app-accent-bg opacity-10 blur-3xl group-hover:opacity-20 transition" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500 font-bold">
            {label}
          </p>

          <div className="text-3xl font-black tracking-[-0.04em] text-zinc-950 mt-2 truncate">
            {value}
          </div>

          {description && (
            <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`h-12 w-12 rounded-2xl border flex items-center justify-center text-xl font-black shrink-0 ${getToneClass(
              tone,
            )}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

