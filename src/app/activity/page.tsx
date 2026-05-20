"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  activityRepository,
} from "../../lib/activityRepository";

import type {
  Activity,
} from "../../lib/activityStorage";

import {
  companyRepository,
} from "../../lib/companyRepository";

import type {
  Company,
  Department,
} from "../../lib/companyStorage";

import {
  canDelete,
  canViewActivity,
} from "../../lib/permissions";

import {
  isActivityLogEnabled,
} from "../../lib/featureFlags";

type ViewMode =
  | "cards"
  | "table";

export default function ActivityPage() {
  const [mounted, setMounted] =
    useState(false);

  const [activityLogEnabled, setActivityLogEnabled] =
    useState(true);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");

  useEffect(() => {
    setMounted(true);

    loadData();

    setActivityLogEnabled(
      isActivityLogEnabled()
    );

    function handleActivityUpdated() {
      loadData();
    }

    function handleCompaniesUpdated() {
      loadData();
    }

    function handleDepartmentsUpdated() {
      loadData();
    }

    function handleSettingsUpdated() {
      setActivityLogEnabled(
        isActivityLogEnabled()
      );
    }

    window.addEventListener(
      "activityUpdated",
      handleActivityUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    window.addEventListener(
      "appSettingsUpdated",
      handleSettingsUpdated
    );

    return () => {
      window.removeEventListener(
        "activityUpdated",
        handleActivityUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );

      window.removeEventListener(
        "appSettingsUpdated",
        handleSettingsUpdated
      );
    };
  }, []);

  function loadData() {
    setActivities(
      activityRepository.list()
    );

    setCompanies(
      companyRepository.listCompanies()
    );

    setDepartments(
      companyRepository.listDepartments()
    );
  }

  function getCompanyName(
    companyId?: string
  ) {
    if (!companyId) {
      return "";
    }

    return (
      companies.find(
        (company) =>
          company.id === companyId
      )?.name || ""
    );
  }

  function getDepartmentName(
    departmentId?: string
  ) {
    if (!departmentId) {
      return "";
    }

    return (
      departments.find(
        (department) =>
          department.id === departmentId
      )?.name || ""
    );
  }

  function getActivityCompany(
    activity: Activity
  ) {
    return (
      activity.company ||
      getCompanyName(
        activity.companyId
      ) ||
      "Intern"
    );
  }

  function getActivityDepartment(
    activity: Activity
  ) {
    return (
      activity.department ||
      getDepartmentName(
        activity.departmentId
      ) ||
      "Allgemein"
    );
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function handleDeleteActivity(
    activity: Activity
  ) {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Aktivitäten zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Aktivität wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    activityRepository.delete(
      activity.id
    );
  }

  function handleClearActivities() {
    if (!canDelete()) {
      alert(
        "Du hast keine Berechtigung, Aktivitäten zu löschen."
      );

      return;
    }

    const confirmed =
      confirm(
        "Alle Aktivitäten wirklich löschen?"
      );

    if (!confirmed) {
      return;
    }

    activityRepository.clear();
  }

  if (!mounted) {
    return null;
  }

  if (!activityLogEnabled) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Aktivitätslog deaktiviert
          </h1>

          <p className="text-zinc-500 mt-3">
            Das Aktivitätslog ist aktuell in den Einstellungen deaktiviert.
          </p>

          <Link
            href="/settings"
            className="inline-flex mt-6 bg-zinc-900 text-white px-5 py-3 rounded-2xl hover:bg-zinc-700 transition"
          >
            Zu den Einstellungen
          </Link>
        </div>
      </div>
    );
  }

  if (!canViewActivity()) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
          >
            ← Zurück zum Dashboard
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold">
            Kein Zugriff
          </h1>

          <p className="text-zinc-500 mt-3">
            Du hast mit deiner aktuellen Rolle keine Berechtigung für das Aktivitätslog.
          </p>
        </div>
      </div>
    );
  }

  const filteredActivities =
    activities.filter(
      (activity) => {
        const query =
          search.toLowerCase();

        const activityCompany =
          getActivityCompany(
            activity
          );

        const activityDepartment =
          getActivityDepartment(
            activity
          );

        const user =
          activity.userName ||
          activity.user ||
          "";

        const matchesSearch =
          !query ||
          activity.title
            .toLowerCase()
            .includes(
              query
            ) ||
          activity.description
            ?.toLowerCase()
            .includes(
              query
            ) ||
          activityRepository
            .getTypeLabel(
              activity.type
            )
            .toLowerCase()
            .includes(
              query
            ) ||
          activityCompany
            .toLowerCase()
            .includes(
              query
            ) ||
          activityDepartment
            .toLowerCase()
            .includes(
              query
            ) ||
          user
            .toLowerCase()
            .includes(
              query
            ) ||
          activity.userEmail
            ?.toLowerCase()
            .includes(
              query
            ) ||
          activity.entityType
            ?.toLowerCase()
            .includes(
              query
            ) ||
          activity.entityId
            ?.toLowerCase()
            .includes(
              query
            );

        const matchesType =
          !typeFilter ||
          activity.type === typeFilter;

        const matchesCompany =
          !companyFilter ||
          activity.companyId === companyFilter ||
          activity.company === getCompanyName(
            companyFilter
          );

        const matchesDepartment =
          !departmentFilter ||
          activity.departmentId === departmentFilter ||
          activity.department === getDepartmentName(
            departmentFilter
          );

        return (
          matchesSearch &&
          matchesType &&
          matchesCompany &&
          matchesDepartment
        );
      }
    );

  const ticketActivityCount =
    activities.filter(
      (activity) =>
        String(
          activity.type
        ).startsWith(
          "ticket"
        )
    ).length;

  const wikiActivityCount =
    activities.filter(
      (activity) =>
        String(
          activity.type
        ).startsWith(
          "wiki"
        ) ||
        activity.type === "created" ||
        activity.type === "updated" ||
        activity.type === "deleted" ||
        activity.type === "restored" ||
        activity.type === "commented"
    ).length;

  const userActivityCount =
    activities.filter(
      (activity) =>
        String(
          activity.type
        ).startsWith(
          "user"
        )
    ).length;

  const organizationActivityCount =
    activities.filter(
      (activity) =>
        String(
          activity.type
        ).startsWith(
          "company"
        ) ||
        String(
          activity.type
        ).startsWith(
          "department"
        )
    ).length;

  const availableTypes =
    Array.from(
      new Set(
        activities.map(
          (activity) =>
            activity.type
        )
      )
    ).sort();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold">
            Aktivitäten
          </h1>

          <p className="text-zinc-500 mt-2">
            Audit-Log für Wiki, Tickets, Kommentare, Benutzer und Systemaktionen
          </p>
        </div>

        {canDelete() && (
          <button
            type="button"
            onClick={handleClearActivities}
            className="bg-red-600 text-white px-5 py-3 rounded-2xl hover:bg-red-500 transition"
          >
            Alle löschen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <button
          type="button"
          onClick={() =>
            setTypeFilter("")
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-zinc-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Gesamt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {activities.length}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSearch(
              "ticket"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Tickets
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {ticketActivityCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSearch(
              "wiki"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Wiki
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {wikiActivityCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSearch(
              "benutzer"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-emerald-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Benutzer
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {userActivityCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setSearch(
              "firma"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Organisation
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {organizationActivityCount}
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
              Filtere Aktivitäten nach Text, Typ, Firma und Abteilung.
            </p>
          </div>

          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1">
            <button
              type="button"
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
              type="button"
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Nach Titel, Beschreibung, Benutzer, Firma oder Entity suchen..."
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

            {availableTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {activityRepository.getTypeLabel(
                    type
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={companyFilter}
            onChange={(event) =>
              setCompanyFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Firmen
            </option>

            {companies.map(
              (company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              )
            )}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Abteilungen
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <p className="text-sm text-zinc-500">
            {filteredActivities.length} von{" "}
            {activities.length} Aktivitäten gefunden
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      {viewMode === "cards" && (
        <div className="grid gap-4">
          {filteredActivities.length === 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500">
                Keine Aktivitäten gefunden.
              </p>
            </div>
          )}

          {filteredActivities.map(
            (activity) => {
              const activityCompany =
                getActivityCompany(
                  activity
                );

              const activityDepartment =
                getActivityDepartment(
                  activity
                );

              const user =
                activity.userName ||
                activity.user ||
                "Unbekannt";

              return (
                <div
                  key={activity.id}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${activityRepository.getTypeClass(activity.type)}`}>
                          {activityRepository.getTypeLabel(
                            activity.type
                          )}
                        </span>

                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                          {activityCompany}
                        </span>

                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {activityDepartment}
                        </span>

                        {activity.entityType && (
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                            {activity.entityType}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold mt-4">
                        {activity.title}
                      </h2>

                      <p className="text-zinc-500 mt-2">
                        {activity.description ||
                          "Keine Beschreibung"}
                      </p>

                      <div className="flex flex-wrap gap-6 text-sm text-zinc-500 mt-5">
                        <p>
                          Benutzer:{" "}
                          {user}
                        </p>

                        {activity.userEmail && (
                          <p>
                            E-Mail:{" "}
                            {activity.userEmail}
                          </p>
                        )}

                        <p>
                          Zeitpunkt:{" "}
                          {activity.createdAt}
                        </p>

                        {activity.entityId && (
                          <p>
                            Entity-ID:{" "}
                            {activity.entityId}
                          </p>
                        )}
                      </div>
                    </div>

                    {canDelete() && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteActivity(
                            activity
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-500 transition shrink-0"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              );
            }
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
                    Aktivität
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Typ
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Benutzer
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Firma
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Abteilung
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Entity
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
                {filteredActivities.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-zinc-500"
                    >
                      Keine Aktivitäten gefunden.
                    </td>
                  </tr>
                )}

                {filteredActivities.map(
                  (activity) => {
                    const activityCompany =
                      getActivityCompany(
                        activity
                      );

                    const activityDepartment =
                      getActivityDepartment(
                        activity
                      );

                    const user =
                      activity.userName ||
                      activity.user ||
                      "Unbekannt";

                    return (
                      <tr
                        key={activity.id}
                        className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 min-w-[260px]">
                          <p className="font-semibold">
                            {activity.title}
                          </p>

                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                            {activity.description ||
                              "Keine Beschreibung"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-3 py-1 rounded-full ${activityRepository.getTypeClass(activity.type)}`}>
                            {activityRepository.getTypeLabel(
                              activity.type
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {user}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {activityCompany}
                        </td>

                        <td className="px-5 py-4 text-zinc-600">
                          {activityDepartment}
                        </td>

                        <td className="px-5 py-4 text-zinc-500">
                          {activity.entityType ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                          {activity.createdAt}
                        </td>

                        <td className="px-5 py-4">
                          {canDelete() && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteActivity(
                                    activity
                                  )
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-500 transition"
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}