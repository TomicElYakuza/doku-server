"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  getUser,
} from "../../lib/userStorage";

import {
  getRoleLabel,
} from "../../lib/permissions";

export default function Topbar() {
  const [mounted, setMounted] =
    useState(false);

  const [user, setUser] =
    useState<any>(null);

  useEffect(() => {
    setMounted(true);

    setUser(getUser());

    function handleUserUpdated() {
      setUser(getUser());
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

  return (
    <header className="h-20 bg-white border-b border-zinc-200 px-8 flex items-center justify-between">
      {/* LEFT */}
      <div>
        <p className="text-sm text-zinc-500">
          Doku Server
        </p>

        <h1 className="font-semibold">
          Intranet & Wissensbasis
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {mounted && user ? (
          <Link
            href="/setup"
            className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 hover:bg-zinc-100 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-semibold">
              {user.name?.charAt(0) ||
                "?"}
            </div>

            <div className="text-left">
              <p className="font-medium leading-tight">
                {user.name}
              </p>

              <p className="text-sm text-zinc-500">
                {getRoleLabel(
                  user.role
                )}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/setup"
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Benutzer einrichten
          </Link>
        )}
      </div>
    </header>
  );
}