"use client";

import Link from "next/link";

import { useParams } from "next/navigation";

import { wikiPages } from "@/data/wiki";

export default function DepartmentPage() {
  const params = useParams();

  const department =
    params.department as string;

  const storedPages =
    typeof window !== "undefined"
      ? JSON.parse(
          localStorage.getItem("wiki-pages") ||
            "[]"
        )
      : [];

  const allPages =
    storedPages.length > 0
      ? storedPages
      : wikiPages;

  const filteredPages =
    allPages.filter(
      (page: any) =>
        page.category === department
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-zinc-500">
          Abteilung
        </p>

        <h1 className="text-4xl font-bold mt-2">
          {department}
        </h1>

        <p className="text-zinc-500 mt-3">
          {filteredPages.length} Dokumente
        </p>
      </div>

      <div className="grid gap-4">
        {filteredPages.map(
          (page: any) => (
            <Link
              key={page.slug}
              href={`/wiki/${page.slug}`}
              className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 transition"
            >
              <p className="text-sm text-zinc-500">
                {page.category}
              </p>

              <h2 className="text-xl font-semibold mt-2">
                {page.title}
              </h2>

              <p className="text-zinc-600 mt-2">
                {page.description}
              </p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}