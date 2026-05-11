import { notFound } from "next/navigation";
import { wikiPages } from "@/data/wiki";
import ReactMarkdown from "react-markdown";

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
    return notFound();
  }

  return (
    <div className="max-w-4xl">
      <p className="text-sm text-zinc-500 mb-2">
        {page.category}
      </p>

      <h1 className="text-4xl font-bold mb-8">
        {page.title}
      </h1>

      <div className="prose prose-zinc max-w-none">
        <ReactMarkdown>
          {page.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}