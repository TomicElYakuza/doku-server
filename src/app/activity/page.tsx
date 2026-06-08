"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../components/AccessDeniedCard";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
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

function getActivityIcon(type: string) {
  if (type === "created") {
    return "＋";
  }

  if (type === "edited" || type === "updated") {
    return "✎";
  }

  if (type === "deleted" || type === "deletedForever") {
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

  return entityType || "System";
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

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("de-AT");
  } catch {
    return value;
  }
}

function getCompanyLabel(
  activity: Activity,
  companies: Company[],
) {
  if (activity.company) {
    return activity.company;
  }

  if (!activity.companyId) {
    return "";
  }

  return (
    companies.find((company) => company.id === activity.companyId)?.name ||
    ""
  );
}

function getDepartmentLabel(
  activity: Activity,
  departments: Department[],
) {
  if (activity.department) {
    return activity.department;
  }

  if (!activity.departmentId) {
    return "";
  }

  return (
    departments.find(
      (department) => department.id === activity.departmentId,
    )?.name || ""
  );
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
      setDepartments(
        Array.isArray(nextDepartments) ? nextDepartments : [],
      );
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
      setDepartments(
        Array.isArray(nextDepartments) ? nextDepartments : [],
      );
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
      const companyName = getCompanyLabel(activity, companies);
      const departmentName = getDepartmentLabel(activity, departments);

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
          JSON.stringify(activity.metadata || {}),
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

  const createdCount = useMemo(
    () =>
      activities.filter((activity) => activity.type === "created")
        .length,
    [
      activities,
    ],
  );

  const editedCount = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.type === "edited" ||
          activity.type === "updated",
      ).length,
    [
      activities,
    ],
  );

  const deletedCount = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.type === "deleted" ||
          activity.type === "deletedForever",
      ).length,
    [
      activities,
    ],
  );

  const loginCount = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.type === "login" ||
          activity.type === "logout",
      ).length,
    [
      activities,
    ],
  );

  if (!mounted) {
    return null;
  }

  if (!canViewActivity()) {
    return (
      <AccessDeniedCard
        title="Aktivitätsprotokoll nicht verfügbar"
        description="Du hast keine Berechtigung, das Aktivitätsprotokoll zu sehen."
        backHref="/dashboard"
        backLabel="Zurück zum Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis Protokoll"
        title="Aktivitäten"
        description="Nachvollziehbare Systemereignisse, Änderungen und Benutzeraktionen aus PostgreSQL."
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
            label: `${filteredActivities.length} sichtbar`,
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
          description="Protokolleinträge, Firmen und Abteilungen werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Aktivitäten konnten nicht geladen werden"
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

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Erstellt"
              value={createdCount}
              description="Neue Einträge"
              icon="＋"
              tone="green"
              active={typeFilter === "created"}
              onClick={() => setTypeFilter("created")}
            />

            <StatCard
              label="Bearbeitet"
              value={editedCount}
              description="Aktualisierte Inhalte"
              icon="✎"
              tone="blue"
              active={typeFilter === "edited"}
              onClick={() => setTypeFilter("edited")}
            />

            <StatCard
              label="Gelöscht"
              value={deletedCount}
              description="Entfernte Einträge"
              icon="−"
              tone="red"
              active={typeFilter === "deleted"}
              onClick={() => setTypeFilter("deleted")}
            />

            <StatCard
              label="Login / Logout"
              value={loginCount}
              description="Benutzer-Sitzungen"
              icon="→"
              tone="indigo"
              active={typeFilter === "login"}
              onClick={() => setTypeFilter("login")}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Suche & Filter
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Filtere Aktivitäten nach Typ, Bereich, Firma oder Abteilung.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition font-medium"
                >
                  Zurücksetzen
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 mt-6">
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
                  onChange={(event) =>
                    setDepartmentFilter(event.target.value)
                  }
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
            </div>
          </section>

          {filteredActivities.length === 0 && (
            <EmptyState
              icon="📊"
              title="Keine Aktivitäten gefunden"
              description="Es gibt keine passenden Einträge. Passe Suche oder Filter an."
            />
          )}

          {filteredActivities.length > 0 && (
            <section className="space-y-4">
              {filteredActivities.map((activity) => {
                const href = getEntityHref(activity);
                const companyLabel = getCompanyLabel(activity, companies);
                const departmentLabel = getDepartmentLabel(
                  activity,
                  departments,
                );

                const content = (
                  <article className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition overflow-hidden relative">
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold ${activityRepository.getTypeClass(
                              activity.type,
                            )}`}
                          >
                            {activityRepository.getTypeLabel(activity.type)}
                          </span>

                          <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full font-bold">
                            {getEntityLabel(activity.entityType)}
                          </span>

                          {companyLabel && (
                            <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                              {companyLabel}
                            </span>
                          )}

                          {departmentLabel && (
                            <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                              {departmentLabel}
                            </span>
                          )}
                        </div>

                        <h2 className="text-2xl font-black tracking-[-0.03em] text-zinc-950 mt-4">
                          <span className="mr-2 app-accent-text">
                            {getActivityIcon(activity.type)}
                          </span>
                          {activity.title}
                        </h2>

                        <p className="text-zinc-500 mt-3 leading-7">
                          {activity.description ||
                            "Keine Beschreibung vorhanden."}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 text-sm">
                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              Benutzer
                            </p>
                            <p className="font-black text-zinc-950 mt-1 break-all">
                              {activity.user ||
                                activity.userName ||
                                "System"}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              Zeitpunkt
                            </p>
                            <p className="font-black text-zinc-950 mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>

                          <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-xs text-zinc-500">
                              ID
                            </p>
                            <p className="font-black text-zinc-950 mt-1 break-all">
                              {activity.entityId || activity.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {href && (
                        <Link
                          href={href}
                          className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow shrink-0"
                        >
                          Öffnen
                        </Link>
                      )}
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
        </>
      )}
    </div>
  );
}
