import MainLayout from ".//components/layout/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-zinc-500 mt-2">
            Willkommen im Firmen Intranet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Offene Tickets
            </h2>

            <p className="text-4xl font-bold mt-4">
              12
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Dokumente
            </h2>

            <p className="text-4xl font-bold mt-4">
              248
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Benutzer
            </h2>

            <p className="text-4xl font-bold mt-4">
              36
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}