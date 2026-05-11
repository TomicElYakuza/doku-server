"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { wikiPages } from "@/data/wiki";

export default function WikiSidebar() {
  const pathname = usePathname();

  const categories = [
    ...new Set(
      wikiPages.map((page) => page.category)
    ),
  ];

  return (
    <aside className="w-72 bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6 h-fit">
      <h2 className="text-xl font-bold mb-6">
        Wiki
      </h2>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
              {category}
            </h3>

            <div className="flex flex-col gap-1">
              {wikiPages
                .filter(
                  (page) =>
                    page.category === category
                )
                .map((page) => (
                  <Link
                    key={page.slug}
                    href={`/wiki/${page.slug}`}
                    className={`p-3 rounded-xl transition ${
                      pathname ===
                      `/wiki/${page.slug}`
                        ? "bg-zinc-900 text-white"
                        : "hover:bg-zinc-100"
                    }`}
                  >
                    {page.title}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}