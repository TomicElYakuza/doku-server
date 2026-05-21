"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getCachedCurrentUser,
  loadCurrentUser,
  logoutCurrentUser,
} from "../../lib/currentUserRepository";

import type {
  User,
} from "../../types/user";

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

export default function Topbar() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<User | null>(
      getCachedCurrentUser()
    );

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    void refreshUser();

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
  }, []);

  async function refreshUser() {
    try {
      const nextUser =
        await loadCurrentUser();

      setUser(
        nextUser
      );
    } catch (error) {
      console.error(
        "Benutzer konnte nicht geladen werden:",
        error
      );

      setUser(
        null
      );
    }
  }

  async function handleLogout() {
    try {
      setLoading(
        true
      );

      await logoutCurrentUser();

      setUser(
        null
      );

      router.push(
        "/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Logout konnte nicht durchgeführt werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
      <div>
        <p className="text-sm text-zinc-500">
          Intern
        </p>

        <h1 className="text-xl font-bold">
          Intranet
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="text-right">
            <p className="font-semibold">
              {user.name}
            </p>

            <p className="text-sm text-zinc-500">
              {getRoleLabel(
                user.role
              )}
              {" · "}
              {user.company ||
                "Intern"}
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="font-semibold">
              Nicht angemeldet
            </p>

            <p className="text-sm text-zinc-500">
              Bitte anmelden
            </p>
          </div>
        )}

        {user ? (
          <button
            type="button"
            onClick={() =>
              void handleLogout()
            }
            disabled={loading}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {loading
              ? "Abmelden..."
              : "Logout"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              router.push(
                "/login"
              )
            }
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}