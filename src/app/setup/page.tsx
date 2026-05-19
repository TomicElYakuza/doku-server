"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getUser,
  saveUser,
} from "../../lib/userStorage";

import type {
  User,
  UserRole,
} from "../../lib/userStorage";

import {
  getRoleLabel,
} from "../../lib/permissions";

export default function SetupPage() {
  const [mounted, setMounted] =
    useState(false);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("admin");

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  useEffect(() => {
    setMounted(true);

    loadUser();

    function handleUserUpdated() {
      loadUser();
    }

    window.addEventListener(
      "userUpdated",
      handleUserUpdated
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdated
      );
    };
  }, []);

  function loadUser() {
    const user =
      getUser();

    setCurrentUser(
      user
    );

    setName(
      user?.name || "Admin"
    );

    setEmail(
      user?.email || "admin@local"
    );

    setRole(
      user?.role || "admin"
    );
  }

  function handleSaveUser() {
    if (!name.trim()) {
      alert(
        "Bitte einen Namen eingeben."
      );

      return;
    }

    if (!email.trim()) {
      alert(
        "Bitte eine E-Mail-Adresse eingeben."
      );

      return;
    }

    const savedUser =
      saveUser({
        name:
          name.trim(),

        email:
          email.trim(),

        role,
      });

    setCurrentUser(
      savedUser || null
    );

    alert(
      "Benutzer wurde gespeichert."
    );
  }

  function setDemoAdmin() {
    setName(
      "Admin"
    );

    setEmail(
      "admin@local"
    );

    setRole(
      "admin"
    );
  }

  function setDemoEditor() {
    setName(
      "Editor"
    );

    setEmail(
      "editor@local"
    );

    setRole(
      "editor"
    );
  }

  function setDemoViewer() {
    setName(
      "Viewer"
    );

    setEmail(
      "viewer@local"
    );

    setRole(
      "viewer"
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* TOP NAV */}
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          dashboard
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          setup
        </span>
      </div>

      {/* BACK */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Benutzer Setup
        </h1>

        <p className="text-zinc-500 mt-2">
          Lokalen Demo-Benutzer und Rolle festlegen
        </p>
      </div>

      {/* CURRENT USER */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Benutzer
        </h2>

        {!currentUser && (
          <p className="text-zinc-500 mt-4">
            Kein Benutzer geladen.
          </p>
        )}

        {currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Name
              </p>

              <p className="font-semibold mt-1">
                {currentUser.name}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                E-Mail
              </p>

              <p className="font-semibold mt-1">
                {currentUser.email}
              </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-5">
              <p className="text-sm text-zinc-500">
                Rolle
              </p>

              <p className="font-semibold mt-1">
                {getRoleLabel(
                  currentUser.role
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FORM */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Benutzer bearbeiten
        </h2>

        <p className="text-zinc-500 mt-2">
          Diese Demo-Version speichert den Benutzer lokal im Browser. Später kann das an ein echtes Login-System und eine Datenbank angebunden werden.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block mb-2 font-medium">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="Name"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              E-Mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
              placeholder="email@firma.at"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 font-medium">
              Rolle
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value as UserRole
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              <option value="admin">
                Administrator
              </option>

              <option value="editor">
                Bearbeiter
              </option>

              <option value="viewer">
                Leser
              </option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleSaveUser}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer speichern
          </button>

          <button
            onClick={loadUser}
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktuelle Daten neu laden
          </button>
        </div>
      </div>

      {/* ROLE SHORTCUTS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Demo-Rollen
        </h2>

        <p className="text-zinc-500 mt-2">
          Schnell zwischen Rollen wechseln und danach speichern.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={setDemoAdmin}
            className="bg-zinc-900 text-white px-5 py-4 rounded-2xl hover:bg-zinc-700 transition text-left"
          >
            <p className="font-semibold">
              Admin
            </p>

            <p className="text-sm text-zinc-300 mt-1">
              Darf alles sehen, erstellen, bearbeiten und löschen.
            </p>
          </button>

          <button
            onClick={setDemoEditor}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition text-left"
          >
            <p className="font-semibold">
              Editor
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              Darf Inhalte erstellen und bearbeiten, aber nicht alles löschen.
            </p>
          </button>

          <button
            onClick={setDemoViewer}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition text-left"
          >
            <p className="font-semibold">
              Viewer
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              Darf Inhalte ansehen, aber nicht ändern.
            </p>
          </button>
        </div>
      </div>

      {/* PERMISSIONS INFO */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Rollenübersicht
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Administrator
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Vollzugriff auf Wiki, Tickets, Vorlagen, Aktivitäten, Einstellungen und später Admin-Dashboard.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Bearbeiter
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Kann Inhalte erstellen und bearbeiten. Lösch- und Admin-Funktionen sind eingeschränkt.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold">
              Leser
            </h3>

            <p className="text-sm text-zinc-500 mt-2">
              Nur Lesezugriff. Keine Bearbeitung, keine Kommentare, keine Löschaktionen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}