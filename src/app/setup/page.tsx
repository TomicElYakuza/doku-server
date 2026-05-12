"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  saveUser,
} from "../../lib/userStorage";

export default function SetupPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("viewer");

  function handleSave() {
    saveUser({
      name,
      role,
    });

    router.push("/wiki");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
        <h1 className="text-4xl font-bold">
          Benutzer Setup
        </h1>

        <p className="text-zinc-500 mt-3">
          Benutzer konfigurieren
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
        </div>

        <button
          onClick={handleSave}
          className="mt-8 bg-zinc-900 text-white px-6 py-4 rounded-2xl hover:bg-zinc-700 transition"
        >
          Speichern
        </button>
      </div>
    </div>
  );
}