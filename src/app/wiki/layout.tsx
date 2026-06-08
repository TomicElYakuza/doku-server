import WikiSidebar from "../../components/wiki/WikiSidebar";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 2xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <WikiSidebar />

        <div className="min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
