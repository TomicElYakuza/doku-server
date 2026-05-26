"use client";

import Link from "next/link";

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCachedCurrentUser,
  loadCurrentUser,
  logoutCurrentUser,
} from "../lib/currentUserRepository";

import {
  useAppSettings,
} from "../hooks/useAppSettings";

import {
  useFeatureFlags,
} from "../hooks/useFeatureFlags";

import type {
  User,
} from "../types/user";

import Topbar from "./layout/Topbar";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

const INACTIVITY_TIMEOUT_MS =
  60 * 60 * 1000;

const navigationItems: NavigationItem[] = [
  {
    href: "/news",
    label: "News",
    icon: "📰",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
  },
  {
    href: "/wiki",
    label: "Wiki",
    icon: "📚",
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: "🎫",
  },
  {
    href: "/files",
    label: "Dateien",
    icon: "📎",
  },
  {
    href: "/activity",
    label: "Aktivität",
    icon: "🕘",
  },
  {
    href: "/settings",
    label: "Einstellungen",
    icon: "⚙️",
  },
  {
    href: "/admin",
    label: "Admin",
    icon: "🛡️",
    adminOnly: true,
  },
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

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function getRoleLabel(
  role: string
) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Leser";
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const logoutTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const logoutRunningRef =
    useRef(false);

  const {
    settings,
  } =
    useAppSettings();

  const {
    activityLogEnabled,
  } =
    useFeatureFlags();

  const isModern =
    settings.theme === "modern";

  const [user, setUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (
      isPublicPath(
        pathname
      )
    ) {
      setLoading(
        false
      );

      clearInactivityTimer();

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

  useEffect(() => {
    if (
      isPublicPath(
        pathname
      ) ||
      !user
    ) {
      clearInactivityTimer();

      return;
    }

    const activityEvents = [
      "click",
      "keydown",
      "mousemove",
      "mousedown",
      "scroll",
      "touchstart",
      "wheel",
    ];

    function handleActivity() {
      resetInactivityTimer();
    }

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleActivity,
          {
            passive:
              true,
          }
        );
      }
    );

    resetInactivityTimer();

    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleActivity
          );
        }
      );

      clearInactivityTimer();
    };
  }, [
    pathname,
    user,
  ]);

  function clearInactivityTimer() {
    if (logoutTimerRef.current) {
      clearTimeout(
        logoutTimerRef.current
      );

      logoutTimerRef.current =
        null;
    }
  }

  function resetInactivityTimer() {
    clearInactivityTimer();

    logoutTimerRef.current =
      setTimeout(
        () => {
          void handleInactiveLogout();
        },
        INACTIVITY_TIMEOUT_MS
      );
  }

  async function handleInactiveLogout() {
    if (logoutRunningRef.current) {
      return;
    }

    logoutRunningRef.current =
      true;

    try {
      await logoutCurrentUser();

      setUser(
        null
      );

      window.dispatchEvent(
        new Event(
          "currentUserUpdated"
        )
      );

      alert(
        "Du wurdest wegen 60 Minuten Inaktivität automatisch abgemeldet."
      );

      router.push(
        "/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Automatischer Logout fehlgeschlagen:",
        error
      );

      router.push(
        "/login"
      );
    } finally {
      logoutRunningRef.current =
        false;
    }
  }

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

  if (
    isPublicPath(
      pathname
    )
  ) {
    return (
      <main className="min-h-screen w-full bg-zinc-50">
        {children}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-zinc-50 flex items-center justify-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Anwendung wird geladen...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-zinc-50 flex items-center justify-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Nicht angemeldet
          </h1>

          <p className="text-zinc-500 mt-2">
            Bitte melde dich an, um fortzufahren.
          </p>

          <Link
            href="/login"
            className="inline-flex mt-5 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zum Login
          </Link>
        </div>
      </main>
    );
  }

  const visibleNavigationItems =
    navigationItems.filter(
      (item) => {
        if (
          item.href === "/activity" &&
          !activityLogEnabled
        ) {
          return false;
        }

        return (
          !item.adminOnly ||
          user.role === "admin"
        );
      }
    );

  const sidebarClass =
    isModern
      ? "hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 border-r border-zinc-800 bg-zinc-950 text-white p-6 flex-col"
      : "hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 border-r border-zinc-200 bg-white p-6 flex-col";

  const inactiveLinkClass =
    isModern
      ? "text-zinc-300 hover:bg-white/10 hover:text-white"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950";

  const activeLinkClass =
    isModern
      ? "bg-white text-zinc-950"
      : "bg-zinc-900 text-white";

  const userBoxClass =
    isModern
      ? "mt-auto bg-white/10 border border-white/10 rounded-3xl p-5"
      : "mt-auto bg-zinc-50 rounded-3xl p-5";

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <aside className={sidebarClass}>
        <div>
          <p className={isModern ? "text-sm text-zinc-400" : "text-sm text-zinc-500"}>
            Intern
          </p>

          <h1 className="text-2xl font-bold">
            Intranet
          </h1>
        </div>

        <nav className="space-y-2 mt-10">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                    active
                      ? activeLinkClass
                      : inactiveLinkClass
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
        </nav>

        <div className={userBoxClass}>
          <p className="font-semibold">
            {user.name}
          </p>

          <p className={isModern ? "text-sm text-zinc-300 mt-1 break-all" : "text-sm text-zinc-500 mt-1 break-all"}>
            {user.email}
          </p>

          <p className="text-xs text-zinc-400 mt-2">
            {getRoleLabel(
              user.role
            )}
          </p>

          <p className="text-xs text-zinc-400 mt-1">
            {user.company || "Intern"}
            {" · "}
            {user.department || "Allgemein"}
          </p>
        </div>
      </aside>

      <div className="min-h-screen w-full lg:pl-72">
        <Topbar />

        <main className="w-full px-4 py-6 md:px-8 xl:px-10 2xl:px-12">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}