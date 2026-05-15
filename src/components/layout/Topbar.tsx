"use client";

import { useEffect, useState } from "react";

import {
  getUser,
} from "../../lib/userStorage";

export default function Topbar() {
  const [user, setUser] =
    useState<any>(null);

  function loadUser() {
    setUser(getUser());
  }

  useEffect(() => {
    loadUser();

    window.addEventListener(
      "userUpdated",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        loadUser
      );
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
      <h2 className="font-semibold text-lg">
        Willkommen zurück
      </h2>

      {user ? (
        <a
          href="/setup"
          className="flex items-center gap-3 hover:bg-zinc-50 rounded-2xl px-3 py-2 transition"
        >
          <div className="text-right">
            <p className="font-medium leading-tight">
              {user.name}
            </p>

            <p className="text-sm text-zinc-500 capitalize">
              {user.role}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
            {user.name?.charAt(0)}
          </div>
        </a>
      ) : (
        <a
          href="/setup"
          className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition"
        >
          Benutzer Setup
        </a>
      )}
    </header>
  );
}