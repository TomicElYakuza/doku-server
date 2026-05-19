"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

type StorageStat = {
  key: string;
  label: string;
  count: number;
};

const STORAGE_KEYS = {
  tickets: "dms_tickets",
  ticketTemplates: "dms_ticket_templates",
  ticketComments: "dms_ticket_comments",
  activities: "dms_activities",
  user: "dms_user",
  wikiPages: "dms_wiki_pages",
  trashPages: "dms_trash_pages",
  files: "dms_files",
};

export default function SettingsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [stats, setStats] =
    useState<StorageStat[]>([]);

  useEffect(() => {
    setMounted(true);

    loadStats();

    function handleStorageUpdate() {
      loadStats();
    }

    window.addEventListener(
      "ticketsUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "ticketTemplatesUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "ticketCommentsUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "activityUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "wikiPagesUpdated",
      handleStorageUpdate
    );

    window.addEventListener(
      "trashUpdated",
      handleStorageUpdate
    );

    return () => {
      window.removeEventListener(
        "ticketsUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "ticketTemplatesUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "ticketCommentsUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "activityUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "wikiPagesUpdated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "trashUpdated",
        handleStorageUpdate
      );
    };
  }, []);

  function getCountFromStorage(
    key: string
  ) {
    if (typeof window === "undefined") {
      return 0;
    }

    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return 0;
    }

    try {
      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.length;
      }

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return Object.values(parsed).reduce(
          (
            sum: number,
            value: any
          ) => {
            if (Array.isArray(value)) {
              return sum + value.length;
            }

            return sum + 1;
          },
          0
        );
      }

      return 1;
    } catch {
      return 0;
    }
  }

  function loadStats() {
    if (typeof window === "undefined") {
      return;
    }

    setStats([
      {
        key: STORAGE_KEYS.tickets,
        label: "Tickets",
        count: getCountFromStorage(
          STORAGE_KEYS.tickets
        ),
      },
      {
        key: STORAGE_KEYS.ticketTemplates,
        label: "Ticket-Vorlagen",
        count: getCountFromStorage(
          STORAGE_KEYS.ticketTemplates
        ),
      },
      {
        key: STORAGE_KEYS.ticketComments,
        label: "Ticket-Kommentare",
        count: getCountFromStorage(
          STORAGE_KEYS.ticketComments
        ),
      },
      {
        key: STORAGE_KEYS.activities,
        label: "Aktivitäten",
        count: getCountFromStorage(
          STORAGE_KEYS.activities
        ),
      },
      {
        key: STORAGE_KEYS.wikiPages,
        label: "Wiki-Dokumente",
        count: getCountFromStorage(
          STORAGE_KEYS.wikiPages
        ),
      },
      {
        key: STORAGE_KEYS.trashPages,
        label: "Papierkorb",
        count: getCountFromStorage(
          STORAGE_KEYS.trashPages
        ),
      },
      {
        key: STORAGE_KEYS.files,
        label: "Dateien",
        count: getCountFromStorage(
          STORAGE_KEYS.files
        ),
      },
    ]);
  }

  function dispatchAllUpdates() {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new Event("ticketsUpdated")
    );

    window.dispatchEvent(
      new Event("ticketTemplatesUpdated")
    );

    window.dispatchEvent(
      new Event("ticketCommentsUpdated")
    );

    window.dispatchEvent(
      new Event("activityUpdated")
    );

    window.dispatchEvent(
      new Event("wikiPagesUpdated")
    );

    window.dispatchEvent(
      new Event("trashUpdated")
    );
  }

  function removeStorageKey(
    key: string
  ) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(key);

    dispatchAllUpdates();

    loadStats();
  }

  function clearTickets() {
    const confirmed =
      confirm(
        "Alle Tickets löschen? Kommentare zu Tickets bleiben nur erhalten, wenn du sie nicht separat löschst."
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.tickets
    );
  }

  function clearTicketTemplates() {
    const confirmed =
      confirm(
        "Alle Ticket-Vorlagen löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.ticketTemplates
    );
  }

  function clearTicketComments() {
    const confirmed =
      confirm(
        "Alle Ticket-Kommentare löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.ticketComments
    );
  }

  function clearActivities() {
    const confirmed =
      confirm(
        "Alle Aktivitäten löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.activities
    );
  }

  function clearWikiPages() {
    const confirmed =
      confirm(
        "Alle Wiki-Dokumente löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.wikiPages
    );
  }

  function clearWikiTrash() {
    const confirmed =
      confirm(
        "Papierkorb leeren?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.trashPages
    );
  }

  function clearFiles() {
    const confirmed =
      confirm(
        "Alle gespeicherten Dateien löschen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.files
    );
  }

  function clearUser() {
    const confirmed =
      confirm(
        "Benutzer-Setup zurücksetzen?"
      );

    if (!confirmed) {
      return;
    }

    removeStorageKey(
      STORAGE_KEYS.user
    );
  }

  function clearAllDemoData() {
    const confirmed =
      confirm(
        "Wirklich alle lokalen Demo-Daten löschen? Tickets, Vorlagen, Kommentare, Aktivitäten, Wiki-Daten, Papierkorb, Dateien und Benutzer-Setup werden entfernt."
      );

    if (!confirmed) {
      return;
    }

    Object.values(
      STORAGE_KEYS
    ).forEach(
      (key) => {
        localStorage.removeItem(
          key
        );
      }
    );

    dispatchAllUpdates();

    loadStats();
  }

  function exportLocalStorage() {
    if (typeof window === "undefined") {
      return;
    }

    const data: Record<string, string> =
      {};

    Object.values(
      STORAGE_KEYS
    ).forEach(
      (key) => {
        const value =
          localStorage.getItem(
            key
          );

        if (value !== null) {
          data[key] =
            value;
        }
      }
    );

    const json =
      JSON.stringify(
        data,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type: "application/json",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      `dms-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  function importLocalStorage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed =
      confirm(
        "Import starten? Bestehende lokale Daten mit gleichen Schlüsseln werden überschrieben."
      );

    if (!confirmed) {
      event.target.value =
        "";

      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        try {
          const result =
            reader.result;

          if (
            typeof result !== "string"
          ) {
            alert(
              "Import fehlgeschlagen."
            );

            return;
          }

          const parsed =
            JSON.parse(result);

          if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
          ) {
            alert(
              "Ungültige Import-Datei."
            );

            return;
          }

          Object.entries(
            parsed
          ).forEach(
            ([key, value]) => {
              if (
                Object.values(
                  STORAGE_KEYS
                ).includes(key)
              ) {
                localStorage.setItem(
                  key,
                  String(value)
                );
              }
            }
          );

          dispatchAllUpdates();

          loadStats();

          alert(
            "Import abgeschlossen."
          );
        } catch {
          alert(
            "Import fehlgeschlagen. Datei ist kein gültiges JSON."
          );
        } finally {
          event.target.value =
            "";
        }
      };

    reader.readAsText(
      file
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-6xl">
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
          einstellungen
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
          Einstellungen
        </h1>

        <p className="text-zinc-500 mt-2">
          Lokale Demo-Daten, Export, Import und Reset verwalten
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(
          (item) => (
            <div
              key={item.key}
              className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
            >
              <p className="text-sm text-zinc-500">
                {item.label}
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {item.count}
              </h2>
            </div>
          )
        )}
      </div>

      {/* DATA MANAGEMENT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Datenverwaltung
        </h2>

        <p className="text-zinc-500 mt-2">
          Alle Daten liegen aktuell lokal im Browser-Storage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button
            onClick={exportLocalStorage}
            className="bg-zinc-900 text-white px-5 py-4 rounded-2xl hover:bg-zinc-700 transition text-left"
          >
            Lokale Daten exportieren
          </button>

          <label className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-zinc-100 transition cursor-pointer text-left">
            Lokale Daten importieren
            <input
              type="file"
              accept="application/json"
              onChange={importLocalStorage}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* RESET SECTIONS */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Einzelne Bereiche löschen
        </h2>

        <p className="text-zinc-500 mt-2">
          Damit kannst du gezielt einzelne lokale Bereiche zurücksetzen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={clearTickets}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Tickets löschen
          </button>

          <button
            onClick={clearTicketTemplates}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Ticket-Vorlagen löschen
          </button>

          <button
            onClick={clearTicketComments}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Ticket-Kommentare löschen
          </button>

          <button
            onClick={clearActivities}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Aktivitäten löschen
          </button>

          <button
            onClick={clearWikiPages}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Wiki-Dokumente löschen
          </button>

          <button
            onClick={clearWikiTrash}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Papierkorb leeren
          </button>

          <button
            onClick={clearFiles}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Dateien löschen
          </button>

          <button
            onClick={clearUser}
            className="bg-white border border-zinc-200 px-5 py-4 rounded-2xl hover:bg-red-50 transition text-left"
          >
            Benutzer-Setup löschen
          </button>
        </div>
      </div>

      {/* DANGER */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-red-800">
          Gefahrenbereich
        </h2>

        <p className="text-red-700 mt-2">
          Diese Aktion löscht alle lokalen Demo-Daten dieses Browsers.
        </p>

        <button
          onClick={clearAllDemoData}
          className="mt-6 bg-red-600 text-white px-6 py-4 rounded-2xl hover:bg-red-500 transition"
        >
          Alle lokalen Demo-Daten löschen
        </button>
      </div>
    </div>
  );
}