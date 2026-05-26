"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  loadCurrentUser,
} from "../../lib/currentUserRepository";

import type {
  User,
} from "../../types/user";

export default function ChangePasswordPage() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void checkSession();
  }, []);

  async function checkSession() {
    try {
      const currentUser =
        await loadCurrentUser();

      if (!currentUser) {
        router.push(
          "/login"
        );

        return;
      }

      setUser(
        currentUser
      );
    } catch (sessionError) {
      console.error(
        sessionError
      );

      router.push(
        "/login"
      );
    } finally {
      setCheckingSession(
        false
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!currentPassword) {
      setError(
        "Bitte aktuelles Passwort eingeben."
      );

      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Das neue Passwort muss mindestens 8 Zeichen haben."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Die neuen Passwörter stimmen nicht überein."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      const response =
        await fetch(
          "/api/auth/change-password",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                currentPassword,
                newPassword,
              }),
          }
        );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Passwort konnte nicht geändert werden."
        );
      }

      await loadCurrentUser();

      router.push(
        "/dashboard"
      );

      router.refresh();
    } catch (changeError) {
      console.error(
        changeError
      );

      setError(
        changeError instanceof Error
          ? changeError.message
          : "Passwort konnte nicht geändert werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen w-full bg-zinc-950 text-white flex items-center justify-center px-4">
        <div className="bg-white/10 border border-white/10 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-300">
            Sitzung wird geprüft...
          </p>
        </div>
      </main>
    );
  }

  const forcedChange =
    Boolean(
      user?.passwordMustChange
    );

  return (
    <main className="min-h-screen w-full bg-zinc-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white text-zinc-950 border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-sm text-zinc-500">
            Sicherheit
          </p>

          <h1 className="text-3xl font-bold mt-2">
            Passwort ändern
          </h1>

          <p className="text-zinc-500 mt-3">
            {forcedChange
              ? "Dein Konto wurde so eingestellt, dass du bei der nächsten Anmeldung ein neues Passwort vergeben musst."
              : "Du kannst hier dein aktuelles Passwort ändern."}
          </p>

          {user && (
            <div className="bg-zinc-50 rounded-2xl p-4 mt-6">
              <p className="text-sm text-zinc-500">
                Angemeldet als
              </p>

              <p className="font-semibold mt-1">
                {user.name}
              </p>

              <p className="text-sm text-zinc-500 mt-1">
                {user.email}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-6">
              <p className="text-red-700 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={(event) =>
              void handleSubmit(
                event
              )
            }
            className="space-y-5 mt-8"
          >
            <div>
              <label className="block mb-2 font-medium">
                Aktuelles Passwort
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Neues Passwort
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Neues Passwort bestätigen
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {loading
                ? "Speichert..."
                : "Passwort speichern"}
            </button>

            {!forcedChange && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
                className="w-full bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
              >
                Abbrechen
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}