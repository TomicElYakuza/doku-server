"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  activityRepository,
} from "../../lib/activityRepository";

import {
  companyRepository,
} from "../../lib/companyRepository";

import {
  canViewActivity,
} from "../../lib/permissions";

import AccessDeniedCard from "../../components/AccessDeniedCard";

import type {
  Activity,
} from "../../types/activity";

import type {
  Company,
  Department,
} from "../../types/company";

function getActivityIcon(
  type: string
) {
  if (type === "created") {
    return "＋";
  }

  if (type === "edited") {
    return "✎";
  }

  if (type === "deleted") {
    return "🗑";
  }

  if (type === "restored") {
    return "↺";
  }

  if (type === "login") {
    return "→";
  }

  if (type === "logout") {
    return "←";
  }

  return "•";
}

function getEntityLabel(
  entityType: string
) {
  if (entityType === "ticket") {
    return "Ticket";
  }

  if (entityType === "wiki") {
    return "Wiki";
  }

  if (entityType === "news") {
    return "News";
  }

  if (entityType === "company") {
    return "Firma";
  }

  if (entityType === "department") {
    return "Abteilung";
  }

  if (entityType === "adminUser") {
    return "Benutzer";
  }

  if (entityType === "settings") {
    return "Einstellungen";
  }

  if (entityType === "storage") {
    return "System";
  }

  return entityType ||
    "Allgemein";
}

function getEntityHref(
  activity: Activity
) {
  if (
    activity.entityType === "ticket" &&
    activity.entityId
  ) {
    return `/tickets/${activity.entityId}`;
  }

  if (
    activity.entityType === "wiki" &&
    activity.entityId
  ) {
    return `/wiki/${encodeURIComponent(
      activity.entityId
    )}`;
  }

  if (
    activity.entityType === "news" &&
    activity.entityId
  ) {
    return `/news/${activity.entityId}`;
  }

  if (
    activity.entityType === "company" ||
    activity.entityType === "department"
  ) {
    return "/admin/companies";
  }

  if (activity.entityType === "adminUser") {
    return "/admin/users";
  }

  if (activity.entityType === "settings") {
    return "/settings";
  }

  return "";
}

export default function ActivityPage() {
  const [mounted, setMounted] =
    useState(false);

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

  const [entityFilter, setEntityFilter] =
    useState("");

  const [companyFilter, setCompanyFilter] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setMounted(
      true
    );

    void loadData();

    function handleActivitiesUpdated() {
      void loadData();
    }

    function handleCompaniesUpdated() {
      void loadOrganization();
    }

    function handleDepartmentsUpdated() {
      void loadOrganization();
    }

    window.addEventListener(
      "activitiesUpdated",
      handleActivitiesUpdated
    );

    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated
    );

    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated
    );

    return () => {
      window.removeEventListener(
        "activitiesUpdated",
        handleActivitiesUpdated
      );

      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated
      );

      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated
      );
    };
  }, []);

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError
      );
    }
  }

  async function loadData() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const [
        nextActivities,
        nextCompanies,
        nextDepartments,
      ] =
        await Promise.all([
          activityRepository.list(),
          companyRepository.listCompanies(),
          companyRepository.listDepartments(),
        ]);

      setActivities(
        nextActivities
      );

      setCompanies(
        nextCompanies
      );

      setDepartments(
        nextDepartments
      );
    } catch (loadError) {
      console.error(
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Aktivitäten konnten nicht geladen werden."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setEntityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
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
      )?.name ||
      ""
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
      )?.name ||
      ""
    );
  }

  const filteredDepartments =
    useMemo(
      () => {
        if (!companyFilter) {
          return departments;
        }

        return departments.filter(
          (department) =>
            department.companyId === companyFilter
        );
      },
      [
        departments,
        companyFilter,
      ]
    );

  const activityTypes =
    useMemo(
      () =>
        Array.from(
          new Set(
            activities.map(
              (activity) =>
                activity.type
            )
          )
        ).filter(Boolean),
      [
        activities,
      ]
    );

  const entityTypes =
    useMemo(
      () =>
        Array.from(
          new Set(
            activities.map(
              (activity) =>
                activity.entityType
            )
          )
        ).filter(Boolean),
      [
        activities,
      ]
    );

  const filteredActivities =
    useMemo(
      () => {
        const query =
          search.trim().toLowerCase();

        return activities.filter(
          (activity) => {
            const companyName =
              getCompanyName(
                activity.companyId
              ) ||
              activity.company ||
              "";

            const departmentName =
              getDepartmentName(
                activity.departmentId
              ) ||
              activity.department ||
              "";

            const matchesSearch =
              !query ||
              [
                activity.id,
                activity.type,
                activity.title,
                activity.description,
                activity.entityType,
                activity.entityId,
                activity.userName,
                activity.userEmail,
                activity.user,
                activity.company,
                activity.department,
                companyName,
                departmentName,
                activity.createdAt,
                JSON.stringify(
                  activity.metadata ||
                    {}
                ),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );

            const matchesType =
              !typeFilter ||
              activity.type === typeFilter;

            const matchesEntity =
              !entityFilter ||
              activity.entityType === entityFilter;

            const matchesCompany =
              !companyFilter ||
              activity.companyId === companyFilter;

            const matchesDepartment =
              !departmentFilter ||
              activity.departmentId === departmentFilter;

            return (
              matchesSearch &&
              matchesType &&
              matchesEntity &&
              matchesCompany &&
              matchesDepartment
            );
          }
        );
      },
      [
        activities,
        search,
        typeFilter,
        entityFilter,
        companyFilter,
        departmentFilter,
        companies,
        departments,
      ]
    );

  const createdCount =
    activities.filter(
      (activity) =>
        activity.type === "created"
    ).length;

  const editedCount =
    activities.filter(
      (activity) =>
        activity.type === "edited"
    ).length;

  const deletedCount =
    activities.filter(
      (activity) =>
        activity.type === "deleted"
    ).length;

  const loginCount =
    activities.filter(
      (activity) =>
        activity.type === "login"
    ).length;

  if (!mounted) {
    return null;
  }

  if (!canViewActivity()) {
    return (
      <AccessDeniedCard />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-bold">
            Aktivität
          </h1>

          <p className="text-zinc-500 mt-2">
            Protokollierte Aktionen aus PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadData()
          }
          className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
        >
          Aktualisieren
        </button>
      </div>

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Aktivitäten werden geladen...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <button
          type="button"
          onClick={resetFilters}
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
            setTypeFilter(
              "created"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-green-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Erstellt
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {createdCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setTypeFilter(
              "edited"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-blue-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Bearbeitet
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {editedCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setTypeFilter(
              "deleted"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-red-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Gelöscht
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {deletedCount}
          </h2>
        </button>

        <button
          type="button"
          onClick={() =>
            setTypeFilter(
              "login"
            )
          }
          className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm text-left hover:bg-indigo-50 transition"
        >
          <p className="text-sm text-zinc-500">
            Logins
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {loginCount}
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
              Filtere Aktivitäten nach Typ, Bereich, Firma oder Abteilung.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
          >
            Zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Aktivitäten suchen..."
            className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
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

            {activityTypes.map(
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
            value={entityFilter}
            onChange={(event) =>
              setEntityFilter(
                event.target.value
              )
            }
            className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
          >
            <option value="">
              Alle Bereiche
            </option>

            {entityTypes.map(
              (entityType) => (
                <option
                  key={entityType}
                  value={entityType}
                >
                  {getEntityLabel(
                    entityType
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={companyFilter}
            onChange={(event) => {
              setCompanyFilter(
                event.target.value
              );

              setDepartmentFilter(
                ""
              );
            }}
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

            {filteredDepartments.map(
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

        <p className="text-sm text-zinc-500 mt-5">
          {filteredActivities.length} von {activities.length} Aktivitäten gefunden.
        </p>
      </div>

      <div className="space-y-4">
        {!loading && filteredActivities.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Keine Aktivitäten gefunden
            </h2>

            <p className="text-zinc-500 mt-2">
              Es gibt keine passenden Einträge.
            </p>
          </div>
        )}

        {filteredActivities.map(
          (activity) => {
            const href =
              getEntityHref(
                activity
              );

            const content = (
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:bg-zinc-50 transition">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl shrink-0">
                    {getActivityIcon(
                      activity.type
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${activityRepository.getTypeClass(activity.type)}`}>
                        {activityRepository.getTypeLabel(
                          activity.type
                        )}
                      </span>

                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        {getEntityLabel(
                          activity.entityType
                        )}
                      </span>

                      {activity.company && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {activity.company}
                        </span>
                      )}

                      {activity.department && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                          {activity.department}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold mt-4">
                      {activity.title}
                    </h2>

                    <p className="text-zinc-500 mt-2">
                      {activity.description ||
                        "Keine Beschreibung vorhanden."}
                    </p>

                    <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-4">
                      <span>
                        Benutzer:{" "}
                        {activity.user ||
                          activity.userName ||
                          "System"}
                      </span>

                      <span>
                        Zeitpunkt:{" "}
                        {activity.createdAt}
                      </span>

                      {activity.entityId && (
                        <span>
                          ID:{" "}
                          {activity.entityId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );

            if (href) {
              return (
                <Link
                  key={activity.id}
                  href={href}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={activity.id}>
                {content}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}