"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  getUser,
  saveUser,
} from "../../lib/userStorage";

export default function SetupPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("viewer");

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);

    const existingUser =
      getUser();

    if (existingUser) {
      setName(
        existingUser.name || ""
      );

      setRole(
        existingUser.role ||
          "viewer"
      );
    }
  }, []);

  function handleSave() {
    if (!name.trim()) {
      alert(
        "Bitte einen Namen eingeben."
      );

      return;
    }

    saveUser({
      name,
      role,
    });

    window.dispatchEvent(
      new Event("userUpdated")
    );

    router.push("/wiki");
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
        <h1 className="text-4xl font-bold">
          Benutzer Setup
        </h1>

        <p className="text-zinc-500 mt-3">
          Benutzer und Rolle für das lokale Wiki konfigurieren
        </p>

        {/* NAME */}
        <div className="mt-8">
          <label className="block mb-2 font-medium">
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="w-full border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
            placeholder="Thomas Hörth"
          />
        </div>

        {/* ROLE */}
        <div className="mt-6">
          <label className="block mb-2 font-medium">
            Rolle
          </label>

          <select
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value
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
            Viewer darf lesen, Editor darf erstellen/bearbeiten, Admin darf zusätzlich löschen.
          </p>
        </div>

        {/* PREVIEW */}
        <div className="mt-8 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
          <p className="text-sm text-zinc-500 mb-3">
            Vorschau
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
              {name
                ? name.charAt(0)
                : "?"}
            </div>

            <div>
              <p className="font-medium">
                {name ||
                  "Kein Name gesetzt"}
              </p>

              <p className="text-sm text-zinc-500 capitalize">
                {role}
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
          >
            Speichern
          </button>

          <button
            onClick={() =>
              router.push("/wiki")
            }
            className="bg-white border border-zinc-200 px-6 py-4 rounded-2xl hover:bg-zinc-100 transition"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}