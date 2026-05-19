"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  canManageSystem,
  canViewAdmin,
} from "../../../lib/permissions";

import {
  clearNotifications,
  removeNotification,
} from "../../../lib/notificationHelpers";

import type {
  NotificationMessage,
  NotificationType,
} from "../../../lib/notificationHelpers";

import {
  confirmAction,
  confirmDelete,
} from "../../../lib/confirmHelpers";

import {
  notifySuccess,
  notifyWarning,
} from "../../../lib/notificationHelpers";

import {
  useDataList,
} from "../../../hooks/useDataList";

import AccessDeniedCard from "../../../components/AccessDeniedCard";

type ViewMode =
  | "cards"
  | "table";

function getTypeLabel(
  type: NotificationType
) {
  if (type === "success") {
    return "Erfolg";
  }

  if (type === "error") {
    return "Fehler";
  }

  if (type === "warning") {
    return "Warnung";
  }

  return "Info";
}

function getTypeClass(
  type: NotificationType
) {
  if (type === "success") {
    return "bg-green-50 text-green-700";
  }

  if (type === "error") {
    return "bg-red-50 text-red-700";
  }

  if (type === "warning") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-blue-50 text-blue-700";
}

export default function AdminNotificationsPage() {
  const {
    data: notifications,
    loading,
    error,
    reload,
  } = useDataList<NotificationMessage>(
    "notification"
  );

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");

  function resetFilters() {
    setSearch("");

    setTypeFilter("");
  }

  function handleDeleteNotification(
    notification: NotificationMessage
  ) {
    if (!canManageSystem()) {
      notifyWarning(
        "Keine Berechtigung",
        "Du hast keine Berechtigung, Benachrichtigungen zu löschen."
      );

      return;
    }

    const confirmed =
      confirmDelete(
        `Benachrichtigung "${notification.title}"`
      );

    if (!confirmed) {
      return;
    }

    removeNotification(
      notification.id
    );

    notifySuccess(
      "Benachrichtigung gelöscht",
      `"${notification.title}" wurde entfernt.`
    );

    reload();
  }

  function handleClearNotifications() {
    if (!canManageSystem()) {
      notifyWarning(
        "Keine Berechtigung",
        "Du hast keine Berechtigung, Benachrichtigungen zu löschen."
      );

      return;
    }

    const confirmed =
      confirmAction(
        "Alle Benachrichtigungen wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    clearNotifications();

    notifySuccess(
      "Benachrichtigungen gelöscht",
      "Alle gespeicherten Benachrichtigungen wurden entfernt."
    );

    reload();
  }

  const filteredNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) => {
            const query =
              search
                .trim()
                .toLowerCase();

            const matchesSearch =
              !query ||
              notification.title
                .toLowerCase()
                .includes(query) ||
              String(notification.description || "")
                .toLowerCase()
                .includes(query) ||
              notification.type
                .toLowerCase()
                .includes(query) ||
              notification.createdAt
                .toLowerCase()
                .includes(query);

            const matchesType =
              !typeFilter ||
              notification.type === typeFilter;

            return (
              matchesSearch &&
              matchesType
            );
          }
        ),
      [
        notifications,
        search,
        typeFilter,
      ]
    );

  const successCount =
    notifications.filter(
      (notification) =>
        notification.type === "success"
    ).length;

  const errorCount =
    notifications.filter(
      (notification) =>
        notification.type === "error"
    ).length;

  const warningCount =
    notifications.filter(
      (notification) =>
        notification.type === "warning"
    ).length;

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        backHref="/admin"
        backLabel="Zurück zum Admin-Dashboard"
        description="Du hast mit deiner aktuellen Rolle keine Berechtigung für die Benachrichtigungs-Verwaltung."
      />
    );
  }

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
          benachrichtigungen
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
            Benachrichtigungen
          </h1>

          <p className="text-zinc-500 mt-2">
            Gespeicherte Systemmeldungen, Toasts und Hinweise verwalten
          </p>
        </div>

        {canManageSystem() && (
          <button
            onClick={handleClearNotifications}
            className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
          >
            Alle löschen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() =>
            setTypeFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {notifications.length}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Meldungen
          </p>
        </button>

        <button
          onClick={() =>
            setTypeFilter(
              "success"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Erfolg
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {successCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setTypeFilter(
              "warning"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-amber-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Warnungen
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {warningCount}
          </h2>
        </button>

        <button
          onClick={() =>
            setTypeFilter(
              "error"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Fehler
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {errorCount}
          </h2>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Suche & Filter
            </h2>

            <p className="text-zinc-500 mt-1">
              Filtere Benachrichtigungen nach Text und Typ.
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
            placeholder="Nach Titel, Beschreibung, Typ oder Datum suchen..."
            className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Typen
            </option>

            <option value="success">
              Erfolg
            </option>

            <option value="error">
              Fehler
            </option>

            <option value="warning">
              Warnung
            </option>

            <option value="info">
              Info
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredNotifications.length} von{" "}
            {notifications.length} Benachrichtigungen gefunden
          </p>

          <button
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500">
            Benachrichtigungen werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        viewMode === "cards" && (
          <div className="grid gap-4">
            {filteredNotifications.length === 0 && (
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <p className="text-zinc-500">
                  Keine Benachrichtigungen gefunden.
                </p>
              </div>
            )}

            {filteredNotifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getTypeClass(
                            notification.type
                          )}`}
                        >
                          {getTypeLabel(
                            notification.type
                          )}
                        </span>

                        <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                          {notification.createdAt}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold mt-4">
                        {notification.title}
                      </h2>

                      {notification.description && (
                        <p className="text-zinc-500 mt-2">
                          {notification.description}
                        </p>
                      )}
                    </div>

                    {canManageSystem() && (
                      <button
                        onClick={() =>
                          handleDeleteNotification(
                            notification
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition shrink-0"
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

      {!loading &&
        !error &&
        viewMode === "table" && (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Meldung
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Typ
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Zeitpunkt
                    </th>

                    <th className="px-5 py-4 font-semibold text-right">
                      Aktionen
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredNotifications.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-zinc-500"
                      >
                        Keine Benachrichtigungen gefunden.
                      </td>
                    </tr>
                  )}

                  {filteredNotifications.map(
                    (notification) => (
                      <tr
                        key={notification.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 min-w-[280px]">
                          <p className="font-semibold">
                            {notification.title}
                          </p>

                          {notification.description && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                              {notification.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getTypeClass(
                              notification.type
                            )}`}
                          >
                            {getTypeLabel(
                              notification.type
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          {notification.createdAt}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            {canManageSystem() && (
                              <button
                                onClick={() =>
                                  handleDeleteNotification(
                                    notification
                                  )
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
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