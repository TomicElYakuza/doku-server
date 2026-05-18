import type {
  Metadata,
} from "next";

import "./globals.css";

import Sidebar from "../components/layout/Sidebar";

import Topbar from "../components/layout/Topbar";

export const metadata: Metadata = {
  title: "Doku Server",
  description:
    "Intranet, Wiki und Wissensbasis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <div className="h-screen bg-zinc-100 flex overflow-hidden">
          <Sidebar />

          <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
            <Topbar />

            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}