type Props = {
  content: string;
};

export default function TableOfContents({
  content,
}: Props) {
  const headings = content
    .split("\n")
    .filter(
      (line) =>
        line.startsWith("# ") ||
        line.startsWith("## ")
    );

  return (
    <aside className="w-72">
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sticky top-6">
        <h3 className="font-bold mb-4">
          Inhalt
        </h3>

        <div className="flex flex-col gap-3">
          {headings.map((heading, index) => {
            const level = heading.startsWith("## ")
              ? 2
              : 1;

            const text = heading
              .replace(/^#+ /, "")
              .trim();

            return (
              <div
                key={index}
                className={`text-sm ${
                  level === 2
                    ? "ml-4 text-zinc-500"
                    : "font-medium"
                }`}
              >
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}