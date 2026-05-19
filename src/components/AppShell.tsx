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
    icon: "◇",
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
  {
    href: "/admin/database",
    label: "Datenbank",
    icon: "◍",
    adminOnly: true,
  },
  {
    href: "/admin/notifications",
    label: "Benachrichtigungen",
    icon: "●",
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
    return "group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-zinc-950 shadow-sm ring-1 ring-white/10";
  }

  return "group flex items-center gap-3 rounded-2xl px-4 py-3 text-zinc-400 hover:bg-white/10 hover:text-white transition";
}

function getIconClass(
  active: boolean
) {
  if (active) {
    return "flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white text-sm";
  }

  return "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-zinc-300 text-sm group-hover:bg-white/15 group-hover:text-white transition";
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
    <section>
      <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
        {title}
      </p>

      <div className="space-y-1.5">
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

                <span className="font-medium text-sm">
                  {item.label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </section>
  );
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const {
    mounted,
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
    <aside className="w-72 shrink-0 h-screen overflow-hidden flex flex-col bg-[#070A18] text-white border-r border-white/10">
      <div className="shrink-0 px-5 py-5 border-b border-white/10">
        <Link
          href="/"
          className="block rounded-3xl px-3 py-2 hover:bg-white/5 transition"
        >
          <p className="text-xl font-black tracking-tight">
            Intranet
          </p>

          <p className="text-xs text-zinc-500 mt-1">
            {companyName || "Intern"}
          </p>
        </Link>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sidebar-scroll">
        <div className="space-y-7 pb-4">
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

      <div className="shrink-0 border-t border-white/10 px-5 py-4">
        {showVersion && (
          <p className="text-xs text-zinc-500">
            Version {appVersion}
          </p>
        )}
      </div>
    </aside>
  );

  const topbar = (
    <header className="h-20 shrink-0 bg-white/90 dark:bg-[#070A18]/95 backdrop-blur border-b border-zinc-200 dark:border-white/10 px-8 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
          {companyName || "Intern"}
        </p>

        <h1 className="truncate text-xl font-black tracking-tight text-zinc-950 dark:text-white">
          Intranet
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold text-zinc-950 dark:text-white">
            {user?.name || "Unbekannt"}
          </p>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {getRoleLabel(
              user?.role
            )}
            {user?.department
              ? ` · ${user.department}`
              : ""}
          </p>
        </div>

        <div className="h-11 w-11 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-sm">
          {(user?.name || "U")
            .slice(0, 1)
            .toUpperCase()}
        </div>
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
            className={`flex-1 overflow-y-auto bg-zinc-100 ${
              compactMode
                ? "p-5"
                : "p-8"
            }`}
          >
            <div className="app-page-content w-full max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}