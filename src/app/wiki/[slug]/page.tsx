import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { wikiPages } from "../../../data/wiki";

export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = wikiPages.find(
    (page) => page.slug === slug
  );

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">
          Wiki / {page.category}
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <span className="inline-block bg-zinc-100 text-zinc-700 text-sm px-3 py-1 rounded-full mb-4">
              {page.category}
            </span>

            <h1 className="text-5xl font-bold">
              {page.title}
            </h1>

            <p className="text-zinc-600 mt-4 text-lg">
              {page.description}
            </p>
          </div>

          <button className="bg-zinc-900 text-white px-5 py-3 rounded-xl hover:bg-zinc-700 transition">
            Bearbeiten
          </button>
        </div>

        <div className="flex items-center gap-6 text-sm text-zinc-500 border-b pb-6 mb-10">
          <p>
            Autor: {page.author}
          </p>

          <p>
            Zuletzt aktualisiert: {page.updatedAt}
          </p>
        </div>

        <article className="prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700 prose-li:text-zinc-700">
          <ReactMarkdown>
            {page.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}