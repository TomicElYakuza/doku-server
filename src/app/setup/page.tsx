"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getUser,
  saveUser,
  clearUser,
} from "../../lib/userStorage";

export default function SetupPage() {
  const [mounted, setMounted] =
    useState(false);

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("viewer");

  const [status, setStatus] =
    useState("");

  useEffect(() => {
    setMounted(true);

    const user =
      getUser();

    if (user) {
      setName(user.name || "");

      setRole(user.role || "viewer");
    }
  }, []);

  function handleSave() {
    if (!name.trim()) {
      alert(
        "Bitte einen Namen eingeben."
      );

      return;
    }

    const user = {
      name: name.trim(),

      role,

      updatedAt:
        new Date().toLocaleString(),
    };

    saveUser(user);

    setStatus(
      "Benutzer wurde gespeichert."
    );
  }

  function handleDeleteUser() {
    const confirmed = confirm(
      "Benutzer wirklich entfernen?"
    );

    if (!confirmed) {
      return;
    }

    clearUser();

    setName("");

    setRole("viewer");

    setStatus(
      "Benutzer wurde entfernt."
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl">
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
          benutzer setup
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
          Lege fest, welcher Benutzer gerade mit dem lokalen Demo-System arbeitet.
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Benutzer
        </h2>

        <div className="space-y-6 mt-6">
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
              placeholder="Thomas Hörth"
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Rolle
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
            >
              <option value="viewer">
                Viewer
              </option>

              <option value="editor">
                Editor
              </option>

              <option value="admin">
                Admin
              </option>
            </select>

            <p className="text-sm text-zinc-500 mt-2">
              Viewer kann lesen und kommentieren. Editor kann zusätzlich bearbeiten. Admin kann zusätzlich löschen und den Papierkorb verwalten.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
            >
              Benutzer speichern
            </button>

            <button
              onClick={handleDeleteUser}
              className="bg-white border border-red-200 text-red-600 px-6 py-4 rounded-2xl hover:bg-red-50 transition"
            >
              Benutzer entfernen
            </button>
          </div>
        </div>
      </div>

      {/* CURRENT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Aktueller Zustand
        </h2>

        {name ? (
          <div className="mt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
              {name.charAt(0)}
            </div>

            <div>
              <p className="font-medium">
                {name}
              </p>

              <p className="text-sm text-zinc-500 capitalize">
                {role}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 mt-4">
            Kein Benutzer eingerichtet.
          </p>
        )}
      </div>

      {/* STATUS */}
      {status && (
        <div className="bg-zinc-900 text-white rounded-2xl p-5">
          {status}
        </div>
      )}
    </div>
  );
}