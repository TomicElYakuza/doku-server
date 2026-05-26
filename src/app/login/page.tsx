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
  getCachedCurrentUser,
  loadCurrentUser,
  loginCurrentUser,
} from "../../lib/currentUserRepository";

import {
  appSettingsRepository,
} from "../../lib/appSettingsRepository";

import type {
  AppSettings,
} from "../../types/settings";

export default function LoginPage() {
  const router =
    useRouter();

  const [settings, setSettings] =
    useState<AppSettings>(
      appSettingsRepository.getDefault()
    );

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    void initializeLogin();
  }, []);

  async function initializeLogin() {
    try {
      const [
        nextSettings,
        currentUser,
      ] =
        await Promise.all([
          appSettingsRepository.get(),
          loadCurrentUser(),
        ]);

      setSettings(
        nextSettings
      );

      if (
        currentUser ||
        getCachedCurrentUser()
      ) {
        router.push(
          "/dashboard"
        );
      }
    } catch (loadError) {
      console.error(
        "Login konnte nicht vorbereitet werden:",
        loadError
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

    setError(
      ""
    );

    if (!username.trim()) {
      setError(
        "Bitte Benutzername eingeben."
      );

      return;
    }

    if (!password) {
      setError(
        "Bitte Passwort eingeben."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      await loginCurrentUser({
        username,
        password,
      });

      router.push(
        "/dashboard"
      );

      router.refresh();
    } catch (loginError) {
      console.error(
        loginError
      );

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login fehlgeschlagen."
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
            Anmeldung wird geprüft...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-zinc-950 text-white">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="hidden lg:flex relative overflow-hidden p-12 flex-col justify-between">
          <div className="relative z-10">
            <p className="text-zinc-400">
              {settings.companyName ||
                "Intern"}
            </p>

            <h1 className="text-5xl font-bold mt-4 max-w-3xl leading-tight">
              {settings.appName ||
                "Intranet"}
            </h1>

            <p className="text-zinc-300 text-lg mt-6 max-w-2xl">
              Zentrales System für Dokumentation, Tickets, News, Dateien und interne Abläufe.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="bg-white/10 border border-white/10 rounded-3xl p-6">
              <p className="text-3xl">
                📚
              </p>

              <h2 className="font-semibold mt-4">
                Wiki
              </h2>

              <p className="text-sm text-zinc-400 mt-2">
                Wissen und Anleitungen zentral verwalten.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-6">
              <p className="text-3xl">
                🎫
              </p>

              <h2 className="font-semibold mt-4">
                Tickets
              </h2>

              <p className="text-sm text-zinc-400 mt-2">
                Aufgaben und Supportfälle nachvollziehbar bearbeiten.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-3xl p-6">
              <p className="text-3xl">
                📰
              </p>

              <h2 className="font-semibold mt-4">
                News
              </h2>

              <p className="text-sm text-zinc-400 mt-2">
                Interne Informationen schnell teilen.
              </p>
            </div>
          </div>

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10" />
          <div className="absolute left-1/3 bottom-1/4 h-72 w-72 rounded-full bg-white/5" />
        </section>

        <section className="bg-zinc-50 text-zinc-950 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <p className="text-zinc-500">
                {settings.companyName ||
                  "Intern"}
              </p>

              <h1 className="text-4xl font-bold mt-2">
                {settings.appName ||
                  "Intranet"}
              </h1>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div>
                <p className="text-sm text-zinc-500">
                  Willkommen zurück
                </p>

                <h2 className="text-3xl font-bold mt-2">
                  Login
                </h2>

                <p className="text-zinc-500 mt-3">
                  Melde dich mit Benutzername und Passwort an.
                </p>
              </div>

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
                    Benutzername
                  </label>

                  <input
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    autoComplete="username"
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Passwort
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                    placeholder="Passwort"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition disabled:opacity-50"
                >
                  {loading
                    ? "Anmeldung läuft..."
                    : "Einloggen"}
                </button>
              </form>

              <div className="bg-zinc-50 rounded-2xl p-4 mt-6">
                <p className="text-sm text-zinc-500">
                  Du wirst nach ungefähr 60 Minuten Inaktivität automatisch abgemeldet.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 text-center mt-6">
              {settings.appName ||
                "Intranet"}
              {" · "}
              Version{" "}
              {settings.appVersion ||
                settings.version ||
                "0.1.0"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}