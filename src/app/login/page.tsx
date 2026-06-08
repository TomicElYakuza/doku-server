"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
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

function getVersionLabel(settings: AppSettings) {
  return settings.appVersion || settings.version || "0.1.0";
}

function getCompanyLabel(settings: AppSettings) {
  return settings.companyName || "Velunis";
}

function getAppLabel(settings: AppSettings) {
  return settings.appName || "Intranet";
}

export default function LoginPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<AppSettings>(
    appSettingsRepository.getDefault(),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void initializeLogin();
  }, []);

  async function initializeLogin() {
    try {
      const [
        nextSettings,
        currentUser,
      ] = await Promise.all([
        appSettingsRepository.get(),
        loadCurrentUser(),
      ]);

      setSettings(nextSettings);

      if (
        currentUser ||
        getCachedCurrentUser()
      ) {
        router.push("/dashboard");
      }
    } catch (loadError) {
      console.error(
        "Login konnte nicht vorbereitet werden:",
        loadError,
      );
    } finally {
      setCheckingSession(false);
    }
  }

  const versionLabel = useMemo(
    () => getVersionLabel(settings),
    [
      settings,
    ],
  );

  const companyLabel = useMemo(
    () => getCompanyLabel(settings),
    [
      settings,
    ],
  );

  const appLabel = useMemo(
    () => getAppLabel(settings),
    [
      settings,
    ],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Bitte Benutzername eingeben.");
      return;
    }

    if (!password) {
      setError("Bitte Passwort eingeben.");
      return;
    }

    try {
      setLoading(true);

      await loginCurrentUser({
        username,
        password,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      console.error(loginError);

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login fehlgeschlagen.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.18),transparent_34%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center shadow-2xl">
            <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>

          <h1 className="text-2xl font-black mt-6">
            Anmeldung wird geprüft
          </h1>

          <p className="text-white/60 mt-2">
            Dein Velunis Workspace wird vorbereitet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.16),transparent_34%),linear-gradient(135deg,#020617,#0f172a_48%,#111827)] text-white">
      <div className="min-h-screen grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden xl:flex flex-col justify-between overflow-hidden p-10 2xl:p-14">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-8 top-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 shadow-2xl backdrop-blur">
              <div className="h-10 w-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black">
                V
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/50 font-black">
                  {companyLabel}
                </p>
                <p className="font-black">
                  {appLabel}
                </p>
              </div>
            </div>

            <div className="mt-16 max-w-3xl">
              <p className="inline-flex rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/70 font-bold">
                DMS · Tickets · Wiki · Intranet
              </p>

              <h1 className="text-6xl 2xl:text-7xl font-black tracking-[-0.06em] mt-7 leading-[0.9]">
                Willkommen im Velunis Workspace.
              </h1>

              <p className="text-xl text-white/65 mt-7 leading-8 max-w-2xl">
                Zentrales System für Dokumentation, Tickets, News, Dateien und interne Abläufe.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-1 2xl:grid-cols-3 gap-5">
            <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                📚
              </div>
              <h2 className="text-xl font-black mt-5">
                Wiki
              </h2>
              <p className="text-white/60 mt-2">
                Wissen, Anleitungen und Dokumentation zentral verwalten.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                🎫
              </div>
              <h2 className="text-xl font-black mt-5">
                Tickets
              </h2>
              <p className="text-white/60 mt-2">
                Aufgaben, Supportfälle und Zuständigkeiten nachvollziehbar bearbeiten.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/10 p-6 backdrop-blur shadow-2xl">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                📰
              </div>
              <h2 className="text-xl font-black mt-5">
                News
              </h2>
              <p className="text-white/60 mt-2">
                Interne Informationen schnell, sichtbar und strukturiert teilen.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 xl:px-10">
          <div className="absolute inset-0 xl:hidden bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.24),transparent_34%)]" />

          <div className="relative w-full max-w-xl">
            <div className="xl:hidden mb-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-3xl bg-white text-zinc-950 flex items-center justify-center font-black text-2xl shadow-2xl">
                V
              </div>

              <p className="text-xs uppercase tracking-[0.22em] text-white/50 font-black mt-5">
                {companyLabel}
              </p>

              <h1 className="text-4xl font-black tracking-[-0.04em] mt-2">
                {appLabel}
              </h1>
            </div>

            <div className="rounded-[2rem] bg-white text-zinc-950 border border-white/20 shadow-2xl overflow-hidden">
              <div className="relative p-8 md:p-10 border-b border-zinc-100 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute right-10 bottom-0 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-black">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    Sicherer Login
                  </div>

                  <h2 className="text-4xl font-black tracking-[-0.04em] mt-6">
                    Willkommen zurück
                  </h2>

                  <p className="text-zinc-500 mt-3">
                    Melde dich mit deinem Benutzername und Passwort an.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(event) => void handleSubmit(event)}
                className="p-8 md:p-10 space-y-5"
              >
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 rounded-3xl p-5">
                    <p className="font-bold">
                      Login nicht möglich
                    </p>
                    <p className="text-sm mt-1">
                      {error}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="username"
                    className="block mb-2 font-bold"
                  >
                    Benutzername
                  </label>

                  <input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                    placeholder="Benutzername"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 font-bold"
                  >
                    Passwort
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
                    placeholder="Passwort"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white px-5 py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition disabled:opacity-50"
                >
                  {loading
                    ? "Anmeldung läuft..."
                    : "Einloggen"}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Session
                    </p>
                    <p className="font-bold mt-1">
                      60 Minuten Inaktivität
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <p className="text-xs text-zinc-500">
                      Version
                    </p>
                    <p className="font-bold mt-1">
                      {settings.showVersion === false
                        ? "Ausgeblendet"
                        : versionLabel}
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <p className="text-center text-white/45 text-sm mt-6">
              {companyLabel} · {appLabel}
              {settings.showVersion !== false && (
                <>
                  {" "}
                  · Version {versionLabel}
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}