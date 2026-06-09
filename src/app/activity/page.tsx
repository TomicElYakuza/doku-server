"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import AccessDeniedCard from "../../components/AccessDeniedCard";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHero from "../../components/PageHero";
import StatCard from "../../components/StatCard";
import { activityRepository } from "../../lib/activityRepository";
import { companyRepository } from "../../lib/companyRepository";
import { canViewActivity } from "../../lib/permissions";
import type { Activity } from "../../types/activity";
import type { Company, Department } from "../../types/company";

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

  if (entityType === "company" || entityType === "department") {
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
  if (activity.entityType === "ticket" && activity.entityId) {
    return `/tickets/${activity.entityId}`;
  }

  if (activity.entityType === "wiki" && activity.entityId) {
    return `/wiki/${encodeURIComponent(activity.entityId)}`;
  }

  if (activity.entityType === "news" && activity.entityId) {
    return `/news/${activity.entityId}`;
  }

  if (activity.entityType === "company" || activity.entityType === "department") {
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

    window.addEventListener("activitiesUpdated", handleActivitiesUpdated);
    window.addEventListener("companiesUpdated", handleCompaniesUpdated);
    window.addEventListener("departmentsUpdated", handleDepartmentsUpdated);

    return () => {
      window.removeEventListener("activitiesUpdated", handleActivitiesUpdated);
      window.removeEventListener("companiesUpdated", handleCompaniesUpdated);
      window.removeEventListener("departmentsUpdated", handleDepartmentsUpdated);
    };
  }, []);

  async function loadOrganization() {
    try {
      const [nextCompanies, nextDepartments] = await Promise.all([
        companyRepository.listCompanies(),
        companyRepository.listDepartments(),
      ]);

      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setDepartments(Array.isArray(nextDepartments) ? nextDepartments : []);
    } catch (loadError) {
      console.error("Organisation konnte nicht geladen werden:", loadError);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [nextActivities, nextCompanies, nextDepartments] = await Promise.all([
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

    return companies.find((company) => company.id === companyId)?.name || "";
  }

  function getDepartmentName(departmentId?: string) {
    if (!departmentId) {
      return "";
    }

    return (
      departments.find((department) => department.id === departmentId)?.name || ""
    );
  }

  const filteredDepartments = useMemo(() => {
    if (!companyFilter) {
      return departments;
    }

    return departments.filter(
      (department) => department.companyId === companyFilter,
    );
  }, [departments, companyFilter]);

  const activityTypes = useMemo(
    () =>
      Array.from(new Set(activities.map((activity) => activity.type))).filter(
        Boolean,
      ),
    [activities],
  );

  const entityTypes = useMemo(
    () =>
      Array.from(
        new Set(activities.map((activity) => activity.entityType)),
      ).filter(Boolean),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const companyName =
        getCompanyName(activity.companyId) || activity.company || "";
      const departmentName =
        getDepartmentName(activity.departmentId) || activity.department || "";

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

      const matchesType = !typeFilter || activity.type === typeFilter;
      const matchesEntity = !entityFilter || activity.entityType === entityFilter;
      const matchesCompany = !companyFilter || activity.companyId === companyFilter;
      const matchesDepartment =
        !departmentFilter || activity.departmentId === departmentFilter;

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
    (activity) => activity.type === "edited" || activity.type === "updated",
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
    return <AccessDeniedCard />;
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Audit Log"
        title="Aktivitäten"
        description="Alle wichtigen Änderungen, Logins und Systemereignisse zentral nachvollziehen."
        badges={[
          {
            label: `${activities.length} Einträge`,
          },
          {
            label: latestActivity ? `Neuester Eintrag: ${latestActivity.createdAt}` : "Keine Einträge",
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
        <LoadingState
          title="Aktivitäten werden geladen..."
          description="Audit-Log, Organisation und Filter werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Fehler"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadData()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut laden
            </button>
          }
        />
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
          description="Geänderte Objekte"
          icon="✎"
          tone="blue"
          active={typeFilter === "edited"}
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
          tone="green"
          active={typeFilter === "login"}
          onClick={() => setTypeFilter("login")}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <h2 className="text-2xl font-black">Suche & Filter</h2>
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

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-5">
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
              <option value="">Alle Typen</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {activityRepository.getTypeLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">Alle Bereiche</option>
              {entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
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
              <option value="">Alle Firmen</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
            >
              <option value="">Alle Abteilungen</option>
              {filteredDepartments.map((department) => (
                <option key={department.id} value={department.id}>
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
        </div>
      </section>

      {!loading && !error && filteredActivities.length === 0 && (
        <EmptyState
          icon="🕓"
          title="Keine Aktivitäten gefunden"
          description="Es gibt keine passenden Einträge."
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Filter zurücksetzen
            </button>
          }
        />
      )}

      {viewMode === "table" && filteredActivities.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-4 font-bold text-zinc-500">Aktivität</th>
                  <th className="px-5 py-4 font-bold text-zinc-500">Bereich</th>
                  <th className="px-5 py-4 font-bold text-zinc-500">Benutzer</th>
                  <th className="px-5 py-4 font-bold text-zinc-500">Organisation</th>
                  <th className="px-5 py-4 font-bold text-zinc-500">Zeitpunkt</th>
                  <th className="px-5 py-4 font-bold text-zinc-500 text-right">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredActivities.map((activity) => {
                  const href = getEntityHref(activity);
                  const companyName =
                    getCompanyName(activity.companyId) || activity.company || "";
                  const departmentName =
                    getDepartmentName(activity.departmentId) ||
                    activity.department ||
                    "";

                  return (
                    <tr key={activity.id} className="hover:bg-zinc-50 transition">
                      <td className="px-5 py-4 align-top min-w-[320px]">
                        <div className="flex items-start gap-3">
                          <span
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center font-black shrink-0 ${getActivityTone(
                              activity.type,
                            )}`}
                          >
                            {getActivityIcon(activity.type)}
                          </span>
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
                            <p className="text-zinc-500 mt-1">
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
                          <p className="text-xs text-zinc-400 mt-2 break-all">
                            ID: {activity.entityId}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-bold">
                          {activity.user || activity.userName || "System"}
                        </p>
                        {activity.userEmail && (
                          <p className="text-xs text-zinc-500 mt-1">
                            {activity.userEmail}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="font-bold">{companyName || "Intern"}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {departmentName || "Keine Abteilung"}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-500 whitespace-nowrap">
                        {activity.createdAt}
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                          >
                            Öffnen
                          </Link>
                        ) : (
                          <span className="text-zinc-400">—</span>
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
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredActivities.map((activity) => {
            const href = getEntityHref(activity);
            const companyName =
              getCompanyName(activity.companyId) || activity.company || "";
            const departmentName =
              getDepartmentName(activity.departmentId) || activity.department || "";

            return (
              <article
                key={activity.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative"
              >
                <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
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
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                            {companyName}
                          </span>
                        )}
                        {departmentName && (
                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                            {departmentName}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black mt-4">
                        {getActivityIcon(activity.type)} {activity.title}
                      </h2>
                      <p className="text-zinc-500 mt-2">
                        {activity.description || "Keine Beschreibung vorhanden."}
                      </p>
                    </div>

                    {href && (
                      <Link
                        href={href}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow shrink-0"
                      >
                        Öffnen
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">Benutzer</p>
                      <p className="font-black mt-1">
                        {activity.user || activity.userName || "System"}
                      </p>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">Zeitpunkt</p>
                      <p className="font-black mt-1">{activity.createdAt}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4">
                      <p className="text-xs text-zinc-500">Objekt-ID</p>
                      <p className="font-black mt-1 break-all">
                        {activity.entityId || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}