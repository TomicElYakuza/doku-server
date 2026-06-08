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
  AppTheme,
} from "../types/settings";

type AppShellProps = {
  children?: ReactNode;
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

type ShellMode =
  | "modern"
  | "light"
  | "dark";

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
    category: "overview",
    permissionAny: [
      "dashboard.view",
      "tickets.view",
      "wiki.view",
      "news.view",
    ],
  },
  {
    href: "/news",
    label: "News",
    icon: "📰",
    category: "overview",
    permissionAny: [
      "news.view",
      "news.manage",
    ],
  },
  {
    href: "/wiki",
    label: "Wiki",
    icon: "📚",
    category: "management",
    permissionAny: [
      "wiki.view",
      "wiki.manage",
    ],
  },
  {
    href: "/files",
    label: "Dateien",
    icon: "📁",
    category: "management",
    permissionAny: [
      "files.view",
      "files.manage",
    ],
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: "🎫",
    category: "management",
    permissionAny: [
      "tickets.view",
      "tickets.manage",
    ],
  },
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: "🛠️",
    category: "admin",
    adminOnly: true,
  },
  {
    href: "/admin/settings",
    label: "Systemeinstellungen",
    icon: "⚠️",
    category: "admin",
    adminOnly: true,
  },
  {
    href: "/settings",
    label: "Einstellungen",
    icon: "👤",
    category: "settings",
  },
];

const categoryLabels: Record<NavigationCategory, string> = {
  overview: "Übersicht",
  management: "Verwaltung",
  admin: "Adminbereich",
  settings: "Einstellungen",
};

const categoryOrder: NavigationCategory[] = [
  "overview",
  "management",
  "admin",
  "settings",
];

function isPublicPath(pathname: string) {
  return pathname === "/login";
}

function isActivePath(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === href || pathname === "/";
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  if (href === "/admin/settings") {
    return pathname === "/admin/settings";
  }

  if (href === "/settings") {
    return pathname === "/settings" || pathname.startsWith("/settings/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getSystemDarkMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getShellMode(
  theme: AppTheme | string,
  darkMode: boolean,
): ShellMode {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  if (theme === "system") {
    return getSystemDarkMode() ? "dark" : "light";
  }

  if (darkMode) {
    return "dark";
  }

  return "modern";
}

function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

function getInitials(name?: string) {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeBrandValue(
  value: string | undefined,
  fallback: string,
) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return fallback;
  }

  if (
    normalized.toLowerCase() === "intern" ||
    normalized.toLowerCase() === "intranet"
  ) {
    return fallback;
  }

  return normalized;
}

function getPageTitle(pathname: string) {
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

  if (pathname.startsWith("/admin/taxonomy")) {
    return "Kategorien & Tags";
  }

  if (pathname.startsWith("/admin/modules")) {
    return "Admin-Module";
  }

  if (pathname.startsWith("/admin/role-templates")) {
    return "Rollen-Vorlagen";
  }

  if (pathname.startsWith("/admin/database")) {
    return "Datenbank";
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

function getSectionLabel(pathname: string) {
  if (pathname.startsWith("/admin/settings")) {
    return "Globale Konfiguration";
  }

  if (pathname.startsWith("/admin")) {
    return "Velunis Admin";
  }

  if (pathname.startsWith("/tickets")) {
    return "Support Center";
  }

  if (pathname.startsWith("/wiki")) {
    return "Wissensdatenbank";
  }

  if (pathname.startsWith("/files")) {
    return "Dokumente";
  }

  if (pathname.startsWith("/news")) {
    return "Unternehmensnews";
  }

  if (pathname.startsWith("/settings")) {
    return "Benutzerbereich";
  }

  return "Velunis Workspace";
}

function getThemeClasses(
  mode: ShellMode,
  compactMode: boolean,
) {
  const spacing = compactMode
    ? "px-4 py-5 xl:px-6 xl:py-6"
    : "px-5 py-6 xl:px-8 xl:py-8";

  if (mode === "light") {
    return {
      shell:
        "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.08),_transparent_28%),#f6f7fb] text-zinc-950",
      sidebar:
        "bg-white/92 border-zinc-200 text-zinc-950 backdrop-blur-xl",
      sidebarCard:
        "bg-zinc-50 border-zinc-200 text-zinc-950",
      sidebarCardHover:
        "hover:bg-white",
      topbar:
        "bg-white/88 border-zinc-200 text-zinc-950 backdrop-blur-xl",
      sidebarMuted: "text-zinc-500",
      inactiveNav:
        "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
      activeNav:
        "text-white app-brand-shadow",
      activeIcon:
        "bg-white/20 text-white",
      inactiveIcon:
        "bg-zinc-100 group-hover:bg-zinc-200",
      main: spacing,
      topbarSurface:
        "bg-zinc-50 border-zinc-200 text-zinc-950",
      mobileNav:
        "bg-white/95 border-zinc-200 text-zinc-600 backdrop-blur-xl",
      logoutButton:
        "bg-zinc-950 text-white hover:bg-zinc-800",
      versionText:
        "text-zinc-500",
      systemTrack:
        "bg-zinc-200",
    };
  }

  if (mode === "dark") {
    return {
      shell:
        "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_28%),#09090b] text-zinc-100",
      sidebar:
        "bg-[#050610]/95 border-white/10 text-white backdrop-blur-xl",
      sidebarCard:
        "bg-white/[0.07] border-white/10 text-white",
      sidebarCardHover:
        "hover:bg-white/[0.1]",
      topbar:
        "bg-[#050610]/92 border-white/10 text-white backdrop-blur-xl",
      sidebarMuted: "text-zinc-500",
      inactiveNav:
        "text-zinc-300 hover:bg-white/10 hover:text-white",
      activeNav:
        "text-white app-brand-shadow",
      activeIcon:
        "bg-white/18 text-white",
      inactiveIcon:
        "bg-white/[0.06] group-hover:bg-white/[0.1]",
      main: spacing,
      topbarSurface:
        "bg-white/[0.07] border-white/10 text-white",
      mobileNav:
        "bg-[#050610]/95 border-white/10 text-zinc-300 backdrop-blur-xl",
      logoutButton:
        "bg-white text-zinc-950 hover:bg-zinc-100",
      versionText:
        "text-zinc-500",
      systemTrack:
        "bg-white/10",
    };
  }

  return {
    shell:
      "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_30%),#f3f4f8] text-zinc-950",
    sidebar:
      "bg-[#060711] border-white/10 text-white",
    sidebarCard:
      "bg-white/[0.06] border-white/10 text-white",
    sidebarCardHover:
      "hover:bg-white/[0.09]",
    topbar:
      "bg-[#060711]/95 border-white/10 text-white backdrop-blur-xl",
    sidebarMuted: "text-zinc-500",
    inactiveNav:
      "text-zinc-300 hover:bg-white/10 hover:text-white",
    activeNav:
      "text-white app-brand-shadow",
    activeIcon:
      "bg-white/18 text-white",
    inactiveIcon:
      "bg-white/[0.06] group-hover:bg-white/[0.1]",
    main: spacing,
    topbarSurface:
      "bg-white/[0.07] border-white/10 text-white",
    mobileNav:
      "bg-[#060711]/95 border-white/10 text-zinc-300 backdrop-blur-xl",
    logoutButton:
      "bg-white text-zinc-950 hover:bg-zinc-100",
    versionText:
      "text-zinc-500",
    systemTrack:
      "bg-white/10",
  };
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(getCachedCurrentUser());
  const [loading, setLoading] = useState(true);

  const {
    settings: appSettings,
  } = useAppSettings();

  const {
    settings: userSettings,
  } = useUserSettings();

  const {
    hasAnyPermission,
    isAdmin,
  } = usePermissions();

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setLoading(false);
      return;
    }

    void ensureUser();

    function handleCurrentUserUpdated() {
      setUser(getCachedCurrentUser());
    }

    window.addEventListener(
      "currentUserUpdated",
      handleCurrentUserUpdated,
    );

    return () => {
      window.removeEventListener(
        "currentUserUpdated",
        handleCurrentUserUpdated,
      );
    };
  }, [
    pathname,
  ]);

  async function ensureUser() {
    try {
      setLoading(true);

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
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout fehlgeschlagen:", error);
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        const userIsAdmin = isAdmin || user?.role === "admin";

        if (userIsAdmin) {
          return true;
        }

        if (item.adminOnly) {
          return false;
        }

        if (!item.permissionAny || item.permissionAny.length === 0) {
          return true;
        }

        return hasAnyPermission(item.permissionAny);
      }),
    [
      hasAnyPermission,
      isAdmin,
      user,
    ],
  );

  const groupedNavigationItems = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          items: visibleNavigationItems.filter(
            (item) => item.category === category,
          ),
        }))
        .filter((group) => group.items.length > 0),
    [
      visibleNavigationItems,
    ],
  );

  const effectiveTheme =
    userSettings.theme ||
    appSettings.theme ||
    "modern";

  const shellMode = getShellMode(
    effectiveTheme,
    appSettings.darkMode,
  );

  const themeClasses = getThemeClasses(
    shellMode,
    userSettings.compactMode ?? appSettings.compactMode,
  );

  const pageTitle = getPageTitle(pathname);
  const sectionLabel = getSectionLabel(pathname);

  const brandName = normalizeBrandValue(
    appSettings.companyName,
    "Velunis",
  );

  const workspaceName = normalizeBrandValue(
    appSettings.appName,
    "Intranet",
  );

  const appVersion =
    appSettings.appVersion ||
    appSettings.version ||
    "0.1.0";

  const mobileNavigationItems = visibleNavigationItems.slice(0, 5);

  if (isPublicPath(pathname)) {
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
            Velunis Workspace wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm max-w-md w-full">
          <h1 className="text-2xl font-bold text-zinc-900">
            Nicht angemeldet
          </h1>
          <p className="text-zinc-500 mt-2">
            Bitte melde dich an, um fortzufahren.
          </p>
          <Link
            href="/login"
            className="inline-flex mt-6 app-accent-bg text-white px-5 py-3 rounded-2xl transition app-brand-shadow"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.shell}>
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 w-72 border-r ${themeClasses.sidebar} z-40`}
      >
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-5">
            <Link
              href="/dashboard"
              className={`relative block rounded-[1.6rem] border p-4 overflow-hidden transition ${themeClasses.sidebarCard} ${themeClasses.sidebarCardHover}`}
            >
              <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full opacity-25 blur-2xl app-accent-bg" />
              <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full opacity-20 blur-2xl app-accent-bg" />

              <div className="relative flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl app-accent-bg text-white flex items-center justify-center font-black text-xl app-brand-shadow">
                  V
                </div>

                <div className="min-w-0">
                  <p className="text-2xl font-black tracking-tight leading-none">
                    {brandName}
                  </p>
                  <p className={`text-xs mt-1 truncate ${themeClasses.versionText}`}>
                    {workspaceName} Workspace
                  </p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
                <span className={`text-xs ${themeClasses.versionText}`}>
                  System online
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-3 space-y-7 overflow-hidden">
            {groupedNavigationItems.map((group) => (
              <div
                key={group.category}
                className="space-y-2"
              >
                <p
                  className={`px-3 text-[10px] uppercase tracking-[0.26em] font-black ${themeClasses.sidebarMuted}`}
                >
                  {categoryLabels[group.category]}
                </p>

                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                          active
                            ? `${themeClasses.activeNav} app-accent-bg`
                            : themeClasses.inactiveNav
                        }`}
                      >
                        <span
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm ${
                            active
                              ? themeClasses.activeIcon
                              : themeClasses.inactiveIcon
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 pb-5">
            <div className={`relative rounded-[1.6rem] border p-4 overflow-hidden ${themeClasses.sidebarCard}`}>
              <div className="absolute inset-x-0 top-0 h-1 app-accent-bg" />
              <div className="absolute -right-12 -bottom-12 h-28 w-28 rounded-full opacity-20 blur-2xl app-accent-bg" />

              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.22em] font-black ${themeClasses.sidebarMuted}`}>
                    System
                  </p>
                  <p className="text-sm font-bold mt-1">
                    Velunis Intranet
                  </p>
                </div>

                <span className="rounded-full app-accent-bg text-white px-3 py-1 text-xs font-black app-brand-shadow">
                  v{appVersion}
                </span>
              </div>

              <div className={`relative mt-4 h-1.5 rounded-full overflow-hidden ${themeClasses.systemTrack}`}>
                <div className="h-full w-4/5 rounded-full app-accent-bg" />
              </div>

              <p className={`relative text-xs mt-3 ${themeClasses.versionText}`}>
                Interner Arbeitsbereich für Tickets, Wissen und Dokumente.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <header
          className={`sticky top-0 z-30 h-[72px] border-b ${themeClasses.topbar}`}
        >
          <div className="h-full px-5 xl:px-8 flex items-center justify-between gap-5">
            <div className="min-w-0 flex items-center gap-4">
              <div className="hidden md:flex h-11 w-11 rounded-2xl app-accent-bg items-center justify-center app-brand-shadow">
                <span className="text-white text-lg">
                  ✦
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.26em] font-black text-zinc-500">
                  {sectionLabel}
                </p>
                <h1 className="text-xl font-black truncate">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`hidden md:flex items-center gap-3 rounded-2xl border px-3 py-2 ${themeClasses.topbarSurface}`}
              >
                <div className="h-10 w-10 rounded-2xl app-accent-bg text-white flex items-center justify-center text-sm font-black app-brand-shadow">
                  {getInitials(user.name)}
                </div>

                <div className="leading-tight min-w-0">
                  <p className="text-sm font-black truncate max-w-40">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate max-w-40">
                    {getRoleLabel(user.role)} · {brandName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl transition text-sm font-black shadow-sm ${themeClasses.logoutButton}`}
              >
                <span className="hidden sm:inline">
                  Abmelden
                </span>
                <span className="text-base group-hover:translate-x-0.5 transition">
                  ↗
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className={`flex-1 ${themeClasses.main} pb-24 lg:pb-8`}>
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>
      </div>

      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${themeClasses.mobileNav}`}
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mobileNavigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? `${themeClasses.activeNav} app-accent-bg`
                    : themeClasses.inactiveNav
                }`}
              >
                <span className="text-base leading-none">
                  {item.icon}
                </span>
                <span className="truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


