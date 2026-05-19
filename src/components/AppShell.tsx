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
  adminOnly?: boolean;
  activityOnly?: boolean;
  feature?: "ticketTemplates" | "activityLog";
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
  {
    href: "/tickets/templates",
    label: "Ticket-Vorlagen",
    icon: "◈",
    feature: "ticketTemplates",
  },
  {
    href: "/activity",
    label: "Aktivitäten",
    icon: "≡",
    activityOnly: true,
    feature: "activityLog",
  },
];

const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Admin",
    icon: "⚙",
    adminOnly: true,
  },
  {
    href: "/admin/users",
    label: "Benutzer",
    icon: "◉",
    adminOnly: true,
  },
  {
    href: "/admin/companies",
    label: "Firmen",
    icon: "▦",
    adminOnly: true,
  },
  {
    href: "/admin/storage",
    label: "Speicher",
    icon: "▣",
    adminOnly: true,
  },
  {
    href: "/admin/adapters",
    label: "Adapter",
    icon: "⇄",
    adminOnly: true,
  },
];

const systemNavItems: NavItem[] = [
  {
    href: "/settings",
    label: "Einstellungen",
    icon: "◎",
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

function getNavLinkClass(
  active: boolean
) {
  if (active) {
    return "flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-zinc-950 shadow-sm";
  }

  return "flex items-center gap-3 rounded-2xl px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white transition";
}

function getIconClass(
  active: boolean
) {
  if (active) {
    return "flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white text-sm";
  }

  return "flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 text-sm";
}

function getVisibleItems(
  items: NavItem[],
  enableTicketTemplates: boolean,
  enableActivityLog: boolean
) {
  return items.filter(
    (item) => {
      if (
        item.adminOnly &&
        !canViewAdmin()
      ) {
        return false;
      }

      if (
        item.activityOnly &&
        !canViewActivity()
      ) {
        return false;
      }

      if (
        item.feature === "ticketTemplates" &&
        !enableTicketTemplates
      ) {
        return false;
      }

      if (
        item.feature === "activityLog" &&
        !enableActivityLog
      ) {
        return false;
      }

      return true;
    }
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="px-4 text-xs uppercase tracking-widest text-zinc-500 mb-3">
        {title}
      </p>

      <div className="space-y-2">
        {items.map(
          (item) => {
            const active =
              isActivePath(
                pathname,
                item.href
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={getNavLinkClass(
                  active
                )}
              >
                <span className={getIconClass(active)}>
                  {item.icon}
                </span>

                <span className="font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </div>
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
    appVersion,
    showVersion,
    compactMode,
    sidebarPosition,
    enableTicketTemplates,
    enableActivityLog,
  } = useAppSettings();

  const [user, setUser] =
    useState<ShellUser | null>(null);

  useEffect(() => {
    setUser(
      getCurrentUser() as ShellUser | null
    );

    function handleUserUpdated() {
      setUser(
        getCurrentUser() as ShellUser | null
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-100" />
    );
  }

  const visibleMainItems =
    getVisibleItems(
      mainNavItems,
      enableTicketTemplates,
      enableActivityLog
    );

  const visibleAdminItems =
    getVisibleItems(
      adminNavItems,
      enableTicketTemplates,
      enableActivityLog
    );

  const visibleSystemItems =
    getVisibleItems(
      systemNavItems,
      enableTicketTemplates,
      enableActivityLog
    );

  const sidebar = (
    <aside className="w-72 shrink-0 bg-zinc-950 text-white h-screen overflow-hidden flex flex-col">
      <div className="shrink-0 p-6 border-b border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-zinc-950">
            D
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">
              {appName}
            </p>

            <p className="truncate text-xs text-zinc-400 mt-1">
              {companyName}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 overflow-hidden p-4">
        <div className="space-y-8">
          <NavSection
            title="Hauptmenü"
            items={visibleMainItems}
            pathname={pathname}
          />

          <NavSection
            title="Verwaltung"
            items={visibleAdminItems}
            pathname={pathname}
          />

          <NavSection
            title="System"
            items={visibleSystemItems}
            pathname={pathname}
          />
        </div>
      </nav>

      <div className="shrink-0 p-4 border-t border-zinc-800">
        <div className="rounded-3xl bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">
            Angemeldet als
          </p>

          <p className="mt-1 truncate font-semibold text-white">
            {user?.name ||
              "Unbekannt"}
          </p>

          <p className="mt-1 truncate text-xs text-zinc-400">
            {getRoleLabel(
              user?.role
            )}
          </p>

          {(user?.company ||
            user?.department) && (
            <p className="mt-2 truncate text-xs text-zinc-500">
              {user.company ||
                companyName}
              {user.department
                ? ` · ${user.department}`
                : ""}
            </p>
          )}
        </div>

        {showVersion && (
          <p className="px-2 pt-4 text-xs text-zinc-500">
            Version {appVersion}
          </p>
        )}
      </div>
    </aside>
  );

  const topbar = (
    <header className="h-20 shrink-0 bg-zinc-950 text-white border-b border-zinc-900 px-8 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm text-zinc-400">
          {companyName}
        </p>

        <h1 className="truncate text-lg font-bold">
          {appName}
        </h1>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <p className="text-sm text-zinc-500">
          {user?.name || "Unbekannt"}
        </p>
      </div>
    </header>
  );

  return (
    <div className="h-screen overflow-hidden bg-zinc-100 text-zinc-950">
      <div
        className={`flex h-full ${
          sidebarPosition === "right"
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        {sidebar}

        <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
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