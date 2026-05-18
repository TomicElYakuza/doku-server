"use client";

import { useEffect, useState } from "react";

import {
  getStoredPages,
  resetWikiPages,
} from "../../lib/wikiStorage";

import {
  getTrashPages,
  clearTrashPages,
} from "../../lib/trashStorage";

import {
  getFavorites,
  clearFavorites,
} from "../../lib/favoritesStorage";

import {
  getRecentPages,
  clearRecentPages,
} from "../../lib/recentStorage";

import {
  getComments,
  clearComments,
} from "../../lib/commentStorage";

import {
  getFiles,
  clearFiles,
} from "../../lib/fileStorage";

import {
  getVersions,
  clearVersions,
} from "../../lib/versionStorage";

import {
  getActivities,
  clearActivities,
} from "../../lib/activityStorage";

import {
  getTickets,
  clearTickets,
  resetTickets,
} from "../../lib/ticketStorage";

import {
  clearUser,
} from "../../lib/userStorage";

export default function SettingsPage() {
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
      tickets: 0,
    });

  useEffect(() => {
    loadStats();

    function handleDataUpdated() {
      loadStats();
    }

    window.addEventListener(
      "wikiPagesUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "trashUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "favoritesUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "recentUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "commentsUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "filesUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "versionsUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "activityUpdated",
      handleDataUpdated
    );

    window.addEventListener(
      "ticketsUpdated",
      handleDataUpdated
    );

    return () => {
      window.removeEventListener(
        "wikiPagesUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "trashUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "favoritesUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "recentUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "commentsUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "filesUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "versionsUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "activityUpdated",
        handleDataUpdated
      );

      window.removeEventListener(
        "ticketsUpdated",
        handleDataUpdated
      );
    };
  }, []);

  function countObjectArrays(data: any) {
    return (
      Object.values(data) as any[]
    ).reduce(
      (
        acc: number,
        current: any
      ) => {
        if (Array.isArray(current)) {
          return acc + current.length;
        }

        return acc;
      },
      0
    );
  }

  function loadStats() {
    const pages =
      getStoredPages();

    const trash =
      getTrashPages();

    const favorites =
      getFavorites();

    const recent =
      getRecentPages();

    const activities =
      getActivities();

    const comments =
      getComments();

    const files =
      getFiles();

    const versions =
      getVersions();

    const tickets =
      getTickets();

    setStats({
      pages: pages.length,

      trash: trash.length,

      favorites:
        favorites.length,

      recent:
        recent.length,

      activities:
        activities.length,

      comments:
        countObjectArrays(
          comments
        ),

      files:
        countObjectArrays(
          files
        ),

      versions:
        countObjectArrays(
          versions
        ),

      tickets:
        tickets.length,
    });
  }

  function exportBackup() {
    const backup = {
      exportedAt:
        new Date().toLocaleString(),

      user:
        localStorage.getItem(
          "wiki-user"
        ),

      pages:
        localStorage.getItem(
          "wiki-pages"
        ),

      pagesInitialized:
        localStorage.getItem(
          "wiki-pages-initialized"
        ),

      trash:
        localStorage.getItem(
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

      files:
        localStorage.getItem(
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

      tickets:
        localStorage.getItem(
          "wiki-tickets"
        ),

      ticketsInitialized:
        localStorage.getItem(
          "wiki-tickets-initialized"
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

        if (
          !backup ||
          typeof backup !== "object"
        ) {
          setStatus(
            "Ungültige Backup-Datei."
          );

          return;
        }

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

        if (backup.tickets) {
          localStorage.setItem(
            "wiki-tickets",
            backup.tickets
          );
        }

        if (backup.ticketsInitialized) {
          localStorage.setItem(
            "wiki-tickets-initialized",
            backup.ticketsInitialized
          );
        } else if (backup.tickets) {
          localStorage.setItem(
            "wiki-tickets-initialized",
            "true"
          );
        }

        loadStats();

        window.dispatchEvent(
          new Event("wikiPagesUpdated")
        );

        window.dispatchEvent(
          new Event("trashUpdated")
        );

        window.dispatchEvent(
          new Event("favoritesUpdated")
        );

        window.dispatchEvent(
          new Event("recentUpdated")
        );

        window.dispatchEvent(
          new Event("commentsUpdated")
        );

        window.dispatchEvent(
          new Event("filesUpdated")
        );

        window.dispatchEvent(
          new Event("versionsUpdated")
        );

        window.dispatchEvent(
          new Event("activityUpdated")
        );

        window.dispatchEvent(
          new Event("ticketsUpdated")
        );

        window.dispatchEvent(
          new Event("userUpdated")
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
      "Wirklich alle lokalen Wiki-Daten inklusive Tickets löschen?"
    );

    if (!confirmed) {
      return;
    }

    resetWikiPages();

    clearTrashPages();

    clearFavorites();

    clearRecentPages();

    clearVersions();

    clearFiles();

    clearComments();

    clearActivities();

    clearTickets();

    loadStats();

    setStatus(
      "Wiki-Daten und Tickets wurden gelöscht. Beim nächsten Öffnen wird das Wiki wieder initialisiert."
    );
  }

  function resetEverything() {
    const confirmed = confirm(
      "Wirklich ALLES löschen, inklusive Benutzer?"
    );

    if (!confirmed) {
      return;
    }

    clearUser();

    resetWikiPages();

    clearTrashPages();

    clearFavorites();

    clearRecentPages();

    clearVersions();

    clearFiles();

    clearComments();

    clearActivities();

    clearTickets();

    localStorage.removeItem(
      "wiki-tickets-initialized"
    );

    loadStats();

    setStatus(
      "Alle lokalen Daten wurden gelöscht."
    );
  }

  function clearOnlyTrash() {
    const confirmed = confirm(
      "Papierkorb wirklich vollständig leeren?"
    );

    if (!confirmed) {
      return;
    }

    clearTrashPages();

    loadStats();

    setStatus(
      "Papierkorb wurde geleert."
    );
  }

  function clearOnlyActivities() {
    const confirmed = confirm(
      "Aktivitäten wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    clearActivities();

    loadStats();

    setStatus(
      "Aktivitäten wurden gelöscht."
    );
  }

  function clearOnlyTickets() {
    const confirmed = confirm(
      "Tickets wirklich löschen?"
    );

    if (!confirmed) {
      return;
    }

    clearTickets();

    loadStats();

    setStatus(
      "Tickets wurden gelöscht."
    );
  }

  function reloadTicketTemplates() {
    const confirmed = confirm(
      "Ticket-Templates wirklich neu laden? Bestehende Tickets werden dadurch ersetzt."
    );

    if (!confirmed) {
      return;
    }

    resetTickets();

    getTickets();

    loadStats();

    setStatus(
      "Ticket-Templates wurden neu geladen."
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
          Backup, lokale Daten und Zurücksetzen
        </p>
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

          <div className="border border-zinc-200 rounded-2xl p-5">
            <p className="text-sm text-zinc-500">
              Tickets
            </p>

            <p className="text-3xl font-bold mt-2">
              {stats.tickets}
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
          Exportiere oder importiere alle lokalen Wiki-Daten inklusive Benutzer, Papierkorb, Versionen, Anhängen, Kommentaren und Tickets.
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

      {/* SINGLE ACTIONS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Einzelne Bereiche löschen
        </h2>

        <p className="text-zinc-500 mt-2">
          Lösche gezielt einzelne lokale Bereiche.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={clearOnlyTrash}
            className="bg-white border border-red-200 text-red-600 px-5 py-3 rounded-2xl hover:bg-red-50 transition"
          >
            Papierkorb leeren
          </button>

          <button
            onClick={clearOnlyActivities}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Aktivitäten löschen
          </button>

          <button
            onClick={clearOnlyTickets}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Tickets löschen
          </button>

          <button
            onClick={reloadTicketTemplates}
            className="bg-white border border-blue-200 text-blue-700 px-5 py-3 rounded-2xl hover:bg-blue-50 transition"
          >
            Ticket-Templates neu laden
          </button>
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
            Wiki-Daten & Tickets löschen
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