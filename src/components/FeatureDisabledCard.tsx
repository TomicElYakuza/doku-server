"use client";

import Link from "next/link";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import AppIdentity from "./AppIdentity";

import AppVersion from "./AppVersion";

import FeatureLink from "./FeatureLink";

import {
  canViewActivity,
  canViewAdmin,
  getCurrentUser,
} from "../lib/permissions";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

type AppShellProps = {
  children: ReactNode;
};

type ShellUser = {
  name?: string;
  email?: string;
  role?: string;
  company?: string;
  department?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const mainNavItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    href: "/wiki",
    label: "Wiki",
    icon: "◫",
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: "◆",
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Admin",
    icon: "⚙",
  },
  {
    href: "/admin/users",
    label: "Benutzer",
    icon: "◉",
  },
  {
    href: "/admin/companies",
    label: "Firmen",
    icon: "▦",
  },
  {
    href: "/admin/storage",
    label: "Speicher",
    icon: "▣",
  },
];

function getRoleLabel(
  role?: string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  if (role === "viewer") {
    return "Leser";
  }

  return "Unbekannt";
}

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function navLinkClass(
  pathname: string,
  href: string
) {
  const active =
    isActivePath(
      pathname,
      href
    );

  if (active) {
    return "flex items-center gap-3 px-4 py-3 rounded-2xl bg-white text-zinc-950 font-semibold shadow-sm";
  }

  return "flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-300 hover:bg-zinc-800 hover:text-white transition";
}

function renderNavLink(
  item: NavItem,
  pathname: string
) {
  return (
    <Link
      key={item.href}
      href={item.href}
      className={navLinkClass(
        pathname,
        item.href
      )}
    >
      <span className="w-6 h-6 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs">
        {item.icon}
      </span>

      <span>
        {item.label}
      </span>
    </Link>
  );
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const {
    mounted,
    appName,
    companyName,
    sidebarPosition,
    compactMode,
    enableTicketTemplates,
    enableActivityLog,
  } = useAppSettings();

  const [user, setUser] =
    useState<ShellUser | null>(null);

  useEffect(() => {
    const currentUser =
      getCurrentUser() as ShellUser | null;

    setUser(
      currentUser
    );

    function handleUserUpdated() {
      const nextUser =
        getCurrentUser() as ShellUser | null;

      setUser(
        nextUser
      );
    }

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    window.addEventListener(
      "adminUsersUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );

      window.removeEventListener(
        "adminUsersUpdated",
        handleUserUpdated
      );
    };
  }, []);

  const sidebar =
    (
      <aside className="w-72 shrink-0 bg-zinc-950 text-white h-screen overflow-hidden flex flex-col border-r border-zinc-900">
        <div className="p-6 border-b border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black text-lg">
              D
            </div>

            <AppIdentity
              titleClassName="font-bold leading-tight"
              subtitleClassName="text-xs text-zinc-400 mt-1"
            />
          </Link>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-4 py-5">
          <div className="space-y-2">
            {mainNavItems.map(
              (item) =>
                renderNavLink(
                  item,
                  pathname
                )
            )}

            <FeatureLink
              feature="ticketTemplates"
              href="/tickets/templates"
              className={navLinkClass(
                pathname,
                "/tickets/templates"
              )}
            >
              <span className="w-6 h-6 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs">
                ◈
              </span>

              <span>
                Ticket-Vorlagen
              </span>
            </FeatureLink>

            {canViewActivity() && (
              <FeatureLink
                feature="activityLog"
                href="/activity"
                className={navLinkClass(
                  pathname,
                  "/activity"
                )}
              >
                <span className="w-6 h-6 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs">
                  ≡
                </span>

                <span>
                  Aktivitäten
                </span>
              </FeatureLink>
            )}
          </div>

          {canViewAdmin() && (
            <div className="mt-8">
              <p className="px-4 text-xs uppercase tracking-widest text-zinc-500 mb-3">
                Verwaltung
              </p>

              <div className="space-y-2">
                {adminNavItems.map(
                  (item) =>
                    renderNavLink(
                      item,
                      pathname
                    )
                )}
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="px-4 text-xs uppercase tracking-widest text-zinc-500 mb-3">
              System
            </p>

            <div className="space-y-2">
              <Link
                href="/settings"
                className={navLinkClass(
                  pathname,
                  "/settings"
                )}
              >
                <span className="w-6 h-6 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs">
                  ⚙
                </span>

                <span>
                  Einstellungen
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-900 rounded-3xl p-4">
            <p className="text-xs text-zinc-500">
              Angemeldet als
            </p>

            <p className="font-semibold mt-1 truncate">
              {user?.name ||
                "Unbekannt"}
            </p>

            <p className="text-xs text-zinc-400 mt-1 truncate">
              {getRoleLabel(
                user?.role
              )}
            </p>

            {(user?.company ||
              user?.department) && (
              <p className="text-xs text-zinc-500 mt-2 truncate">
                {user.company ||
                  companyName}
                {user.department
                  ? ` · ${user.department}`
                  : ""}
              </p>
            )}
          </div>

          <AppVersion className="text-xs text-zinc-500 mt-4 px-2" />
        </div>
      </aside>
    );

  const topbar =
    (
      <header className="h-20 shrink-0 bg-zinc-950 text-white border-b border-zinc-900 px-8 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {companyName}
          </p>

          <h1 className="font-bold truncate">
            {appName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {enableTicketTemplates && (
            <Link
              href="/tickets/templates"
              className="hidden md:inline-flex bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-2xl hover:bg-zinc-800 transition"
            >
              Vorlagen
            </Link>
          )}

          {enableActivityLog &&
            canViewActivity() && (
              <Link
                href="/activity"
                className="hidden md:inline-flex bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-2xl hover:bg-zinc-800 transition"
              >
                Aktivitäten
              </Link>
            )}

          <Link
            href="/tickets"
            className="bg-white text-zinc-950 px-4 py-2 rounded-2xl hover:bg-zinc-200 transition"
          >
            Ticket erstellen
          </Link>
        </div>
      </header>
    );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-100" />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-zinc-100 text-zinc-950">
      <div
        className={`h-full flex ${
          sidebarPosition === "right"
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        {sidebar}

        <div className="flex-1 min-w-0 h-screen overflow-hidden flex flex-col">
          {topbar}

          <main
            className={`flex-1 overflow-y-auto ${
              compactMode
                ? "p-5"
                : "p-8"
            }`}
          >
            <div className="w-full max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}