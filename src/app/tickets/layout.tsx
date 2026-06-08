import TicketsSidebar from "../../components/tickets/TicketsSidebar";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 2xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <TicketsSidebar />

        <div className="min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
