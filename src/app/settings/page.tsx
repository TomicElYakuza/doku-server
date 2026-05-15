"use client";

import { useEffect, useState } from "react";

import {
  getUser,
} from "../../lib/userStorage";

export default function SettingsPage() {
  const [user, setUser] =
    useState<any>(null);

  const [status, setStatus] =
    useState("");

  const [stats, setStats] =
    useState({
      pages: 0,
      trash: 0,
      favorites: 0,
      recent: 0,
      activities: 0,
      comments: 0,
      files: 0,
      versions: 0,
    });

  useEffect(() => {
    setUser(getUser());

    loadStats();
  }, []);

  function loadStats() {
    const pages = JSON.parse(
      localStorage.getItem("wiki-pages") ||
        "[]"
    );

    const trash = JSON.parse(
      localStorage.getItem("wiki-trash") ||
        "[]"
    );

    const favorites = JSON.parse(
      localStorage.getItem("wiki-favorites") ||
        "[]"
    );

    const recent = JSON.parse(
      localStorage.getItem("wiki-recent") ||
        "[]"
    );

    const activities = JSON.parse(
      localStorage.getItem("wiki-activities") ||
        "[]"
    );

    const comments = JSON.parse(
      localStorage.getItem("wiki-comments") ||
        "{}"
    );

    const files = JSON.parse(
      localStorage.getItem("wiki-files") ||
        "{}"
    );

    const versions = JSON.parse(
      localStorage.getItem("wiki-versions") ||
        "{}"
    );

    const commentCount = (
      Object.values(comments) as any[]
    ).reduce(
      (
        acc: number,
        current: any
      ) => acc + current.length,
      0
    );

    const fileCount = (
      Object.values(files) as any[]
    ).reduce(
      (
        acc: number,
        current: any
      ) => acc + current.length,
      0
    );

    const versionCount = (
      Object.values(versions) as any[]
    ).reduce(
      (
        acc: number,
        current: any
      ) => acc + current.length,
      0
    );

    setStats({
      pages: pages.length,
      trash: trash.length,
      favorites: favorites.length,
      recent: recent.length,
      activities: activities.length,
      comments: commentCount,
      files: fileCount,
      versions: versionCount,
    });
  }

  function exportBackup() {
    const backup = {
      exportedAt:
        new Date().toLocaleString(),

      user: localStorage.getItem(
        "wiki-user"
      ),

      pages: localStorage.getItem(
        "wiki-pages"
      ),

      pagesInitialized:
        localStorage.getItem(
          "wiki-pages-initialized"
        ),

      trash: localStorage.getItem(
        "wiki-trash"
      ),

      favorites:
        localStorage.getItem(
          "wiki-favorites"
        ),

      recent:
        localStorage.getItem(
          "wiki-recent"
        ),

      versions:
        localStorage.getItem(
          "wiki-versions"
        ),

      files: localStorage.getItem(
        "wiki-files"
      ),

      comments:
        localStorage.getItem(
          "wiki-comments"
        ),

      activities:
        localStorage.getItem(
          "wiki-activities"
        ),
    };

    const blob = new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "wiki-backup.json";

    link.click();

    URL.revokeObjectURL(url);

    setStatus(
      "Backup wurde exportiert."
    );
  }

  function importBackup(
    event: any
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const backup = JSON.parse(
          reader.result as string
        );

        if (backup.user) {
          localStorage.setItem(
            "wiki-user",
            backup.user
          );
        }

        if (backup.pages) {
          localStorage.setItem(
            "wiki-pages",
            backup.pages
          );
        }

        if (backup.pagesInitialized) {
          localStorage.setItem(
            "wiki-pages-initialized",
            backup.pagesInitialized
          );
        } else if (backup.pages) {
          localStorage.setItem(
            "wiki-pages-initialized",
            "true"
          );
        }

        if (backup.trash) {
          localStorage.setItem(
            "wiki-trash",
            backup.trash
          );
        }

        if (backup.favorites) {
          localStorage.setItem(
            "wiki-favorites",
            backup.favorites
          );
        }

        if (backup.recent) {
          localStorage.setItem(
            "wiki-recent",
            backup.recent
          );
        }

        if (backup.versions) {
          localStorage.setItem(
            "wiki-versions",
            backup.versions
          );
        }

        if (backup.files) {
          localStorage.setItem(
            "wiki-files",
            backup.files
          );
        }

        if (backup.comments) {
          localStorage.setItem(
            "wiki-comments",
            backup.comments
          );
        }

        if (backup.activities) {
          localStorage.setItem(
            "wiki-activities",
            backup.activities
          );
        }

        setUser(getUser());

        loadStats();

        window.dispatchEvent(
          new Event("wikiPagesUpdated")
        );

        window.dispatchEvent(
          new Event("trashUpdated")
        );

        setStatus(
          "Backup wurde importiert. Seite bitte neu laden."
        );
      } catch {
        setStatus(
          "Backup konnte nicht gelesen werden."
        );
      }
    };

    reader.readAsText(file);
  }

  function resetWikiData() {
    const confirmed = confirm(
      "Wirklich alle lokalen Wiki-Daten löschen?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "wiki-pages"
    );

    localStorage.removeItem(
      "wiki-pages-initialized"
    );

    localStorage.removeItem(
      "wiki-trash"
    );

    localStorage.removeItem(
      "wiki-favorites"
    );

    localStorage.removeItem(
      "wiki-recent"
    );

    localStorage.removeItem(
      "wiki-versions"
    );

    localStorage.removeItem(
      "wiki-files"
    );

    localStorage.removeItem(
      "wiki-comments"
    );

    localStorage.removeItem(
      "wiki-activities"
    );

    loadStats();

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );

    window.dispatchEvent(
      new Event("trashUpdated")
    );

    setStatus(
      "Wiki-Daten wurden gelöscht. Beim nächsten Öffnen wird das Wiki wieder initialisiert."
    );
  }

  function resetEverything() {
    const confirmed = confirm(
      "Wirklich ALLES löschen, inklusive Benutzer?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "wiki-user"
    );

    localStorage.removeItem(
      "wiki-pages"
    );

    localStorage.removeItem(
      "wiki-pages-initialized"
    );

    localStorage.removeItem(
      "wiki-trash"
    );

    localStorage.removeItem(
      "wiki-favorites"
    );

    localStorage.removeItem(
      "wiki-recent"
    );

    localStorage.removeItem(
      "wiki-versions"
    );

    localStorage.removeItem(
      "wiki-files"
    );

    localStorage.removeItem(
      "wiki-comments"
    );

    localStorage.removeItem(
      "wiki-activities"
    );

    setUser(null);

    loadStats();

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );

    window.dispatchEvent(
      new Event("trashUpdated")
    );

    window.dispatchEvent(
      new Event("userUpdated")
    );

    setStatus(
      "Alle lokalen Daten wurden gelöscht."
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          Einstellungen
        </h1>

        <p className="text-zinc-500 mt-2">
          Verwaltung für Benutzer, Backup und lokale Wiki-Daten
        </p>
      </div>

      {/* USER CARD */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Benutzer
        </h2>

        {user ? (
          <div className="mt-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">
                {user.name?.charAt(0)}
              </div>

              <div>
                <p className="font-medium">
                  {user.name}
                </p>

                <p className="text-sm text-zinc-500 capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <a
              href="/setup"
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Benutzer bearbeiten
            </a>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-zinc-500">
              Kein Benutzer eingerichtet.
            </p>

            <a
              href="/setup"
              className="inline-flex mt-4 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
            >
              Benutzer einrichten
            </a>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Lokale Daten
        </h2>

        <p className="text-zinc-500 mt-2">
          Übersicht über alle aktuell gespeicherten Browser-Daten.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Dokumente
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.pages}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Papierkorb
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.trash}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Favoriten
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.favorites}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Zuletzt geöffnet
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.recent}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Versionen
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.versions}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Anhänge
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.files}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Kommentare
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.comments}
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Aktivitäten
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.activities}
            </p>
          </div>
        </div>
      </div>

      {/* BACKUP */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Backup
        </h2>

        <p className="text-zinc-500 mt-2">
          Exportiere oder importiere alle lokalen Wiki-Daten inklusive Papierkorb.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={exportBackup}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Backup exportieren
          </button>

          <label className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition cursor-pointer">
            Backup importieren

            <input
              type="file"
              accept="application/json"
              onChange={importBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* RESET */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Daten zurücksetzen
        </h2>

        <p className="text-zinc-500 mt-2">
          Entfernt lokale Demo-Daten aus dem Browser.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={resetWikiData}
            className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
          >
            Nur Wiki-Daten löschen
          </button>

          <button
            onClick={resetEverything}
            className="bg-red-900 text-white px-5 py-3 rounded-2xl hover:bg-red-800 transition"
          >
            Alles löschen
          </button>
        </div>
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