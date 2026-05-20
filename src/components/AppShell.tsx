"use client";

import Link from "next/link";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  canViewActivity,
  canViewAdmin,
  getCurrentUser,
} from "../lib/permissions";

import {
  clearUser,
} from "../lib/userStorage";

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
    label: "News",
    icon: "◌",
  },
  {
    href: "/dashboard",
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

  return "Nicht angemeldet";
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
    pathname.startsWith(
      `${href}/`
    )
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

  const router =
    useRouter();

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

  function handleLogout() {
    clearUser();

    setUser(
      null
    );

    router.push(
      "/login"
    );
  }

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
      <div className="min-w-0 flex items-center gap-4">
        <div className="h-11 w-11 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-sm">
          {(user?.name || "U")
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Angemeldet als
          </p>

          <h1 className="truncate text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            {user?.name || "Nicht angemeldet"}
          </h1>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {getRoleLabel(
              user?.role
            )}
            {user?.department
              ? ` · ${user.department}`
              : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-2xl hover:bg-zinc-100 transition dark:bg-white/10 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/15"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex bg-zinc-900 text-white px-4 py-2 rounded-2xl hover:bg-zinc-700 transition dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Login
          </Link>
        )}
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