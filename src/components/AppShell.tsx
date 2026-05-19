"use client";

import Link from "next/link";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  canCreate,
  canViewAdmin,
  getCurrentUser,
  getRoleLabel,
} from "../lib/permissions";

import {
  getAppSettings,
} from "../lib/appSettingsStorage";

import type {
  AppSettings,
} from "../lib/appSettingsStorage";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  const [mounted, setMounted] =
    useState(false);

  const [settings, setSettings] =
    useState<AppSettings | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    loadSettings();

    function handleSettingsUpdated() {
      loadSettings();
    }

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

  function loadSettings() {
    setSettings(
      getAppSettings()
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-100" />
    );
  }

  const user =
    getCurrentUser();

  const appName =
    settings?.appName ||
    "DMS Intranet";

  const companyName =
    settings?.companyName ||
    "Intern";

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: "🏠",
      show: true,
    },
    {
      href: "/wiki",
      label: "Wiki",
      icon: "📚",
      show: true,
    },
    {
      href: "/tickets",
      label: "Tickets",
      icon: "🎫",
      show: true,
    },
    {
      href: "/tickets/templates",
      label: "Ticket-Vorlagen",
      icon: "🧩",
      show: true,
    },
    {
      href: "/activity",
      label: "Aktivitäten",
      icon: "📌",
      show: true,
    },
    {
      href: "/settings",
      label: "Einstellungen",
      icon: "⚙️",
      show: true,
    },
    {
      href: "/setup",
      label: "Benutzer Setup",
      icon: "👤",
      show: true,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: "🛡️",
      show: canViewAdmin(),
    },
  ];

  const visibleNavItems =
    navItems.filter(
      (item) =>
        item.show
    );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* MOBILE HEADER */}
      <header className="lg:hidden sticky top-0 z-40 bg-zinc-950 text-white border-b border-zinc-800 px-4 py-4 app-topbar">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="min-w-0"
          >
            <p className="font-bold truncate text-white">
              {appName}
            </p>

            <p className="text-xs text-zinc-400 truncate">
              {companyName}
            </p>
          </Link>

          <button
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="bg-white text-zinc-950 px-4 py-2 rounded-xl hover:bg-zinc-200 transition"
          >
            Menü
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="grid gap-2 mt-4">
            {visibleNavItems.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl hover:bg-zinc-800 transition text-zinc-100"
                >
                  <span>
                    {item.icon}
                  </span>

                  <span className="font-medium">
                    {item.label}
                  </span>
                </Link>
              )
            )}
          </nav>
        )}
      </header>

      <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex lg:flex-col bg-zinc-950 text-white border-r border-zinc-800 min-h-screen sticky top-0 app-sidebar">
          <div className="p-6 border-b border-zinc-800">
            <Link href="/">
              <h1 className="text-2xl font-bold text-white">
                {appName}
              </h1>

              <p className="text-sm text-zinc-400 mt-1">
                {companyName}
              </p>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {visibleNavItems.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                >
                  <span className="w-6 text-center">
                    {item.icon}
                  </span>

                  <span className="font-medium">
                    {item.label}
                  </span>
                </Link>
              )
            )}
          </nav>

          <div className="p-4 border-t border-zinc-800 space-y-3">
            {canCreate() && (
              <div className="grid gap-2">
                <Link
                  href="/wiki/create"
                  className="bg-white text-zinc-950 px-4 py-3 rounded-2xl hover:bg-zinc-200 transition text-center font-medium"
                >
                  Dokument erstellen
                </Link>

                <Link
                  href="/tickets"
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-4 py-3 rounded-2xl hover:bg-zinc-800 transition text-center"
                >
                  Ticket erstellen
                </Link>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-sm text-zinc-400">
                Angemeldet als
              </p>

              <p className="font-semibold mt-1 truncate text-white">
                {user?.name || "Unbekannt"}
              </p>

              <p className="text-sm text-zinc-400 mt-1 truncate">
                {user?.email || "Keine E-Mail"}
              </p>

              <p className="text-xs bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full inline-flex mt-3">
                {getRoleLabel(
                  user?.role || "viewer"
                )}
              </p>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 px-6 py-8 md:px-10 app-content">
          {children}
        </main>
      </div>
    </div>
  );
}