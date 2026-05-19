import type {
  Metadata,
} from "next";

import "./globals.css";

import AppShell from "../components/AppShell";

import AppThemeProvider from "../components/AppThemeProvider";

import NotificationCenter from "../components/NotificationCenter";

export const metadata: Metadata = {
  title:
    "DMS Intranet",

  description:
    "DMS, Ticket und Intranet App",
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
      <body className="min-h-screen">
        <AppThemeProvider>
          <AppShell>
            {children}
          </AppShell>

          <NotificationCenter />
        </AppThemeProvider>
      </body>
    </html>
  );
}