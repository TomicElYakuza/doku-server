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
import { adminModuleRepository } from "../lib/adminModuleRepository";
import { useAppSettings } from "../hooks/useAppSettings";
import { usePermissions } from "../hooks/usePermissions";
import { useUserSettings } from "../hooks/useUserSettings";
import type { AdminModuleConfig } from "../types/adminModule";
import type { AppTheme } from "../types/settings";

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
  moduleKey?: string;
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
    icon: "⌂",
    category: "overview",
    moduleKey: "dashboard",
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
    moduleKey: "news",
    permissionAny: [
      "news.view",
      "news.create",
      "news.edit",
    ],
  },
  {
    href: "/wiki",
    label: "Wiki",
    icon: "📘",
    category: "management",
    moduleKey: "wiki",
    permissionAny: [
      "wiki.view",
      "wiki.create",
      "wiki.edit",
    ],
  },
  {
    href: "/files",
    label: "Dateien",
    icon: "📁",
    category: "management",
    moduleKey: "files",
    permissionAny: [
      "files.view",
      "files.upload",
    ],
  },  {
    href: "/service",
    label: "Service-Center",
    icon: "◇",
    category: "management",
    moduleKey: "service",
    permissionAny: [
      "service.view",
      "service.create",
      "service.edit",
      "service.assign",
      "service.dashboard.view",
      "service.payments.manage",
      "service.customers.manage",
    ],
  },  {
    href: "/inventory",
    label: "IT-Inventar",
    icon: "▣",
    category: "management",
    moduleKey: "inventory",
    permissionAny: [
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.assign",
      "inventory.hardware.manage",
      "inventory.software.manage",
      "inventory.servers.manage",
    ],
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: "🎫",
    category: "management",
    moduleKey: "tickets",
    permissionAny: [
      "tickets.view",
      "tickets.create",
      "tickets.edit",
    ],
  },
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: "⚙️",
    category: "admin",
    moduleKey: "admin",
    adminOnly: true,
  },
  {
    href: "/admin/settings",
    label: "Systemeinstellungen",
    icon: "🛠️",
    category: "admin",
    moduleKey: "admin-settings",
    adminOnly: true,
  },
  {
    href: "/settings",
    label: "Einstellungen",
    icon: "👤",
    category: "settings",
  },
];

const moduleKeyAliases: Record<string, string[]> = {
  dashboard: [
    "dashboard",
    "overview",
  ],
  news: [
    "news",
    "admin-news",
  ],
  wiki: [
    "wiki",
    "wiki-pages",
  ],
  files: [
    "files",
    "documents",
  ],
  tickets: [
    "tickets",
    "ticket",
  ],
  inventory: [
    "inventory",
    "it-inventory",
    "assets",
    "it-assets",
  ],
  activities: [
    "activities",
    "activity",
    "activity-log",
  ],
  admin: [
    "admin",
    "admin-dashboard",
  ],
  "admin-settings": [
    "admin-settings",
    "settings",
    "system-settings",
  ],
};

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
    return "Aktivitäten";
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

  if (pathname.startsWith("/activity")) {
    return "Aktivitäten";
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
      topbar:
        "bg-white/88 border-zinc-200 text-zinc-950 backdrop-blur-xl",
      sidebarMuted:
        "text-zinc-500",
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
      topbar:
        "bg-[#050610]/92 border-white/10 text-white backdrop-blur-xl",
      sidebarMuted:
        "text-zinc-500",
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
    topbar:
      "bg-[#060711]/95 border-white/10 text-white backdrop-blur-xl",
    sidebarMuted:
      "text-zinc-500",
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
      "bg-[#060711]/95 border-white/10 text-zinc-300",
    logoutButton:
      "bg-white text-zinc-950 hover:bg-zinc-100",
    versionText:
      "text-zinc-500",
    systemTrack:
      "bg-white/10",
  };
}

function getModuleLookup(modules: AdminModuleConfig[]) {
  const lookup = new Map<string, AdminModuleConfig>();

  modules.forEach((module) => {
    lookup.set(module.key, module);
  });

  return lookup;
}

function moduleAllowsItem(
  item: NavigationItem,
  moduleLookup: Map<string, AdminModuleConfig>,
  modulesLoaded: boolean,
) {
  if (!item.moduleKey) {
    return true;
  }

  if (!modulesLoaded) {
    return true;
  }

  const aliases = moduleKeyAliases[item.moduleKey] || [item.moduleKey];

  for (const alias of aliases) {
    const module = moduleLookup.get(alias);

    if (module) {
      return module.isEnabled && module.isVisible;
    }
  }

  return true;
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const cachedUser = getCachedCurrentUser();
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [adminModules, setAdminModules] = useState<AdminModuleConfig[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

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

    const currentCachedUser = getCachedCurrentUser();

    if (currentCachedUser) {
      setUser(currentCachedUser);
      setLoading(false);
      void refreshUserInBackground();
    } else {
      void ensureUserBlocking();
    }

    function handleCurrentUserUpdated() {
      const nextCachedUser = getCachedCurrentUser();

      setUser(nextCachedUser);

      if (!nextCachedUser && !isPublicPath(pathname)) {
        router.push("/login");
      }
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
    router,
  ]);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      return;
    }

    if (!modulesLoaded) {
      void loadAdminModules();
    }

    function handleAdminModulesUpdated() {
      adminModuleRepository.clearCache?.();
      void loadAdminModules();
    }

    window.addEventListener(
      "adminModulesUpdated",
      handleAdminModulesUpdated,
    );

    return () => {
      window.removeEventListener(
        "adminModulesUpdated",
        handleAdminModulesUpdated,
      );
    };
  }, [
    pathname,
    modulesLoaded,
  ]);

  async function loadAdminModules() {
    try {
      const modules = await adminModuleRepository.list();

      setAdminModules(Array.isArray(modules) ? modules : []);
    } catch (error) {
      console.error("Admin-Module konnten nicht geladen werden:", error);
      setAdminModules([]);
    } finally {
      setModulesLoaded(true);
    }
  }

  async function ensureUserBlocking() {
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

  async function refreshUserInBackground() {
    try {
      const nextUser = await loadCurrentUser();

      setUser(nextUser);

      if (!nextUser) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Benutzer konnte im Hintergrund nicht aktualisiert werden:", error);
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

  const moduleLookup = useMemo(
    () => getModuleLookup(adminModules),
    [
      adminModules,
    ],
  );

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        const userIsAdmin = isAdmin || user?.role === "admin";

        if (!moduleAllowsItem(item, moduleLookup, modulesLoaded)) {
          return false;
        }

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
      moduleLookup,
      modulesLoaded,
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

  const effectiveTheme = userSettings.theme || appSettings.theme || "modern";
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
    appSettings.appVersion || appSettings.version || "0.1.0";
  const mobileNavigationItems = visibleNavigationItems.slice(0, 5);

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen app-accent-bg text-white flex items-center justify-center px-6">
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <p className="font-black text-2xl">
            Velunis Workspace wird geladen...
          </p>
          <p className="text-white/70 mt-2">
            Benutzer, Rechte und Module werden vorbereitet.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl max-w-md">
          <h1 className="text-3xl font-black">Nicht angemeldet</h1>
          <p className="text-white/70 mt-3">
            Bitte melde dich an, um fortzufahren.
          </p>
          <Link
            href="/login"
            className="inline-flex mt-6 app-accent-bg text-white px-5 py-3 rounded-2xl font-black"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.shell}>
      <div className="min-h-screen xl:grid xl:grid-cols-[292px_1fr]">
        <aside
          className={`hidden xl:flex xl:flex-col border-r h-screen sticky top-0 overflow-hidden ${themeClasses.sidebar}`}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl app-accent-bg app-brand-shadow flex items-center justify-center font-black text-xl text-white">
                V
              </div>
              <div>
                <p className="font-black text-lg leading-tight">{brandName}</p>
                <p className={`text-sm ${themeClasses.sidebarMuted}`}>
                  {workspaceName} Workspace
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 min-h-0 px-4 py-5 space-y-5 overflow-hidden">
            {groupedNavigationItems.map((group) => (
              <div key={group.category}>
                <p className={`text-xs font-black uppercase tracking-[0.18em] px-3 mb-3 ${themeClasses.sidebarMuted}`}>
                  {categoryLabels[group.category]}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 px-3 py-3 rounded-2xl transition font-bold ${
                          active
                            ? `${themeClasses.activeNav} app-accent-bg`
                            : themeClasses.inactiveNav
                        }`}
                      >
                        <span
                          className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black ${
                            active
                              ? themeClasses.activeIcon
                              : themeClasses.inactiveIcon
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4">
            <div className={`border rounded-3xl p-5 ${themeClasses.sidebarCard}`}>
              <p className="font-black">System</p>
              <p className={`text-sm mt-1 ${themeClasses.sidebarMuted}`}>
                Velunis Intranet
              </p>
              <div className={`h-2 rounded-full mt-4 ${themeClasses.systemTrack}`}>
                <div className="h-full w-2/3 rounded-full app-accent-bg" />
              </div>
              <p className={`text-xs mt-3 ${themeClasses.versionText}`}>
                v{appVersion} · Module DB-basiert
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className={`sticky top-0 z-30 border-b ${themeClasses.topbar}`}>
            <div className="px-5 py-4 xl:px-8 flex items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-4">
                <div className={`hidden md:flex h-11 w-11 rounded-2xl border items-center justify-center ${themeClasses.topbarSurface}`}>
                  ✦
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                    {sectionLabel}
                  </p>
                  <h1 className="text-xl xl:text-2xl font-black truncate">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`hidden md:flex items-center gap-3 border rounded-2xl px-4 py-2 ${themeClasses.topbarSurface}`}>
                  <div className="h-9 w-9 rounded-xl app-accent-bg flex items-center justify-center text-white font-black">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="font-black leading-tight">{user.name}</p>
                    <p className="text-xs opacity-70">
                      {getRoleLabel(user.role)} · {brandName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl transition text-sm font-black shadow-sm ${themeClasses.logoutButton}`}
                >
                  Abmelden
                  <span aria-hidden>↗</span>
                </button>
              </div>
            </div>
          </header>

          <main className={themeClasses.main}>
            {children}
          </main>
        </div>
      </div>

      <nav className={`xl:hidden fixed bottom-4 left-4 right-4 z-40 border rounded-3xl shadow-2xl px-3 py-2 ${themeClasses.mobileNav}`}>
        <div className="grid grid-cols-5 gap-1">
          {mobileNavigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-black transition ${
                  active
                    ? "app-accent-bg text-white app-brand-shadow"
                    : "hover:bg-zinc-100/10"
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}