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
  appSettingsRepository,
} from "../../lib/appSettingsRepository";
import {
  getCachedCurrentUser,
  loadCurrentUser,
  loginCurrentUser,
} from "../../lib/currentUserRepository";
import type {
  AppSettings,
} from "../../types/settings";

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

      if (currentUser || getCachedCurrentUser()) {
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
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.25),transparent_30%)]" />
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full app-accent-bg opacity-20 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <section className="relative bg-white/10 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl max-w-md w-full text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white text-zinc-950 flex items-center justify-center">
            <span className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>

          <h1 className="text-2xl font-black tracking-[-0.03em] mt-6">
            Anmeldung wird geprüft...
          </h1>

          <p className="text-white/60 mt-2 leading-7">
            Deine aktuelle Sitzung wird vorbereitet.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_32%)]" />
      <div className="absolute -left-36 top-20 h-80 w-80 rounded-full app-accent-bg opacity-20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-white opacity-5 blur-3xl" />
      <div className="absolute -right-32 bottom-16 h-96 w-96 rounded-full app-accent-bg opacity-10 blur-3xl" />

      <div className="relative min-h-screen grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden xl:flex flex-col justify-between p-12 2xl:p-16">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-xl">
              <div className="h-11 w-11 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-lg">
                {(settings.companyName || "V").slice(0, 1).toUpperCase()}
              </div>

              <div>
                <p className="text-sm text-white/60">
                  {settings.companyName || "Intern"}
                </p>
                <p className="font-black">
                  {settings.appName || "Intranet"}
                </p>
              </div>
            </div>

            <div className="max-w-3xl mt-20">
              <p className="inline-flex rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold text-white/80">
                Velunis Workspace
              </p>

              <h1 className="text-6xl 2xl:text-7xl font-black tracking-[-0.08em] leading-[0.95] mt-6">
                Alles intern.
                <br />
                Zentral.
                <br />
                Übersichtlich.
              </h1>

              <p className="text-xl text-white/65 leading-9 max-w-2xl mt-8">
                Zentrales System für Dokumentation, Tickets, News, Dateien
                und interne Abläufe.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            <article className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
              <div className="text-2xl">
                📚
              </div>
              <h2 className="font-black mt-4">
                Wiki
              </h2>
              <p className="text-white/55 text-sm leading-6 mt-2">
                Wissen und Anleitungen zentral verwalten.
              </p>
            </article>

            <article className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
              <div className="text-2xl">
                🎫
              </div>
              <h2 className="font-black mt-4">
                Tickets
              </h2>
              <p className="text-white/55 text-sm leading-6 mt-2">
                Aufgaben und Supportfälle nachvollziehbar bearbeiten.
              </p>
            </article>

            <article className="bg-white/10 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
              <div className="text-2xl">
                📰
              </div>
              <h2 className="font-black mt-4">
                News
              </h2>
              <p className="text-white/55 text-sm leading-6 mt-2">
                Interne Informationen schnell teilen.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl">
            <div className="xl:hidden mb-8">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-xl">
                <div className="h-11 w-11 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-lg">
                  {(settings.companyName || "V").slice(0, 1).toUpperCase()}
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    {settings.companyName || "Intern"}
                  </p>
                  <p className="font-black">
                    {settings.appName || "Intranet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white text-zinc-950 rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-white/20 overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-44 w-44 rounded-full app-accent-bg opacity-5 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-black app-accent-text uppercase tracking-[0.2em]">
                      Willkommen zurück
                    </p>

                    <h1 className="text-4xl font-black tracking-[-0.06em] mt-3">
                      Login
                    </h1>

                    <p className="text-zinc-500 leading-7 mt-3">
                      Melde dich mit Benutzername und Passwort an.
                    </p>
                  </div>

                  <div className="hidden sm:flex h-14 w-14 rounded-2xl app-accent-soft app-accent-text items-center justify-center text-2xl shrink-0">
                    🔐
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 mt-8 font-bold">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={(event) => void handleSubmit(event)}
                  className="space-y-5 mt-8"
                >
                  <div>
                    <label className="block mb-2 font-bold">
                      Benutzername
                    </label>

                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                      placeholder="admin"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold">
                      Passwort
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                      placeholder="Passwort"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full app-accent-bg text-white px-5 py-4 rounded-2xl transition disabled:opacity-50 font-black app-brand-shadow flex items-center justify-center gap-3"
                  >
                    {loading && (
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}

                    {loading ? "Anmeldung läuft..." : "Einloggen"}
                  </button>
                </form>

                <div className="mt-8 bg-zinc-50 border border-zinc-100 rounded-2xl p-5">
                  <p className="text-sm text-zinc-500 leading-7">
                    Du wirst nach ungefähr 60 Minuten Inaktivität automatisch
                    abgemeldet.
                  </p>
                </div>

                <p className="text-xs text-zinc-400 mt-6">
                  {settings.appName || "Intranet"} {" · "} Version{" "}
                  {settings.appVersion || settings.version || "0.1.0"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}