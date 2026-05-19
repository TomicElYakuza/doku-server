import type {
  Metadata,
} from "next";

import "./globals.css";

import AppThemeProvider from "../components/AppThemeProvider";

import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "DMS Intranet",
  description:
    "DMS, Ticket-System und Firmen-Intranet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">
        <AppThemeProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppThemeProvider>
      </body>
    </html>
  );
}