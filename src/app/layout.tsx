import type {
  Metadata,
} from "next";

import {
  Inter,
} from "next/font/google";

import "./globals.css";

import AppShell from "../components/AppShell";

import AppThemeProvider from "../components/AppThemeProvider";

const inter =
  Inter({
    subsets: [
      "latin",
    ],
  });

export const metadata: Metadata = {
  title:
    "Doku Server",

  description:
    "DMS, Ticket und Intranet System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AppThemeProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppThemeProvider>
      </body>
    </html>
  );
}

