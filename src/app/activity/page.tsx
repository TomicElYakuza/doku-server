"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../components/AccessDeniedCard";
import FeatureGate from "../../components/FeatureGate";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import {
  activityRepository,
} from "../../lib/activityRepository";
import {
  companyRepository,
} from "../../lib/companyRepository";
import {
  canViewActivity,
} from "../../lib/permissions";
import type {
  Activity,
} from "../../types/activity";
import type {
  Company,
  Department,
} from "../../types/company";

type ViewMode = "table" | "cards";

function getActivityIcon(type: string) {
  if (type === "created") {
    return "＋";
  }

  if (type === "edited" || type === "updated") {
    return "✎";
  }

  if (type === "deleted") {
    return "−";
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

function getActivityTone(type: string) {
  if (type === "created") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (type === "edited" || type === "updated") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (type === "deleted") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (type === "restored") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (type === "login") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (type === "logout") {
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getEntityLabel(entityType: string) {
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

  if (entityType === "file") {
    return "Datei";
  }

  return entityType || "Nicht gesetzt";
}

function getEntityTone(entityType: string) {
  if (entityType === "ticket") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (entityType === "wiki") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }

  if (entityType === "news") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  if (
    entityType === "company" ||
    entityType === "department"
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (entityType === "adminUser") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (entityType === "settings") {
    return "bg-purple-50 text-purple-700 border-purple-100";
  }

  if (entityType === "file") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getEntityHref(activity: Activity) {
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
    return `/wiki/${encodeURIComponent(activity.entityId)}`;
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

  if (activity.entityType === "file") {
    return "/files";
  }

  return "";
}

function formatMetadata(metadata: unknown) {
  if (!metadata) {
    return "";
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "";
  }
}

export default function ActivityPage() {
  const [mounted, setMounted] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
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
      handleActivitiesUpdated,
    );
    window.addEventListener(
      "companiesUpdated",
      handleCompaniesUpdated,
    );
    window.addEventListener(
      "departmentsUpdated",
      handleDepartmentsUpdated,
    );

    return () => {
      window.removeEventListener(
        "activitiesUpdated",
        handleActivitiesUpdated,
      );
      window.removeEventListener(
        "companiesUpdated",
        handleCompaniesUpdated,
      );
      window.removeEventListener(
        "departmentsUpdated",
        handleDepartmentsUpdated,
      );
    };
  }, []);

  async function loadOrganization() {
    try {
      const [
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(
        "Organisation konnte nicht geladen werden:",
        loadError,
      );
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        nextActivities,
        nextCompanies,
        nextDepartments,
      ] = await Promise.all([
        activityRepository.list(),
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setActivities(Array.isArray(nextActivities) ? nextActivities : []);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Aktivitäten konnten nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("");
    setEntityFilter("");
    setCompanyFilter("");
    setDepartmentFilter("");
  }

  function getCompanyName(companyId?: string) {
    if (!companyId) {
      return "";
    }

    return (
      companies.find((company) => company.id === companyId)?.name ||
      ""
    );
  }

  function getDepartmentName(departmentId?: string) {
    if (!departmentId) {
      return "";
    }

    return (
      departments.find((department) => department.id === departmentId)?.name ||
      ""
    );
  }

  const filteredDepartments = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter(
      (department) => department.companyId === companyFilter,
    );
  }, [
    departments,
    companyFilter,
  ]);

  const activityTypes = useMemo(
    () =>
      Array.from(
        new Set(
          activities.map((activity) => activity.type),
        ),
      ).filter(Boolean),
    [
      activities,
    ],
  );

  const entityTypes = useMemo(
    () =>
      Array.from(
        new Set(
          activities.map((activity) => activity.entityType),
        ),
      ).filter(Boolean),
    [
      activities,
    ],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const companyName =
        getCompanyName(activity.companyId) ||
        activity.company ||
        "";
      const departmentName =
        getDepartmentName(activity.departmentId) ||
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
          formatMetadata(activity.metadata),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

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
    });
  }, [
    activities,
    search,
    typeFilter,
    entityFilter,
    companyFilter,
    departmentFilter,
    companies,
    departments,
  ]);

  const createdCount = activities.filter(
    (activity) => activity.type === "created",
  ).length;

  const editedCount = activities.filter(
    (activity) =>
      activity.type === "edited" ||
      activity.type === "updated",
  ).length;

  const deletedCount = activities.filter(
    (activity) => activity.type === "deleted",
  ).length;

  const loginCount = activities.filter(
    (activity) => activity.type === "login",
  ).length;

  const latestActivity = activities[0];

  if (!mounted) {
    return null;
  }

  if (!canViewActivity()) {
    return (
      <AccessDeniedCard
        title="Aktivitätsprotokoll"
        description="Du hast keine Berechtigung, Aktivitäten zu sehen."
        backHref="/dashboard"
        backLabel="Zum Dashboard"
      />
    );
  }

  return (
    <FeatureGate
      feature="activityLog"
      fallback={
        <AccessDeniedCard
          title="Aktivitätsprotokoll deaktiviert"
          description="Dieses Modul ist aktuell in den Einstellungen deaktiviert."
          backHref="/dashboard"
          backLabel="Zum Dashboard"
        />
      }
    >
      <div className="space-y-8">
        <PageHero
          eyebrow="Systemprotokoll"
          title="Aktivitätsprotokoll"
          description="Nachvollziehbare Systemaktionen, Benutzeraktivitäten und Änderungen im Velunis Workspace."
          badges={[
            {
              label: `${activities.length} Einträge`,
            },
            {
              label: `${createdCount} erstellt`,
            },
            {
              label: `${editedCount} bearbeitet`,
            },
            {
              label: latestActivity
                ? `Neueste: ${latestActivity.createdAt}`
                : "Noch keine Aktivität",
            },
          ]}
          actions={
            <button
              type="button"
              onClick={() => void loadData()}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
            >
              Aktualisieren
            </button>
          }
        />

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Erstellt"
            value={createdCount}
            description="Neue Objekte"
            icon="＋"
            tone="green"
            active={typeFilter === "created"}
            onClick={() => setTypeFilter("created")}
          />

          <StatCard
            label="Bearbeitet"
            value={editedCount}
            description="Änderungen"
            icon="✎"
            tone="blue"
            active={
              typeFilter === "edited" ||
              typeFilter === "updated"
            }
            onClick={() => setTypeFilter("edited")}
          />

          <StatCard
            label="Gelöscht"
            value={deletedCount}
            description="Entfernte Objekte"
            icon="−"
            tone="red"
            active={typeFilter === "deleted"}
            onClick={() => setTypeFilter("deleted")}
          />

          <StatCard
            label="Logins"
            value={loginCount}
            description="Anmeldungen"
            icon="→"
            tone="indigo"
            active={typeFilter === "login"}
            onClick={() => setTypeFilter("login")}
          />
        </div>

        <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold">
                Suche & Filter
              </h2>
              <p className="text-zinc-500 mt-1">
                Filtere Aktivitäten nach Typ, Bereich, Firma, Abteilung oder Benutzer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-xl transition font-medium ${
                  viewMode === "table"
                    ? "app-accent-bg text-white app-brand-shadow"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                }`}
              >
                Tabelle
              </button>

              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded-xl transition font-medium ${
                  viewMode === "cards"
                    ? "app-accent-bg text-white app-brand-shadow"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                }`}
              >
                Karten
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
              >
                Zurücksetzen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mt-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Aktivitäten suchen..."
              className="xl:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">
                Alle Typen
              </option>

              {activityTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {activityRepository.getTypeLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">
                Alle Bereiche
              </option>

              {entityTypes.map((entityType) => (
                <option
                  key={entityType}
                  value={entityType}
                >
                  {getEntityLabel(entityType)}
                </option>
              ))}
            </select>

            <select
              value={companyFilter}
              onChange={(event) => {
                setCompanyFilter(event.target.value);
                setDepartmentFilter("");
              }}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">
                Alle Firmen
              </option>

              {companies.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">
                Alle Abteilungen
              </option>

              {filteredDepartments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="text-sm text-zinc-500">
              {filteredActivities.length} von {activities.length} Aktivitäten gefunden.
            </span>

            {search && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Suche: {search}
              </span>
            )}

            {typeFilter && (
              <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                Typ: {activityRepository.getTypeLabel(typeFilter)}
              </span>
            )}

            {entityFilter && (
              <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                Bereich: {getEntityLabel(entityFilter)}
              </span>
            )}
          </div>
        </section>

        {!loading && filteredActivities.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-2xl">
              🔎
            </div>

            <h2 className="text-xl font-semibold mt-5">
              Keine Aktivitäten gefunden
            </h2>
            <p className="text-zinc-500 mt-2">
              Es gibt keine passenden Einträge.
            </p>
          </div>
        )}

        {viewMode === "table" && filteredActivities.length > 0 && (
          <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Aktivität
                    </th>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Bereich
                    </th>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Benutzer
                    </th>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Organisation
                    </th>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Zeitpunkt
                    </th>
                    <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                      Aktion
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {filteredActivities.map((activity) => {
                    const href = getEntityHref(activity);
                    const companyName =
                      getCompanyName(activity.companyId) ||
                      activity.company ||
                      "";
                    const departmentName =
                      getDepartmentName(activity.departmentId) ||
                      activity.department ||
                      "";

                    return (
                      <tr
                        key={activity.id}
                        className="hover:bg-zinc-50 transition"
                      >
                        <td className="px-5 py-4 align-top min-w-[320px]">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-2xl border flex items-center justify-center font-black ${getActivityTone(
                                activity.type,
                              )}`}
                            >
                              {getActivityIcon(activity.type)}
                            </div>

                            <div>
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`text-xs px-3 py-1 rounded-full border font-bold ${getActivityTone(
                                    activity.type,
                                  )}`}
                                >
                                  {activityRepository.getTypeLabel(activity.type)}
                                </span>
                              </div>

                              <p className="font-black text-zinc-950 mt-2">
                                {activity.title}
                              </p>

                              <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                                {activity.description || "Keine Beschreibung vorhanden."}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getEntityTone(
                              activity.entityType,
                            )}`}
                          >
                            {getEntityLabel(activity.entityType)}
                          </span>

                          {activity.entityId && (
                            <p className="text-xs text-zinc-400 mt-2">
                              ID: {activity.entityId}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="font-bold text-zinc-900">
                            {activity.user || activity.userName || "System"}
                          </p>
                          {activity.userEmail && (
                            <p className="text-sm text-zinc-500 mt-1 break-all">
                              {activity.userEmail}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 align-top text-sm text-zinc-500">
                          <p>
                            {companyName || "Intern"}
                          </p>
                          <p className="mt-1">
                            {departmentName || "Keine Abteilung"}
                          </p>
                        </td>

                        <td className="px-5 py-4 align-top text-sm text-zinc-500">
                          {activity.createdAt}
                        </td>

                        <td className="px-5 py-4 align-top">
                          {href ? (
                            <Link
                              href={href}
                              className="bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition font-bold"
                            >
                              Öffnen
                            </Link>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {viewMode === "cards" && filteredActivities.length > 0 && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredActivities.map((activity) => {
              const href = getEntityHref(activity);
              const companyName =
                getCompanyName(activity.companyId) ||
                activity.company ||
                "";
              const departmentName =
                getDepartmentName(activity.departmentId) ||
                activity.department ||
                "";

              const content = (
                <article className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition h-full">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getActivityTone(
                            activity.type,
                          )}`}
                        >
                          {activityRepository.getTypeLabel(activity.type)}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getEntityTone(
                            activity.entityType,
                          )}`}
                        >
                          {getEntityLabel(activity.entityType)}
                        </span>

                        {companyName && (
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                            {companyName}
                          </span>
                        )}

                        {departmentName && (
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                            {departmentName}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black mt-4 line-clamp-2">
                        {getActivityIcon(activity.type)} {activity.title}
                      </h2>

                      <p className="text-zinc-500 mt-2 line-clamp-3">
                        {activity.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </div>

                    {href && (
                      <span className="shrink-0 text-sm font-bold app-accent-text">
                        Öffnen →
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Benutzer
                      </p>
                      <p className="font-bold mt-1 line-clamp-1">
                        {activity.user || activity.userName || "System"}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Zeitpunkt
                      </p>
                      <p className="font-bold mt-1 line-clamp-1">
                        {activity.createdAt}
                      </p>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">
                        Objekt-ID
                      </p>
                      <p className="font-bold mt-1 line-clamp-1">
                        {activity.entityId || "-"}
                      </p>
                    </div>
                  </div>
                </article>
              );

              if (href) {
                return (
                  <Link
                    key={activity.id}
                    href={href}
                    className="block"
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
            })}
          </section>
        )}
      </div>
    </FeatureGate>
  );
}