"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutCurrentUser } from "../../lib/currentUserRepository";
import type { User } from "../../types/user";

type TopbarProps = {
  user: User | null;
  appName: string;
  companyName: string;
};

function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "editor") {
    return "Bearbeiter";
  }

  return "Leser";
}

function clearCookies() {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const name = cookie.split("=")[0]?.trim();

    if (!name) {
      continue;
    }

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
}

async function clearBrowserCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();

    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }
}

export default function Topbar({ user, appName, companyName }: TopbarProps) {
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  async function handleLogout() {
    try {
      setLogoutLoading(true);

      await logoutCurrentUser();

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Logout konnte nicht durchgeführt werden."
      );
    } finally {
      setLogoutLoading(false);
    }
  }

  async function handleClearEverything() {
    const confirmed = window.confirm(
      "Cache, LocalStorage, SessionStorage und Cookies wirklich löschen? Du wirst danach neu geladen und wahrscheinlich abgemeldet."
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearLoading(true);

      localStorage.clear();
      sessionStorage.clear();
      clearCookies();

      await clearBrowserCaches();

      window.location.href = "/login";
    } catch (error) {
      console.error("Cache konnte nicht vollständig gelöscht werden:", error);

      localStorage.clear();
      sessionStorage.clear();
      clearCookies();

      window.location.reload();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-white shadow-sm md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500">
            {companyName}
          </p>

          <h2 className="truncate text-lg font-semibold text-white">
            {appName}
          </h2>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleClearEverything}
            disabled={clearLoading}
            className="hidden rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
          >
            {clearLoading ? "Lösche..." : "Cache löschen"}
          </button>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-semibold text-zinc-950">
              {(user?.name || "U").slice(0, 1).toUpperCase()}
            </div>

            <div className="hidden min-w-0 text-left md:block">
              <p className="max-w-48 truncate text-sm font-medium text-white">
                {user?.name || "Nicht angemeldet"}
              </p>

              <p className="max-w-48 truncate text-xs text-zinc-400">
                {user
                  ? `${getRoleLabel(user.role)} · ${
                      user.department || user.company || "Intern"
                    }`
                  : "Bitte anmelden"}
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {logoutLoading ? "..." : "Logout"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}