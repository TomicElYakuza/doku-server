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

import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  loadCurrentUser,
} from "../../lib/currentUserRepository";
import type {
  User,
} from "../../types/user";

function getRoleLabel(role?: string) {
  if (role === "admin") {
    return "Administrator";
  }

  if (role === "department_lead") {
    return "Abteilungsleiter";
  }

  return "Mitarbeiter";
}

function getRoleClass(role?: string) {
  if (role === "admin") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (role === "department_lead") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (score >= 5) {
    return {
      label: "Stark",
      tone: "green" as const,
      width: "w-full",
      className: "bg-green-500",
    };
  }

  if (score >= 3) {
    return {
      label: "Mittel",
      tone: "orange" as const,
      width: "w-2/3",
      className: "bg-orange-500",
    };
  }

  if (password.length > 0) {
    return {
      label: "Schwach",
      tone: "red" as const,
      width: "w-1/3",
      className: "bg-red-500",
    };
  }

  return {
    label: "Nicht gesetzt",
    tone: "default" as const,
    width: "w-0",
    className: "bg-zinc-300",
  };
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void checkSession();
  }, []);

  async function checkSession() {
    try {
      const currentUser = await loadCurrentUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
    } catch (sessionError) {
      console.error(sessionError);
      router.push("/login");
    } finally {
      setCheckingSession(false);
    }
  }

  const forcedChange = Boolean(user?.passwordMustChange);

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [
      newPassword,
    ],
  );

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    passwordsMatch &&
    !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (!currentPassword) {
      setError("Bitte aktuelles Passwort eingeben.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Passwort konnte nicht geändert werden.",
        );
      }

      await loadCurrentUser();

      router.push("/dashboard");
      router.refresh();
    } catch (changeError) {
      console.error(changeError);

      setError(
        changeError instanceof Error
          ? changeError.message
          : "Passwort konnte nicht geändert werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>

          <h1 className="text-2xl font-black mt-6">
            Sitzung wird geprüft
          </h1>

          <p className="text-zinc-500 mt-2">
            Dein Benutzerstatus wird geladen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Sicherheit"
        title="Passwort ändern"
        description={
          forcedChange
            ? "Dein Konto muss vor der weiteren Nutzung ein neues Passwort erhalten."
            : "Aktualisiere dein Passwort sicher und halte deinen Account geschützt."
        }
        badges={[
          {
            label: forcedChange ? "Pflichtänderung" : "Optional",
          },
          {
            label: user?.name || "Benutzer",
          },
          {
            label: getRoleLabel(user?.role),
          },
          {
            label: passwordStrength.label,
          },
        ]}
        actions={
          <>
            {!forcedChange && (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-white/10 text-white border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/20 transition font-bold"
              >
                Abbrechen
              </button>
            )}

            <button
              type="submit"
              form="change-password-form"
              disabled={!canSubmit}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-bold"
            >
              {loading ? "Speichert..." : "Passwort speichern"}
            </button>
          </>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Benutzer"
          value={user?.name || "Unbekannt"}
          description={user?.email || "Keine E-Mail"}
          icon="👤"
          tone="blue"
        />

        <StatCard
          label="Rolle"
          value={getRoleLabel(user?.role)}
          description="Aktuelle Benutzerrolle"
          icon="🛡️"
          tone="indigo"
        />

        <StatCard
          label="Passwortstärke"
          value={passwordStrength.label}
          description="Mindestens 8 Zeichen"
          icon="🔐"
          tone={passwordStrength.tone}
        />

        <StatCard
          label="Status"
          value={forcedChange ? "Erforderlich" : "Freiwillig"}
          description={
            forcedChange
              ? "Änderung notwendig"
              : "Änderung optional"
          }
          icon={forcedChange ? "!" : "✓"}
          tone={forcedChange ? "orange" : "green"}
        />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <form
          id="change-password-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold">
              Neues Passwort setzen
            </h2>
            <p className="text-zinc-500 mt-1">
              Gib dein aktuelles Passwort ein und bestätige dein neues Passwort.
            </p>
          </div>

          {forcedChange && (
            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5">
              <h3 className="font-black text-orange-800">
                Passwortänderung erforderlich
              </h3>
              <p className="text-orange-700 mt-2">
                Dein Konto wurde so eingestellt, dass du bei der nächsten Anmeldung ein neues Passwort vergeben musst.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="current-password"
              className="block mb-2 font-bold"
            >
              Aktuelles Passwort
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="Aktuelles Passwort"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block mb-2 font-bold"
            >
              Neues Passwort
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="Mindestens 8 Zeichen"
            />

            <div className="mt-4">
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${passwordStrength.width} ${passwordStrength.className}`}
                />
              </div>

              <p className="text-sm text-zinc-500 mt-2">
                Stärke: {passwordStrength.label}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block mb-2 font-bold"
            >
              Neues Passwort bestätigen
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
              placeholder="Neues Passwort wiederholen"
            />

            {confirmPassword.length > 0 && (
              <p
                className={`text-sm mt-2 ${
                  passwordsMatch
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordsMatch
                  ? "Passwörter stimmen überein."
                  : "Passwörter stimmen nicht überein."}
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 pt-2">
            {!forcedChange && (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={loading}
                className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition disabled:opacity-50 font-medium"
              >
                Abbrechen
              </button>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="app-accent-bg text-white px-6 py-4 rounded-2xl transition disabled:opacity-50 font-bold app-brand-shadow"
            >
              {loading ? "Speichert..." : "Passwort speichern"}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl font-bold">
                Konto
              </h2>
              <p className="text-zinc-500 mt-1">
                Aktuell angemeldeter Benutzer.
              </p>

              <div className="space-y-4 mt-6">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Name
                  </p>
                  <p className="font-black mt-1">
                    {user?.name || "Unbekannt"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    E-Mail
                  </p>
                  <p className="font-black mt-1 break-all">
                    {user?.email || "Unbekannt"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Rolle
                  </p>
                  <span
                    className={`inline-flex mt-2 text-xs px-3 py-1 rounded-full border font-bold ${getRoleClass(
                      user?.role,
                    )}`}
                  >
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              Passwort-Regeln
            </h2>
            <p className="text-zinc-500 mt-1">
              Für mehr Sicherheit empfehlen wir:
            </p>

            <div className="space-y-3 mt-5">
              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
                <span className="app-accent-text font-black">✓</span>
                <p className="text-zinc-600">
                  Mindestens 8 Zeichen verwenden.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
                <span className="app-accent-text font-black">✓</span>
                <p className="text-zinc-600">
                  Großbuchstaben, Zahlen und Sonderzeichen kombinieren.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
                <span className="app-accent-text font-black">✓</span>
                <p className="text-zinc-600">
                  Kein altes oder mehrfach genutztes Passwort verwenden.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

