"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import PageHero from "../../../components/PageHero";
import StatCard from "../../../components/StatCard";
import {
  canViewAdmin,
} from "../../../lib/permissions";

type DatabaseTable = {
  table_name: string;
  row_count: string;
};

type DatabaseColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type DatabaseIndex = {
  tablename: string;
  indexname: string;
  indexdef: string;
};

type CheckItem = {
  tableName?: string;
  columnName?: string;
  exists: boolean;
};

type DatabaseStatus = {
  ok: boolean;
  status: string;
  database: {
    name: string | null;
    schema: string | null;
    time: string | null;
    version: string | null;
  };
  tables: DatabaseTable[];
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  migrations: {
    detectedTables: string[];
    hasMigrationTable: boolean;
  };
  checks: {
    expectedTables: CheckItem[];
    taxonomyColumns: CheckItem[];
    adminModuleColumns: CheckItem[];
    rolePermissionTemplateColumns: CheckItem[];
  };
  responseTimeMs: number;
  checkedAt: string;
  message?: string;
};

type ViewMode = "table" | "cards";
type SectionMode = "tables" | "columns" | "indexes";

function getStatusClass(ok: boolean) {
  if (ok) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  return "bg-red-50 text-red-700 border-red-100";
}

function getCheckClass(exists: boolean) {
  if (exists) {
    return "bg-green-50 text-green-700 border-green-100";
  }

  return "bg-red-50 text-red-700 border-red-100";
}

function getNullableClass(nullable: string) {
  if (nullable === "NO") {
    return "app-accent-bg text-white border-transparent app-brand-shadow";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function toSafeText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function formatNumber(value: string | number) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) {
    return "0";
  }

  return numberValue.toLocaleString("de-AT");
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

function getMissingCount(status: DatabaseStatus | null) {
  if (!status) {
    return 0;
  }

  return [
    ...status.checks.expectedTables,
    ...status.checks.taxonomyColumns,
    ...status.checks.adminModuleColumns,
    ...status.checks.rolePermissionTemplateColumns,
  ].filter((check) => !check.exists).length;
}

export default function AdminDatabasePage() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [selectedTable, setSelectedTable] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sectionMode, setSectionMode] = useState<SectionMode>("tables");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    void loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/database", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Datenbankstatus konnte nicht geladen werden.",
        );
      }

      setStatus(data);
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Datenbankstatus konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totalRows = useMemo(
    () =>
      status?.tables.reduce(
        (sum, table) => sum + Number(table.row_count || 0),
        0,
      ) || 0,
    [
      status,
    ],
  );

  const missingExpectedTables = useMemo(
    () =>
      status?.checks.expectedTables.filter((check) => !check.exists) ||
      [],
    [
      status,
    ],
  );

  const missingTaxonomyColumns = useMemo(
    () =>
      status?.checks.taxonomyColumns.filter((check) => !check.exists) ||
      [],
    [
      status,
    ],
  );

  const missingAdminModuleColumns = useMemo(
    () =>
      status?.checks.adminModuleColumns.filter(
        (check) => !check.exists,
      ) || [],
    [
      status,
    ],
  );

  const missingRoleTemplateColumns = useMemo(
    () =>
      status?.checks.rolePermissionTemplateColumns.filter(
        (check) => !check.exists,
      ) || [],
    [
      status,
    ],
  );

  const missingCount = getMissingCount(status);

  const selectedTableColumns = useMemo(() => {
    if (!status) {
      return [];
    }

    if (!selectedTable) {
      return status.columns;
    }

    return status.columns.filter(
      (column) => toSafeText(column.table_name) === selectedTable,
    );
  }, [
    status,
    selectedTable,
  ]);

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!status) {
      return [];
    }

    return status.tables.filter((table) => {
      if (!query) {
        return true;
      }

      return toSafeText(table.table_name).toLowerCase().includes(query);
    });
  }, [
    status,
    search,
  ]);

  const filteredColumns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return selectedTableColumns.filter((column) => {
      if (!query) {
        return true;
      }

      return [
        column.table_name,
        column.column_name,
        column.data_type,
        column.is_nullable,
        column.column_default,
      ]
        .map(toSafeText)
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    selectedTableColumns,
    search,
  ]);

  const filteredIndexes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!status) {
      return [];
    }

    return status.indexes.filter((index) => {
      const indexTableName = toSafeText(index.tablename);

      const matchesTable =
        !selectedTable ||
        indexTableName === selectedTable;

      const matchesSearch =
        !query ||
        [
          index.tablename,
          index.indexname,
          index.indexdef,
        ]
          .map(toSafeText)
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesTable && matchesSearch;
    });
  }, [
    status,
    selectedTable,
    search,
  ]);

  function resetFilters() {
    setSelectedTable("");
    setSearch("");
  }

  function handleBackToTables() {
    setSelectedTable("");
    setSectionMode("tables");
    setViewMode("table");
  }

  function handleShowColumns(tableName: unknown) {
    setSelectedTable(toSafeText(tableName));
    setSectionMode("columns");
  }

  function renderCheckGroup(
    title: string,
    checks: CheckItem[],
    type: "table" | "column",
  ) {
    const existingCount = checks.filter((check) => check.exists).length;
    const allExisting = checks.every((check) => check.exists);

    return (
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black">
                {title}
              </h3>

              <p className="text-zinc-500 mt-1">
                {existingCount} von {checks.length} vorhanden.
              </p>
            </div>

            <span
              className={`text-xs px-3 py-1 rounded-full border font-bold ${getCheckClass(
                allExisting,
              )}`}
            >
              {allExisting ? "OK" : "Prüfen"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {checks.map((check) => {
              const label =
                type === "table"
                  ? check.tableName
                  : check.columnName;

              return (
                <span
                  key={`${title}-${label}`}
                  className={`text-xs px-3 py-2 rounded-xl border font-medium ${getCheckClass(
                    check.exists,
                  )}`}
                >
                  {label}: {check.exists ? "OK" : "Fehlt"}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Datenbank nicht verfügbar"
        description="Du hast keine Berechtigung, den Datenbankstatus zu sehen."
        backHref="/admin"
        backLabel="Zurück zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Datenbank"
        description="PostgreSQL-Status, Tabellen, Spalten, Indexe und Systemchecks ohne sensible Zugangsdaten."
        badges={[
          {
            label: status?.database.schema || "public",
          },
          {
            label: `${status?.tables.length || 0} Tabellen`,
          },
          {
            label: `${formatNumber(totalRows)} Datensätze`,
          },
          {
            label:
              missingCount === 0
                ? "Systemchecks OK"
                : `${missingCount} Prüfungen offen`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition font-bold"
          >
            Neu prüfen
          </button>
        }
      />

      {loading && (
        <LoadingState
          title="Datenbankstatus wird geladen..."
          description="Tabellen, Spalten, Indexe und Systemchecks werden vorbereitet."
        />
      )}

      {error && (
        <EmptyState
          icon="⚠️"
          title="Datenbankstatus konnte nicht geladen werden"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadStatus()}
              className="app-accent-bg text-white px-5 py-3 rounded-2xl transition font-bold app-brand-shadow"
            >
              Erneut prüfen
            </button>
          }
        />
      )}

      {status && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Status"
              value={status.ok ? "Verbunden" : "Fehler"}
              description={status.status}
              icon={status.ok ? "✅" : "⚠️"}
              tone={status.ok ? "green" : "red"}
            />

            <StatCard
              label="Tabellen"
              value={status.tables.length}
              description="Gefundene Tabellen"
              icon="🗄️"
              tone="blue"
              active={sectionMode === "tables"}
              onClick={() => setSectionMode("tables")}
            />

            <StatCard
              label="Spalten"
              value={status.columns.length}
              description="Gefundene Spalten"
              icon="🧱"
              tone="purple"
              active={sectionMode === "columns"}
              onClick={() => setSectionMode("columns")}
            />

            <StatCard
              label="Indexe"
              value={status.indexes.length}
              description="Gefundene Indexdefinitionen"
              icon="🔎"
              tone="indigo"
              active={sectionMode === "indexes"}
              onClick={() => setSectionMode("indexes")}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Verbindung
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Statusinformationen ohne Host, Benutzername oder Passwort.
                  </p>
                </div>

                <span
                  className={`text-sm px-4 py-2 rounded-full border font-bold ${getStatusClass(
                    status.ok,
                  )}`}
                >
                  {status.ok ? "Verbunden" : "Fehler"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Datenbank
                  </p>
                  <p className="font-black mt-1 break-all">
                    {status.database.name || "-"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Schema
                  </p>
                  <p className="font-black mt-1">
                    {status.database.schema || "public"}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Datenbankzeit
                  </p>
                  <p className="font-black mt-1">
                    {formatDate(status.database.time)}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Letzte Prüfung
                  </p>
                  <p className="font-black mt-1">
                    {formatDate(status.checkedAt)}
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Antwortzeit
                  </p>
                  <p className="font-black mt-1">
                    {status.responseTimeMs} ms
                  </p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    Migrationen
                  </p>
                  <p className="font-black mt-1">
                    {status.migrations.hasMigrationTable
                      ? "Erkannt"
                      : "Nicht erkannt"}
                  </p>
                </div>

                <div className="md:col-span-2 bg-zinc-50 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500">
                    PostgreSQL-Version
                  </p>
                  <p className="font-black mt-1 break-words">
                    {status.database.version || "-"}
                  </p>
                </div>
              </div>

              {status.message && (
                <div className="mt-6 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-zinc-600">
                  {status.message}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-black">
                  Systemchecks
                </h2>

                <p className="text-zinc-500 mt-1">
                  Erwartete Tabellen und wichtige Spalten für Taxonomie, Admin-Module und Rollen-Vorlagen.
                </p>
              </div>

              <span
                className={`text-sm px-4 py-2 rounded-full border font-bold ${
                  missingCount === 0
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-red-50 text-red-700 border-red-100"
                }`}
              >
                {missingCount === 0
                  ? "Alles vorhanden"
                  : `${missingCount} fehlen`}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {renderCheckGroup(
                "Erwartete Tabellen",
                status.checks.expectedTables,
                "table",
              )}

              {renderCheckGroup(
                "Taxonomie-Spalten",
                status.checks.taxonomyColumns,
                "column",
              )}

              {renderCheckGroup(
                "Admin-Module-Spalten",
                status.checks.adminModuleColumns,
                "column",
              )}

              {renderCheckGroup(
                "Rollen-Vorlagen-Spalten",
                status.checks.rolePermissionTemplateColumns,
                "column",
              )}
            </div>

            {missingCount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-700">
                <h3 className="font-black">
                  Offene Prüfungen
                </h3>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4 text-sm">
                  {missingExpectedTables.length > 0 && (
                    <div>
                      <p className="font-bold">
                        Fehlende Tabellen
                      </p>
                      <p className="mt-1">
                        {missingExpectedTables
                          .map((check) => check.tableName)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {missingTaxonomyColumns.length > 0 && (
                    <div>
                      <p className="font-bold">
                        Fehlende Taxonomie-Spalten
                      </p>
                      <p className="mt-1">
                        {missingTaxonomyColumns
                          .map((check) => check.columnName)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {missingAdminModuleColumns.length > 0 && (
                    <div>
                      <p className="font-bold">
                        Fehlende Admin-Modul-Spalten
                      </p>
                      <p className="mt-1">
                        {missingAdminModuleColumns
                          .map((check) => check.columnName)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {missingRoleTemplateColumns.length > 0 && (
                    <div>
                      <p className="font-bold">
                        Fehlende Rollen-Vorlagen-Spalten
                      </p>
                      <p className="mt-1">
                        {missingRoleTemplateColumns
                          .map((check) => check.columnName)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full app-accent-bg opacity-10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <h2 className="text-2xl font-black">
                    Tabellen, Spalten & Indexe
                  </h2>

                  <p className="text-zinc-500 mt-1">
                    Übersicht über vorhandene Tabellen, Struktur und Indexdefinitionen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
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
                    className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
                  >
                    Filter zurücksetzen
                  </button>

                  {sectionMode !== "tables" && (
                    <button
                      type="button"
                      onClick={handleBackToTables}
                      className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-200 transition font-medium"
                    >
                      Zurück zu Tabellen
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus"
                  placeholder="Suchen..."
                />

                <select
                  value={selectedTable}
                  onChange={(event) => setSelectedTable(event.target.value)}
                  className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="">
                    Alle Tabellen
                  </option>

                  {status.tables.map((table) => (
                    <option
                      key={toSafeText(table.table_name)}
                      value={toSafeText(table.table_name)}
                    >
                      {toSafeText(table.table_name)}
                    </option>
                  ))}
                </select>

                <select
                  value={sectionMode}
                  onChange={(event) =>
                    setSectionMode(event.target.value as SectionMode)
                  }
                  className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none app-focus bg-white"
                >
                  <option value="tables">
                    Tabellen
                  </option>
                  <option value="columns">
                    Spalten
                  </option>
                  <option value="indexes">
                    Indexe
                  </option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-2 rounded-xl font-bold">
                  {sectionMode === "tables" &&
                    `${filteredTables.length} Tabellen sichtbar.`}
                  {sectionMode === "columns" &&
                    `${filteredColumns.length} Spalten sichtbar.`}
                  {sectionMode === "indexes" &&
                    `${filteredIndexes.length} Indexe sichtbar.`}
                </span>

                {search && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-2 rounded-xl font-bold">
                    Suche: {search}
                  </span>
                )}

                {selectedTable && (
                  <span className="text-xs app-accent-soft app-accent-text px-3 py-2 rounded-xl font-bold">
                    Tabelle: {selectedTable}
                  </span>
                )}
              </div>
            </div>
          </section>

          {sectionMode === "tables" && viewMode === "table" && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Tabelle
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Datensätze
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Aktion
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {filteredTables.map((table) => (
                      <tr
                        key={toSafeText(table.table_name)}
                        className="hover:bg-zinc-50/70 transition"
                      >
                        <td className="px-5 py-4 font-black text-zinc-950">
                          {toSafeText(table.table_name)}
                        </td>

                        <td className="px-5 py-4 text-zinc-500">
                          {formatNumber(table.row_count)}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleShowColumns(table.table_name)}
                            className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                          >
                            Spalten anzeigen
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredTables.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10"
                        >
                          <div className="text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
                              🗄️
                            </div>

                            <p className="font-black text-zinc-950 mt-4">
                              Keine Tabellen gefunden
                            </p>

                            <p className="text-zinc-500 mt-1">
                              Passe Suche oder Filter an, um wieder Ergebnisse zu sehen.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {sectionMode === "columns" && viewMode === "table" && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Tabelle
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Spalte
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Typ
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        NULL
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Default
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {filteredColumns.map((column) => (
                      <tr
                        key={`${toSafeText(column.table_name)}-${toSafeText(
                          column.column_name,
                        )}`}
                        className="hover:bg-zinc-50/70 transition"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-900">
                          {toSafeText(column.table_name)}
                        </td>

                        <td className="px-5 py-4 font-black text-zinc-950">
                          {toSafeText(column.column_name)}
                        </td>

                        <td className="px-5 py-4 text-zinc-500">
                          {toSafeText(column.data_type)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getNullableClass(
                              toSafeText(column.is_nullable),
                            )}`}
                          >
                            {toSafeText(column.is_nullable) || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-500 max-w-md">
                          <span className="break-all">
                            {toSafeText(column.column_default) || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredColumns.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10"
                        >
                          <div className="text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
                              🧱
                            </div>

                            <p className="font-black text-zinc-950 mt-4">
                              Keine Spalten gefunden
                            </p>

                            <p className="text-zinc-500 mt-1">
                              Wähle eine andere Tabelle oder ändere den Suchbegriff.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {sectionMode === "indexes" && viewMode === "table" && (
            <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Tabelle
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Index
                      </th>
                      <th className="px-5 py-4 text-sm font-bold text-zinc-500">
                        Definition
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {filteredIndexes.map((index) => (
                      <tr
                        key={`${toSafeText(index.tablename)}-${toSafeText(
                          index.indexname,
                        )}`}
                        className="hover:bg-zinc-50/70 transition"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-900">
                          {toSafeText(index.tablename)}
                        </td>

                        <td className="px-5 py-4 font-black text-zinc-950">
                          {toSafeText(index.indexname)}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 max-w-3xl">
                          <code className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg break-all">
                            {toSafeText(index.indexdef)}
                          </code>
                        </td>
                      </tr>
                    ))}

                    {filteredIndexes.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10"
                        >
                          <div className="text-center">
                            <div className="mx-auto h-12 w-12 rounded-2xl app-accent-soft app-accent-text flex items-center justify-center text-xl">
                              🔎
                            </div>

                            <p className="font-black text-zinc-950 mt-4">
                              Keine Indexe gefunden
                            </p>

                            <p className="text-zinc-500 mt-1">
                              Für die aktuelle Auswahl wurden keine Indexdefinitionen gefunden.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {viewMode === "cards" && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {sectionMode === "tables" &&
                filteredTables.map((table) => (
                  <article
                    key={toSafeText(table.table_name)}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative">
                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        Tabelle
                      </span>

                      <h3 className="text-2xl font-black mt-4">
                        {toSafeText(table.table_name)}
                      </h3>

                      <p className="text-zinc-500 mt-2">
                        {formatNumber(table.row_count)} Datensätze
                      </p>

                      <button
                        type="button"
                        onClick={() => handleShowColumns(table.table_name)}
                        className="mt-5 app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow"
                      >
                        Spalten
                      </button>
                    </div>
                  </article>
                ))}

              {sectionMode === "columns" &&
                filteredColumns.map((column) => (
                  <article
                    key={`${toSafeText(column.table_name)}-${toSafeText(
                      column.column_name,
                    )}`}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                          {toSafeText(column.table_name)}
                        </span>

                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getNullableClass(
                            toSafeText(column.is_nullable),
                          )}`}
                        >
                          NULL: {toSafeText(column.is_nullable) || "-"}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black mt-4">
                        {toSafeText(column.column_name)}
                      </h3>

                      <p className="text-zinc-500 mt-2">
                        Typ: {toSafeText(column.data_type)}
                      </p>

                      <p className="text-sm text-zinc-400 mt-3 break-all">
                        Default: {toSafeText(column.column_default) || "-"}
                      </p>
                    </div>
                  </article>
                ))}

              {sectionMode === "indexes" &&
                filteredIndexes.map((index) => (
                  <article
                    key={`${toSafeText(index.tablename)}-${toSafeText(
                      index.indexname,
                    )}`}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-hidden relative"
                  >
                    <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full app-accent-bg opacity-10 blur-3xl" />

                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                          {toSafeText(index.tablename)}
                        </span>

                        <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full font-bold">
                          Index
                        </span>
                      </div>

                      <h3 className="text-2xl font-black mt-4">
                        {toSafeText(index.indexname)}
                      </h3>

                      <p className="text-sm text-zinc-500 mt-3 break-all leading-7">
                        {toSafeText(index.indexdef)}
                      </p>
                    </div>
                  </article>
                ))}

              {sectionMode === "tables" &&
                filteredTables.length === 0 && (
                  <EmptyState
                    icon="🗄️"
                    title="Keine Tabellen gefunden"
                    description="Passe Suche oder Filter an, um wieder Ergebnisse zu sehen."
                  />
                )}

              {sectionMode === "columns" &&
                filteredColumns.length === 0 && (
                  <EmptyState
                    icon="🧱"
                    title="Keine Spalten gefunden"
                    description="Wähle eine andere Tabelle oder ändere den Suchbegriff."
                  />
                )}

              {sectionMode === "indexes" &&
                filteredIndexes.length === 0 && (
                  <EmptyState
                    icon="🔎"
                    title="Keine Indexe gefunden"
                    description="Für die aktuelle Auswahl wurden keine Indexdefinitionen gefunden."
                  />
                )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
