"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../lib/currentUserRepository";
import type { User } from "../types/user";
import { useAppSettings } from "../hooks/useAppSettings";
import Topbar from "./layout/Topbar";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  editorOnly?: boolean;
  feature?: "ticketTemplates" | "activityLog";
};

const mainNavItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    href: "/news",
    label: "News",
    icon: "◎",
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
    href: "/files",
    label: "Dateien",
    icon: "▣",
  },
];

const managementNavItems: NavItem[] = [
  {
    href: "/activity",
    label: "Aktivitäten",
    icon: "≡",
    editorOnly: true,
    feature: "activityLog",
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
    icon: "⚙",
  },
  {
    href: "/admin",
    label: "Admin",
    icon: "◎",
    adminOnly: true,
  },
];

function isPublicPath(pathname: string) {
  return pathname === "/login";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/tickets") {
    return (
      pathname === "/tickets" ||
      (pathname.startsWith("/tickets/") &&
        !pathname.startsWith("/tickets/templates"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function canShowItem(item: NavItem, user: User | null, settings: any) {
  if (item.adminOnly && user?.role !== "admin") {
    return false;
  }

  if (item.editorOnly && user?.role !== "admin" && user?.role !== "editor") {
    return false;
  }

  if (item.feature === "ticketTemplates" && !settings.enableTicketTemplates) {
    return false;
  }

  if (item.feature === "activityLog" && !settings.enableActivityLog) {
    return false;
  }

  return true;
}

function getNavLinkClass(active: boolean) {
  if (active) {
    return "group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-zinc-950 shadow-sm";
  }

  return "group flex items-center gap-3 rounded-2xl px-4 py-3 text-zinc-400 transition hover:bg-white/10 hover:text-white";
}

function getIconClass(active: boolean) {
  if (active) {
    return "flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm text-white";
  }

  return "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm text-zinc-300 transition group-hover:bg-white/15 group-hover:text-white";
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
    <section className="space-y-2">
      <p className="px-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={getNavLinkClass(active)}
            >
              <span className={getIconClass(active)}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { settings, loading: settingsLoading } = useAppSettings();

  const [user, setUser] = useState<User | null>(getCachedCurrentUser());
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setUserLoading(false);
      return;
    }

    void ensureUser();

    function handleCurrentUserUpdated() {
      setUser(getCachedCurrentUser());
    }

    window.addEventListener("currentUserUpdated", handleCurrentUserUpdated);

    return () => {
      window.removeEventListener("currentUserUpdated", handleCurrentUserUpdated);
    };
  }, [pathname]);

  async function ensureUser() {
    try {
      setUserLoading(true);

      const nextUser = await loadCurrentUser();

      setUser(nextUser);

      if (!nextUser) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Benutzer konnte nicht geladen werden:", error);
      setUser(null);
      router.push("/login");
    } finally {
      setUserLoading(false);
    }
  }

  const visibleMainItems = useMemo(
    () => mainNavItems.filter((item) => canShowItem(item, user, settings)),
    [user, settings]
  );

  const visibleManagementItems = useMemo(
    () => managementNavItems.filter((item) => canShowItem(item, user, settings)),
    [user, settings]
  );

  const visibleSystemItems = useMemo(
    () => systemNavItems.filter((item) => canShowItem(item, user, settings)),
    [user, settings]
  );

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (userLoading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-500">
        Anwendung wird geladen...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-950">
            Nicht angemeldet
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Bitte melde dich an, um fortzufahren.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  const sidebarPosition = settings.sidebarPosition || "left";
  const companyName = settings.companyName || "Intern";
  const appName = settings.appName || "Intranet";
  const appVersion = settings.appVersion || settings.version || "0.1.0";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside
        className={`fixed inset-y-0 z-40 hidden w-72 flex-col bg-zinc-950 text-white lg:flex ${
          sidebarPosition === "right" ? "right-0" : "left-0"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <Link
            href="/"
            className="mb-8 block rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <p className="text-sm text-zinc-400">{companyName}</p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {appName}
            </h1>
          </Link>

          <div className="sidebar-scroll flex-1 space-y-7 overflow-y-auto pr-1 pb-2">
            <NavSection
              title="Hauptmenü"
              items={visibleMainItems}
              pathname={pathname}
            />

            <NavSection
              title="Verwaltung"
              items={visibleManagementItems}
              pathname={pathname}
            />

            <NavSection
              title="System"
              items={visibleSystemItems}
              pathname={pathname}
            />
          </div>

          {settings.showVersion && (
            <div className="mt-6 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Version
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-300">
                {appVersion}
              </p>
            </div>
          )}
        </div>
      </aside>

      <div
        className={
          sidebarPosition === "right"
            ? "min-h-screen lg:mr-72"
            : "min-h-screen lg:ml-72"
        }
      >
        <Topbar
          user={user}
          appName={appName}
          companyName={companyName}
          sidebarPosition={sidebarPosition}
        />

        <main
          className={`app-page-content mx-auto w-full max-w-7xl px-4 py-6 md:px-8 ${
            settings.compactMode ? "space-y-4" : "space-y-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}