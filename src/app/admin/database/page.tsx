"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AccessDeniedCard from "../../../components/AccessDeniedCard";
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

function formatNumber(value: string | number) {
  return Number(value || 0).toLocaleString("de-AT");
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
      status?.checks.expectedTables.filter((check) => !check.exists) || [],
    [
      status,
    ],
  );

  const missingTaxonomyColumns = useMemo(
    () =>
      status?.checks.taxonomyColumns.filter((check) => !check.exists) || [],
    [
      status,
    ],
  );

  const missingAdminModuleColumns = useMemo(
    () =>
      status?.checks.adminModuleColumns.filter((check) => !check.exists) || [],
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
      (column) => column.table_name === selectedTable,
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

      return table.table_name.toLowerCase().includes(query);
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
      const matchesTable =
        !selectedTable ||
        index.tablename === selectedTable;

      const matchesSearch =
        !query ||
        [
          index.tablename,
          index.indexname,
          index.indexdef,
        ]
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

  function renderCheckGroup(
    title: string,
    checks: CheckItem[],
    type: "table" | "column",
  ) {
    return (
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">
              {title}
            </h3>
            <p className="text-zinc-500 mt-1">
              {checks.filter((check) => check.exists).length} von {checks.length} vorhanden.
            </p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border font-bold ${
              checks.every((check) => check.exists)
                ? "bg-green-50 text-green-700 border-green-100"
                : "bg-red-50 text-red-700 border-red-100"
            }`}
          >
            {checks.every((check) => check.exists) ? "OK" : "Prüfen"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {checks.map((check) => (
            <span
              key={`${title}-${check.tableName || check.columnName}`}
              className={`text-xs px-3 py-2 rounded-full border font-bold ${getCheckClass(
                check.exists,
              )}`}
            >
              {type === "table"
                ? check.tableName
                : check.columnName}
              : {check.exists ? "OK" : "Fehlt"}
            </span>
          ))}
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
        title="Datenbank"
        description="Du hast keine Berechtigung für den Datenbankstatus."
        backHref="/admin"
        backLabel="Zum Admin Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Velunis Admin"
        title="Datenbank"
        description="PostgreSQL-Status, Tabellen, Spalten, Indexe und Systemchecks ohne sensible Zugangsdaten."
        badges={[
          {
            label: status?.ok ? "Verbunden" : "Nicht verbunden",
          },
          {
            label: `${status?.tables.length || 0} Tabellen`,
          },
          {
            label: `${formatNumber(totalRows)} Datensätze`,
          },
          {
            label: `${missingCount} fehlende Checks`,
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
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Datenbankstatus wird geladen...
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

      {status && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Status"
              value={status.ok ? "Online" : "Fehler"}
              description={`${status.responseTimeMs} ms Antwortzeit`}
              icon="🧬"
              tone={status.ok ? "green" : "red"}
            />

            <StatCard
              label="Tabellen"
              value={status.tables.length}
              description={`${status.columns.length} Spalten`}
              icon="📋"
              tone="blue"
              active={sectionMode === "tables"}
              onClick={() => setSectionMode("tables")}
            />

            <StatCard
              label="Indexe"
              value={status.indexes.length}
              description="PostgreSQL Index-Struktur"
              icon="⚡"
              tone="indigo"
              active={sectionMode === "indexes"}
              onClick={() => setSectionMode("indexes")}
            />

            <StatCard
              label="Checks"
              value={missingCount === 0 ? "OK" : missingCount}
              description={
                missingCount === 0
                  ? "Alle erwarteten Werte vorhanden"
                  : "Fehlende Tabellen oder Spalten"
              }
              icon="✅"
              tone={missingCount === 0 ? "green" : "orange"}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">
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

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Datenbank
                </p>
                <p className="font-black mt-1 line-clamp-1">
                  {status.database.name || "-"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Schema
                </p>
                <p className="font-black mt-1">
                  {status.database.schema || "public"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Datenbankzeit
                </p>
                <p className="font-black mt-1 line-clamp-1">
                  {formatDate(status.database.time)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Letzte Prüfung
                </p>
                <p className="font-black mt-1 line-clamp-1">
                  {formatDate(status.checkedAt)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Antwortzeit
                </p>
                <p className="font-black mt-1">
                  {status.responseTimeMs} ms
                </p>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-5">
                <p className="text-xs text-zinc-500">
                  Migrationen
                </p>
                <p className="font-black mt-1">
                  {status.migrations.hasMigrationTable ? "Erkannt" : "Nicht erkannt"}
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-3xl p-5 mt-4">
              <p className="text-xs text-zinc-500">
                PostgreSQL-Version
              </p>
              <p className="font-semibold mt-1 break-words">
                {status.database.version || "-"}
              </p>
            </div>

            {status.message && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 mt-4 text-amber-800">
                {status.message}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
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
                {missingCount === 0 ? "Alles vorhanden" : `${missingCount} fehlen`}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Tabellen, Spalten & Indexe
                </h2>
                <p className="text-zinc-500 mt-1">
                  Übersicht über vorhandene Tabellen, Struktur und Indexdefinitionen.
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
                  Filter zurücksetzen
                </button>
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
                    key={table.table_name}
                    value={table.table_name}
                  >
                    {table.table_name}
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

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <span className="text-sm text-zinc-500">
                {sectionMode === "tables" && `${filteredTables.length} Tabellen sichtbar.`}
                {sectionMode === "columns" && `${filteredColumns.length} Spalten sichtbar.`}
                {sectionMode === "indexes" && `${filteredIndexes.length} Indexe sichtbar.`}
              </span>

              {search && (
                <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                  Suche: {search}
                </span>
              )}

              {selectedTable && (
                <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                  Tabelle: {selectedTable}
                </span>
              )}
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
                        key={table.table_name}
                        className="hover:bg-zinc-50 transition"
                      >
                        <td className="px-5 py-4 font-black text-zinc-950">
                          {table.table_name}
                        </td>

                        <td className="px-5 py-4 text-zinc-500">
                          {formatNumber(table.row_count)}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTable(table.table_name);
                              setSectionMode("columns");
                            }}
                            className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
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
                          className="px-5 py-10 text-center text-zinc-500"
                        >
                          Keine Tabellen gefunden.
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
                        key={`${column.table_name}-${column.column_name}`}
                        className="hover:bg-zinc-50 transition"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-900">
                          {column.table_name}
                        </td>

                        <td className="px-5 py-4 font-black text-zinc-950">
                          {column.column_name}
                        </td>

                        <td className="px-5 py-4 text-zinc-500">
                          {column.data_type}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border font-bold ${getNullableClass(
                              column.is_nullable,
                            )}`}
                          >
                            {column.is_nullable}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-500 max-w-md">
                          <p className="line-clamp-2">
                            {column.column_default || "-"}
                          </p>
                        </td>
                      </tr>
                    ))}

                    {filteredColumns.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-zinc-500"
                        >
                          Keine Spalten gefunden.
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
                        key={`${index.tablename}-${index.indexname}`}
                        className="hover:bg-zinc-50 transition"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-900">
                          {index.tablename}
                        </td>

                        <td className="px-5 py-4 font-black text-zinc-950">
                          {index.indexname}
                        </td>

                        <td className="px-5 py-4 text-zinc-500 max-w-3xl">
                          <p className="line-clamp-3 font-mono text-xs">
                            {index.indexdef}
                          </p>
                        </td>
                      </tr>
                    ))}

                    {filteredIndexes.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10 text-center text-zinc-500"
                        >
                          Keine Indexe gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {viewMode === "cards" && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {sectionMode === "tables" &&
                filteredTables.map((table) => (
                  <article
                    key={table.table_name}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                          Tabelle
                        </span>
                        <h3 className="text-2xl font-black mt-4">
                          {table.table_name}
                        </h3>
                        <p className="text-zinc-500 mt-2">
                          {formatNumber(table.row_count)} Datensätze
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTable(table.table_name);
                          setSectionMode("columns");
                        }}
                        className="app-accent-bg text-white px-4 py-2 rounded-xl transition font-bold app-brand-shadow font-bold"
                      >
                        Spalten
                      </button>
                    </div>
                  </article>
                ))}

              {sectionMode === "columns" &&
                filteredColumns.map((column) => (
                  <article
                    key={`${column.table_name}-${column.column_name}`}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        {column.table_name}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full border font-bold ${getNullableClass(
                          column.is_nullable,
                        )}`}
                      >
                        NULL: {column.is_nullable}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black mt-4">
                      {column.column_name}
                    </h3>
                    <p className="text-zinc-500 mt-2">
                      Typ: {column.data_type}
                    </p>
                    <p className="text-sm text-zinc-400 mt-3 break-words">
                      Default: {column.column_default || "-"}
                    </p>
                  </article>
                ))}

              {sectionMode === "indexes" &&
                filteredIndexes.map((index) => (
                  <article
                    key={`${index.tablename}-${index.indexname}`}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs app-accent-soft app-accent-text px-3 py-1 rounded-full font-bold">
                        {index.tablename}
                      </span>
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">
                        Index
                      </span>
                    </div>

                    <h3 className="text-xl font-black mt-4">
                      {index.indexname}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-3 font-mono break-words">
                      {index.indexdef}
                    </p>
                  </article>
                ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
