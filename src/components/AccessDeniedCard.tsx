"use client";

import {
  useEffect,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

type AccessDeniedCardProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function AccessDeniedCard({
  title = "Zugriff verweigert",
  description = "Du hast keine Berechtigung für diesen Bereich.",
  backHref = "/forbidden",
  backLabel = "Zur Fehlerseite",
}: AccessDeniedCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname !== "/forbidden" &&
      pathname !== "/unauthorized"
    ) {
      router.replace(backHref || "/forbidden");
    }
  }, [
    router,
    pathname,
    backHref,
  ]);

  return (
    <div className="app-surface rounded-3xl p-8">
      <div className="flex flex-col items-center justify-center text-center min-h-[260px]">
        <div className="w-14 h-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl font-black mb-5">
          403
        </div>

        <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-600 mb-3">
          Zugriff verweigert
        </p>

        <h1 className="text-3xl font-black text-zinc-950">
          {title}
        </h1>

        <p className="text-zinc-500 mt-3 max-w-xl leading-relaxed">
          {description}
        </p>

        <p className="text-sm text-zinc-400 mt-6">
          Weiterleitung zu {backLabel || "Forbidden"}...
        </p>
      </div>
    </div>
  );
}
