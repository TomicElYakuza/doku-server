import WikiSidebar from "../components/wiki/WikiSidebar";

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-6">
      <WikiSidebar />

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}