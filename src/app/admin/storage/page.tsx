"use client";

import Link from "next/link";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  canManageSystem,
  canViewAdmin,
} from "../../../lib/permissions";

import {
  clearAllDmsStorage,
  clearStorageKey,
  downloadStorageExport,
  formatStorageSize,
  getStorageInfo,
  getTotalStorageItemCount,
  getTotalStorageSize,
  importStorageFromFile,
} from "../../../lib/storageManager";

import type {
  StorageInfo,
} from "../../../lib/storageManager";

import {
  saveStorageAllClearedActivity,
  saveStorageExportedActivity,
  saveStorageImportedActivity,
  saveStorageKeyClearedActivity,
} from "../../../lib/storageActivityHelpers";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

type ViewMode =
  | "cards"
  | "table";

function getAreaLabel(
  area: string
) {
  if (area === "wiki") {
    return "Wiki";
  }

  if (area === "tickets") {
    return "Tickets";
  }

  if (area === "ticketComments") {
    return "Ticket-Kommentare";
  }

  if (area === "ticketTemplates") {
    return "Ticket-Vorlagen";
  }

  if (area === "activities") {
    return "Aktivitäten";
  }

  if (area === "users") {
    return "Benutzer";
  }

  if (area === "companies") {
    return "Firmen";
  }

  if (area === "departments") {
    return "Abteilungen";
  }

  if (area === "settings") {
    return "Einstellungen";
  }

  if (area === "currentUser") {
    return "Aktueller Benutzer";
  }

  return "Sonstiges";
}

function getAreaClass(
  area: string
) {
  if (
    area === "wiki" ||
    area === "tickets" ||
    area === "ticketComments" ||
    area === "ticketTemplates"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    area === "users" ||
    area === "companies" ||
    area === "departments"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (area === "activities") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (area === "settings") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function AdminStoragePage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [mounted, setMounted] =
    useState(false);

  const [items, setItems] =
    useState<StorageInfo[]>([]);

  const [search, setSearch] =
    useState("");

  const [areaFilter, setAreaFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");

  useEffect(() => {
    setMounted(true);

    loadData();

    function handleStorageUpdated() {
      loadData();
    }

    window.addEventListener(
      "storageManagerUpdated",
      handleStorageUpdated
    );

    window.addEventListener(
      "storage",
      handleStorageUpdated
    );

    return () => {
      window.removeEventListener(
        "storageManagerUpdated",
        handleStorageUpdated
      );

      window.removeEventListener(
        "storage",
        handleStorageUpdated
      );
    };
  }, []);

  function loadData() {
    setItems(
      getStorageInfo()
    );
  }

  function resetFilters() {
    setSearch("");

    setAreaFilter("");
  }

  function handleExport() {
    downloadStorageExport();

    saveStorageExportedActivity();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed =
      confirm(
        "Import wirklich durchführen? Bestehende lokale DMS-Daten können überschrieben werden."
      );

    if (!confirmed) {
      event.target.value =
        "";

      return;
    }

    try {
      await importStorageFromFile(
        file
      );

      saveStorageImportedActivity();

      loadData();

      alert(
        "Import wurde erfolgreich durchgeführt."
      );
    } catch {
      alert(
        "Import fehlgeschlagen. Bitte prüfe, ob die Datei ein gültiger DMS-Export ist."
      );
    } finally {
      event.target.value =
        "";
    }
  }

  function handleClearKey(
    item: StorageInfo
  ) {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, Speicher zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        `"${item.label}" wirklich aus dem lokalen Speicher löschen?`
      );

    if (!confirmed) {
      return;
    }

    saveStorageKeyClearedActivity({
      key:
        item.key,

      label:
        item.label,

      area:
        item.area,

      itemCount:
        item.itemCount,

      size:
        item.size,
    });

    clearStorageKey(
      item.key
    );

    loadData();
  }

  function handleClearAll() {
    if (!canManageSystem()) {
      alert(
        "Du hast keine Berechtigung, den Speicher zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Wirklich alle lokalen DMS-Daten löschen? Diese Aktion betrifft Wiki, Tickets, Benutzer, Firmen, Einstellungen und Aktivitäten."
      );

    if (!confirmed) {
      return;
    }

    const confirmedAgain =
      confirm(
        "Letzte Bestätigung: Alle lokalen DMS-Daten werden entfernt."
      );

    if (!confirmedAgain) {
      return;
    }

    saveStorageAllClearedActivity();

    clearAllDmsStorage();

    loadData();

    alert(
      "Lokaler DMS-Speicher wurde gelöscht."
    );
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        backHref="/admin"
        backLabel="Zurück zum Admin-Dashboard"
        description="Du hast mit deiner aktuellen Rolle keine Berechtigung für die Speicherverwaltung."
      />
    );
  }

  const totalSize =
    getTotalStorageSize();

  const totalItems =
    getTotalStorageItemCount();

  const existingItems =
    items.filter(
      (item) =>
        item.exists
    ).length;

  const emptyItems =
    items.length -
    existingItems;

  const areas =
    Array.from(
      new Set(
        items.map(
          (item) =>
            item.area
        )
      )
    ).sort();

  const filteredItems =
    items.filter(
      (item) => {
        const query =
          search.toLowerCase();

        const matchesSearch =
          item.label
            .toLowerCase()
            .includes(query) ||
          item.key
            .toLowerCase()
            .includes(query) ||
          getAreaLabel(
            item.area
          )
            .toLowerCase()
            .includes(query);

        const matchesArea =
          !areaFilter ||
          item.area === areaFilter;

        return (
          matchesSearch &&
          matchesArea
        );
      }
    );

  return (
    <div className="space-y-8">
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

        <Link
          href="/admin"
          className="text-zinc-500 hover:text-zinc-900 transition"
        >
          admin
        </Link>

        <span className="text-zinc-400">
          /
        </span>

        <span className="text-zinc-900">
          speicher
        </span>
      </div>

      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Admin-Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Speicherverwaltung
          </h1>

          <p className="text-zinc-500 mt-2">
            Lokale Browser-Daten anzeigen, exportieren, importieren und löschen
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleExport}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            Exportieren
          </button>

          {canManageSystem() && (
            <>
              <button
                onClick={handleImportClick}
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
              >
                Importieren
              </button>

              <button
                onClick={handleClearAll}
                className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
              >
                Alles löschen
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-6 shadow-sm">
        <h2 className="font-semibold">
          Hinweis zu lokalen Daten
        </h2>

        <p className="text-sm mt-2 leading-relaxed">
          Diese App verwendet aktuell localStorage im Browser. Die Daten sind nur in diesem Browser vorhanden.
          Später kann dieser Bereich als Vorlage für Datenbank-Migration, Backups und Admin-Wartung dienen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() =>
            setAreaFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Speicherbereiche
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {items.length}
          </h2>
        </button>

        <button
          onClick={() =>
            setSearch("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Vorhanden
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {existingItems}
          </h2>
        </button>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Einträge
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {totalItems}
          </h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-zinc-500">
            Größe
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {formatStorageSize(
              totalSize
            )}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Leer: {emptyItems}
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere lokale Speicherbereiche nach Name, Key oder Bereich.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              onClick={() =>
                setViewMode(
                  "cards"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "cards"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Karten
            </button>

            <button
              onClick={() =>
                setViewMode(
                  "table"
                )
              }
              className={`px-4 py-2 rounded-xl transition ${
                viewMode === "table"
                  ? "bg-white shadow-sm"
                  : "hover:bg-zinc-200"
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Label, Key oder Bereich suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={areaFilter}
            onChange={(event) =>
              setAreaFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Bereiche
            </option>

            {areas.map(
              (area) => (
                <option
                  key={area}
                  value={area}
                >
                  {getAreaLabel(
                    area
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredItems.length} von{" "}
            {items.length} Speicherbereichen gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {viewMode === "cards" && (
        <div className="grid gap-4">
          {filteredItems.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Speicherbereiche gefunden.
              </p>
            </div>
          )}

          {filteredItems.map(
            (item) => (
              <div
                key={item.key}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getAreaClass(
                          item.area
                        )}`}
                      >
                        {getAreaLabel(
                          item.area
                        )}
                      </span>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          item.exists
                            ? "bg-green-50 text-green-700"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {item.exists
                          ? "Vorhanden"
                          : "Leer"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">
                      {item.label}
                    </h2>

                    <p className="text-zinc-500 mt-2 break-all">
                      {item.key}
                    </p>

                    <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                      <p>
                        Einträge:{" "}
                        {item.itemCount}
                      </p>

                      <p>
                        Größe:{" "}
                        {formatStorageSize(
                          item.size
                        )}
                      </p>

                      <p>
                        Status:{" "}
                        {item.exists
                          ? "Gespeichert"
                          : "Nicht vorhanden"}
                      </p>
                    </div>
                  </div>

                  {canManageSystem() && (
                    <button
                      onClick={() =>
                        handleClearKey(
                          item
                        )
                      }
                      disabled={!item.exists}
                      className={`px-4 py-2 rounded-xl transition shrink-0 ${
                        item.exists
                          ? "bg-red-600 text-white hover:bg-red-500"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Bereich
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Label
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Key
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Einträge
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Größe
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold text-right">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-zinc-500"
                    >
                      Keine Speicherbereiche gefunden.
                    </td>
                  </tr>
                )}

                {filteredItems.map(
                  (item) => (
                    <tr
                      key={item.key}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getAreaClass(
                            item.area
                          )}`}
                        >
                          {getAreaLabel(
                            item.area
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold whitespace-nowrap">
                        {item.label}
                      </td>

                      <td className="px-5 py-4 text-zinc-500 break-all">
                        {item.key}
                      </td>

                      <td className="px-5 py-4 text-zinc-600">
                        {item.itemCount}
                      </td>

                      <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                        {formatStorageSize(
                          item.size
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            item.exists
                              ? "bg-green-50 text-green-700"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {item.exists
                            ? "Vorhanden"
                            : "Leer"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          {canManageSystem() && (
                            <button
                              onClick={() =>
                                handleClearKey(
                                  item
                                )
                              }
                              disabled={!item.exists}
                              className={`px-3 py-2 rounded-xl transition ${
                                item.exists
                                  ? "bg-red-600 text-white hover:bg-red-500"
                                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                              }`}
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}