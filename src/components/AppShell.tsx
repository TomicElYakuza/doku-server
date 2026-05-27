"use client";

import Link from "next/link";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCachedCurrentUser,
  loadCurrentUser,
} from "../lib/currentUserRepository";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

import {
  usePermissions,
} from "../hooks/usePermissions";

import {
  useUserSettings,
} from "../hooks/useUserSettings";

import type {
  User,
} from "../types/user";

type AppShellProps = {
  children: ReactNode;
};

type NavigationCategory =
  | "overview"
  | "management"
  | "admin"
  | "settings";

type NavigationItem = {
  href: string;
  label: string;
  icon: string;
  category: NavigationCategory;
  adminOnly?: boolean;
  permissionAny?: string[];
};

const navigationItems: NavigationItem[] = [
  {
    href:
      "/dashboard",

    label:
      "Dashboard",

    icon:
      "🏠",

    category:
      "overview",

    permissionAny: [
      "dashboard.view",
      "tickets.view",
      "wiki.view",
      "news.view",
    ],
  },
  {
    href:
      "/news",

    label:
      "News",

    icon:
      "📰",

    category:
      "overview",

    permissionAny: [
      "news.view",
      "news.manage",
    ],
  },
  {
    href:
      "/wiki",

    label:
      "Wiki",

    icon:
      "📚",

    category:
      "management",

    permissionAny: [
      "wiki.view",
      "wiki.manage",
    ],
  },
  {
    href:
      "/files",

    label:
      "Dateien",

    icon:
      "📎",

    category:
      "management",

    permissionAny: [
      "files.view",
      "files.manage",
    ],
  },
  {
    href:
      "/tickets",

    label:
      "Tickets",

    icon:
      "🎫",

    category:
      "management",

    permissionAny: [
      "tickets.view",
      "tickets.manage",
    ],
  },
  {
    href:
      "/admin",

    label:
      "Admin Dashboard",

    icon:
      "🛡️",

    category:
      "admin",

    adminOnly:
      true,
  },
  {
    href:
      "/admin/settings",

    label:
      "Systemeinstellungen",

    icon:
      "⚙️",

    category:
      "settings",

    adminOnly:
      true,
  },
];

const categoryLabels: Record<NavigationCategory, string> = {
  overview:
    "Übersicht",

  management:
    "Verwaltung",

  admin:
    "Adminbereich",

  settings:
    "Einstellungen",
};

const categoryOrder: NavigationCategory[] = [
  "overview",
  "management",
  "admin",
  "settings",
];

function isPublicPath(
  pathname: string
) {
  return pathname === "/login";
}

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function getRoleLabel(
  role?: string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

function getPageTitle(
  pathname: string
) {
  if (pathname.startsWith("/admin/settings")) {
    return "Systemeinstellungen";
  }

  if (pathname.startsWith("/admin/users")) {
    return "Benutzerverwaltung";
  }

  if (pathname.startsWith("/admin/permissions")) {
    return "Berechtigungen";
  }

  if (pathname.startsWith("/admin/companies")) {
    return "Firmen & Abteilungen";
  }

  if (pathname.startsWith("/admin/news")) {
    return "News-Verwaltung";
  }

  if (pathname.startsWith("/admin")) {
    return "Admin Backend";
  }

  if (pathname.startsWith("/tickets/templates")) {
    return "Ticket-Vorlagen";
  }

  if (pathname.startsWith("/tickets")) {
    return "Tickets";
  }

  if (pathname.startsWith("/wiki")) {
    return "Wiki";
  }

  if (pathname.startsWith("/news")) {
    return "News";
  }

  if (pathname.startsWith("/files")) {
    return "Dateien";
  }

  if (pathname.startsWith("/activity")) {
    return "Aktivität";
  }

  if (pathname.startsWith("/settings")) {
    return "Einstellungen";
  }

  return "Dashboard";
}

function getThemeClasses(
  theme: string,
  compactMode: boolean
) {
  if (theme === "dark") {
    return {
      shell:
        "min-h-screen bg-zinc-950 text-zinc-100",

      sidebar:
        "bg-black border-zinc-800 text-white",

      topbar:
        "bg-black border-zinc-800 text-white",

      sidebarMuted:
        "text-zinc-500",

      inactiveNav:
        "text-zinc-300 hover:bg-zinc-800 hover:text-white",

      main:
        compactMode
          ? "p-4 xl:p-6"
          : "p-5 xl:p-8",
    };
  }

  if (theme === "light") {
    return {
      shell:
        "min-h-screen bg-zinc-50 text-zinc-950",

      sidebar:
        "bg-white border-zinc-200 text-zinc-950",

      topbar:
        "bg-white border-zinc-200 text-zinc-950",

      sidebarMuted:
        "text-zinc-500",

      inactiveNav:
        "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",

      main:
        compactMode
          ? "p-4 xl:p-6"
          : "p-5 xl:p-8",
    };
  }

  return {
    shell:
      "min-h-screen bg-zinc-100 text-zinc-950",

    sidebar:
      "bg-zinc-950 border-zinc-900 text-white",

    topbar:
      "bg-zinc-950 border-zinc-900 text-white",

    sidebarMuted:
      "text-zinc-500",

    inactiveNav:
      "text-zinc-300 hover:bg-white/10 hover:text-white",

    main:
      compactMode
        ? "p-4 xl:p-6"
        : "p-5 xl:p-8",
  };
}

function getAccentClasses(
  accentColor: string
) {
  if (accentColor === "blue") {
    return "bg-blue-600 text-white";
  }

  if (accentColor === "green") {
    return "bg-green-600 text-white";
  }

  if (accentColor === "red") {
    return "bg-red-600 text-white";
  }

  if (accentColor === "orange") {
    return "bg-orange-500 text-white";
  }

  if (accentColor === "purple") {
    return "bg-purple-600 text-white";
  }

  if (accentColor === "indigo") {
    return "bg-indigo-600 text-white";
  }

  if (accentColor === "emerald") {
    return "bg-emerald-600 text-white";
  }

  if (accentColor === "amber") {
    return "bg-amber-500 text-zinc-950";
  }

  return "bg-white text-zinc-950";
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [user, setUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [loading, setLoading] =
    useState(true);

  const {
    settings:
      appSettings,
  } =
    useAppSettings();

  const {
    hasAnyPermission,
    isAdmin,
  } =
    usePermissions();

  const {
    settings:
      userSettings,
  } =
    useUserSettings();

  useEffect(() => {
    if (
      isPublicPath(
        pathname
      )
    ) {
      setLoading(
        false
      );

      return;
    }

    void ensureUser();

    function handleCurrentUserUpdated() {
      setUser(
        getCachedCurrentUser()
      );
    }

    window.addEventListener(
      "currentUserUpdated",
      handleCurrentUserUpdated
    );

    return () => {
      window.removeEventListener(
        "currentUserUpdated",
        handleCurrentUserUpdated
      );
    };
  }, [
    pathname,
  ]);

  async function ensureUser() {
    try {
      setLoading(
        true
      );

      const nextUser =
        await loadCurrentUser();

      setUser(
        nextUser
      );

      if (!nextUser) {
        router.push(
          "/login"
        );
      }
    } catch (error) {
      console.error(
        "Benutzer konnte nicht geladen werden:",
        error
      );

      setUser(
        null
      );

      router.push(
        "/login"
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",
        }
      );
    } catch (error) {
      console.error(
        "Logout fehlgeschlagen:",
        error
      );
    } finally {
      setUser(
        null
      );

      router.push(
        "/login"
      );

      router.refresh();
    }
  }

  const visibleNavigationItems =
    useMemo(
      () =>
        navigationItems.filter(
          (item) => {
            const userIsAdmin =
              isAdmin ||
              user?.role === "admin";

            if (userIsAdmin) {
              return true;
            }

            if (item.adminOnly) {
              return false;
            }

            if (
              !item.permissionAny ||
              item.permissionAny.length === 0
            ) {
              return true;
            }

            return hasAnyPermission(
              item.permissionAny
            );
          }
        ),
      [
        hasAnyPermission,
        isAdmin,
        user,
      ]
    );

  const groupedNavigationItems =
    useMemo(
      () =>
        categoryOrder
          .map(
            (category) => ({
              category,
              items:
                visibleNavigationItems.filter(
                  (item) =>
                    item.category === category
                ),
            })
          )
          .filter(
            (group) =>
              group.items.length > 0
          ),
      [
        visibleNavigationItems,
      ]
    );

  const themeClasses =
    getThemeClasses(
      userSettings.theme,
      userSettings.compactMode
    );

  const activeNavClass =
    getAccentClasses(
      userSettings.accentColor
    );

  const pageTitle =
    getPageTitle(
      pathname
    );

  const appVersion =
    appSettings.appVersion ||
    appSettings.version ||
    "0.1.0";

  if (
    isPublicPath(
      pathname
    )
  ) {
    return (
      <>
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Anwendung wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm max-w-md w-full">
          <h1 className="text-3xl font-bold">
            Nicht angemeldet
          </h1>

          <p className="text-zinc-500 mt-2">
            Bitte melde dich an, um fortzufahren.
          </p>

          <Link
            href="/login"
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.shell}>
      <div className="min-h-screen flex">
        <aside className={`hidden lg:flex w-72 shrink-0 h-screen sticky top-0 border-r flex-col ${themeClasses.sidebar}`}>
          <div className="px-6 py-6 border-b border-inherit shrink-0">
            <p className={`text-sm ${themeClasses.sidebarMuted}`}>
              {appSettings.companyName ||
                user.company ||
                "Intern"}
            </p>

            <h1 className="text-2xl font-bold mt-1">
              {appSettings.appName ||
                "Intranet"}
            </h1>
          </div>

          <nav className="flex-1 px-4 py-5 space-y-6">
            {groupedNavigationItems.map(
              (group) => (
                <div
                  key={group.category}
                  className="space-y-2"
                >
                  <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${themeClasses.sidebarMuted}`}>
                    {categoryLabels[group.category]}
                  </p>

                  <div className="space-y-1">
                    {group.items.map(
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
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                              active
                                ? activeNavClass
                                : themeClasses.inactiveNav
                            }`}
                          >
                            <span>
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
              )
            )}
          </nav>

          <div className="px-6 py-5 border-t border-inherit shrink-0">
            <p className={`text-xs ${themeClasses.sidebarMuted}`}>
              Version {appVersion}
            </p>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className={`sticky top-0 z-30 border-b ${themeClasses.topbar}`}>
            <div className="px-5 xl:px-8 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm opacity-60">
                  {appSettings.appName ||
                    "Intranet"}
                </p>

                <h2 className="text-xl font-bold truncate">
                  {pageTitle}
                </h2>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    void handleLogout()
                  }
                  className="bg-white text-zinc-950 px-4 py-2 rounded-xl hover:bg-zinc-100 transition"
                >
                  Ausloggen
                </button>

                <div className="hidden sm:block text-right">
                  <p className="text-xs opacity-60">
                    Angemeldet als
                  </p>

                  <p className="text-sm font-semibold">
                    {user.name}
                  </p>

                  <p className="text-xs opacity-60">
                    {getRoleLabel(
                      user.role
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:hidden px-4 pb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleNavigationItems.map(
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
                        className={`shrink-0 px-4 py-2 rounded-xl text-sm transition ${
                          active
                            ? activeNavClass
                            : "bg-white text-zinc-900"
                        }`}
                      >
                        {item.icon} {item.label}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </header>

          <main className={themeClasses.main}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}