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
  getCachedCurrentUser,
  loadCurrentUser,
} from "../lib/currentUserRepository";

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

const navigationItems: NavigationItem[] = [
  {
    href:
      "/news",

    label:
      "News",

    icon:
      "📰",
  },
  {
    href:
      "/dashboard",

    label:
      "Dashboard",

    icon:
      "🏠",
  },
  {
    href:
      "/wiki",

    label:
      "Wiki",

    icon:
      "📚",
  },
  {
    href:
      "/tickets",

    label:
      "Tickets",

    icon:
      "🎫",
  },
  {
    href:
      "/files",

    label:
      "Dateien",

    icon:
      "📎",
  },
  {
    href:
      "/activity",

    label:
      "Aktivität",

    icon:
      "🕘",
  },
  {
    href:
      "/settings",

    label:
      "Einstellungen",

    icon:
      "⚙️",
  },
  {
    href:
      "/admin",

    label:
      "Admin",

    icon:
      "🛡️",

    adminOnly:
      true,
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

  if (
    isPublicPath(
      pathname
    )
  ) {
    return (
      <main className="min-h-screen bg-zinc-50">
        {children}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
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
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
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
      (item) =>
        !item.adminOnly ||
        user.role === "admin"
    );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-72 shrink-0 border-r border-zinc-200 bg-white p-6 flex-col">
          <div>
            <p className="text-sm text-zinc-500">
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
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
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

          <div className="mt-auto bg-zinc-50 rounded-3xl p-5">
            <p className="font-semibold">
              {user.name}
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              {user.email}
            </p>

            <p className="text-xs text-zinc-400 mt-2">
              {user.company ||
                "Intern"}
              {" · "}
              {user.department ||
                "Allgemein"}
            </p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <Topbar />

          <main className="p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}