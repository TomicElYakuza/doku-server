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

function getStatusClass(ok: boolean) {
  if (ok) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-red-50 text-red-700 border border-red-100";
}

function getCheckClass(exists: boolean) {
  if (exists) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-red-50 text-red-700 border border-red-100";
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

export default function AdminDatabasePage() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [selectedTable, setSelectedTable] = useState("");
  const [search, setSearch] = useState("");

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
          data?.message || "Datenbankstatus konnte nicht geladen werden.",
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
      status?.checks.rolePermissionTemplateColumns.filter((check) => !check.exists) || [],
    [
      status,
    ],
  );

  const selectedTableColumns = useMemo(
    () => {
      if (!status) {
        return [];
      }

      if (!selectedTable) {
        return status.columns;
      }

      return status.columns.filter((column) => column.table_name === selectedTable);
    },
    [
      status,
      selectedTable,
    ],
  );

  const filteredTables = useMemo(
    () => {
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
    },
    [
      status,
      search,
    ],
  );

  const filteredColumns = useMemo(
    () => {
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
    },
    [
      selectedTableColumns,
      search,
    ],
  );

  const filteredIndexes = useMemo(
    () => {
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
    },
    [
      status,
      selectedTable,
      search,
    ],
  );

  if (!mounted) {
    return null;
  }

  if (!canViewAdmin()) {
    return (
      <AccessDeniedCard
        title="Kein Zugriff"
        description="Du hast keine Berechtigung für den Datenbankstatus."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Admin Backend"
        title="Datenbankstatus"
        description="PostgreSQL-Verbindung, Tabellen, Spalten, Indexe und Systemchecks prüfen."
        badges={[
          {
            label: status?.ok ? "Online" : "Nicht geprüft",
          },
          {
            label: `${status?.tables.length || 0} Tabellen`,
          },
          {
            label: `${status?.responseTimeMs || 0} ms`,
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
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
              icon="🟢"
              tone={status.ok ? "green" : "red"}
            />
            <StatCard
              label="Tabellen"
              value={status.tables.length}
              description={`${missingExpectedTables.length} erwartete fehlen`}
              icon="🗄️"
              tone={missingExpectedTables.length === 0 ? "blue" : "orange"}
            />
            <StatCard
              label="Datensätze"
              value={formatNumber(totalRows)}
              description="Summe aller Tabellen"
              icon="📊"
              tone="indigo"
            />
            <StatCard
              label="Migrationen"
              value={status.migrations.hasMigrationTable ? "Erkannt" : "Keine"}
              description={
                status.migrations.detectedTables.length > 0
                  ? status.migrations.detectedTables.join(", ")
                  : "Keine Migrationstabelle gefunden"
              }
              icon="🚚"
              tone={status.migrations.hasMigrationTable ? "green" : "orange"}
            />
          </div>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Verbindung
                </h2>
                <p className="text-zinc-500 mt-1">
                  Statusinformationen ohne sensible Zugangsdaten.
                </p>
              </div>

              <span className={`text-sm px-3 py-2 rounded-xl ${getStatusClass(status.ok)}`}>
                {status.ok ? "Verbunden" : "Fehler"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Datenbank
                </p>
                <p className="font-semibold mt-1">
                  {status.database.name || "-"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Schema
                </p>
                <p className="font-semibold mt-1">
                  {status.database.schema || "public"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Datenbankzeit
                </p>
                <p className="font-semibold mt-1">
                  {formatDate(status.database.time)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5 md:col-span-2 xl:col-span-3">
                <p className="text-sm text-zinc-400">
                  PostgreSQL-Version
                </p>
                <p className="font-semibold mt-1 break-words">
                  {status.database.version || "-"}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Letzte Prüfung
                </p>
                <p className="font-semibold mt-1">
                  {formatDate(status.checkedAt)}
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5">
                <p className="text-sm text-zinc-400">
                  Antwortzeit
                </p>
                <p className="font-semibold mt-1">
                  {status.responseTimeMs} ms
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Systemchecks
                </h2>
                <p className="text-zinc-500 mt-1">
                  Erwartete Tabellen und wichtige Spalten für Taxonomie, Admin-Module und Rollen-Vorlagen.
                </p>
              </div>

              <span className={`text-sm px-3 py-2 rounded-xl ${
                missingExpectedTables.length === 0 &&
                missingTaxonomyColumns.length === 0 &&
                missingAdminModuleColumns.length === 0 &&
                missingRoleTemplateColumns.length === 0
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-orange-50 text-orange-700 border border-orange-100"
              }`}
              >
                {missingExpectedTables.length === 0 &&
                missingTaxonomyColumns.length === 0 &&
                missingAdminModuleColumns.length === 0 &&
                missingRoleTemplateColumns.length === 0
                  ? "Alles vorhanden"
                  : "Prüfen"}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold">
                  Erwartete Tabellen
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {status.checks.expectedTables.map((check) => (
                    <span
                      key={check.tableName}
                      className={`text-xs px-3 py-1 rounded-full ${getCheckClass(check.exists)}`}
                    >
                      {check.tableName}: {check.exists ? "OK" : "Fehlt"}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">
                  Taxonomie-Spalten
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {status.checks.taxonomyColumns.map((check) => (
                    <span
                      key={check.columnName}
                      className={`text-xs px-3 py-1 rounded-full ${getCheckClass(check.exists)}`}
                    >
                      {check.columnName}: {check.exists ? "OK" : "Fehlt"}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">
                  Admin-Module-Spalten
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {status.checks.adminModuleColumns.map((check) => (
                    <span
                      key={check.columnName}
                      className={`text-xs px-3 py-1 rounded-full ${getCheckClass(check.exists)}`}
                    >
                      {check.columnName}: {check.exists ? "OK" : "Fehlt"}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">
                  Rollen-Vorlagen-Spalten
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {status.checks.rolePermissionTemplateColumns.map((check) => (
                    <span
                      key={check.columnName}
                      className={`text-xs px-3 py-1 rounded-full ${getCheckClass(check.exists)}`}
                    >
                      {check.columnName}: {check.exists ? "OK" : "Fehlt"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Tabellen, Spalten & Indexe
                </h2>
                <p className="text-zinc-500 mt-1">
                  Übersicht über vorhandene Tabellen und deren Struktur.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTable("");
                  setSearch("");
                }}
                className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-xl transition"
              >
                Filter zurücksetzen
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500"
                placeholder="Suchen..."
              />

              <select
                value={selectedTable}
                onChange={(event) => setSelectedTable(event.target.value)}
                className="md:col-span-2 border border-zinc-200 rounded-2xl px-5 py-4 outline-none focus:border-zinc-500 bg-white"
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
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-semibold">
                  Tabellen
                </h2>
                <p className="text-zinc-500 mt-1">
                  {filteredTables.length} Tabellen sichtbar.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Tabelle
                      </th>
                      <th className="px-5 py-4 font-semibold text-right">
                        Datensätze
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTables.map((table) => (
                      <tr
                        key={table.table_name}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                        onClick={() => setSelectedTable(table.table_name)}
                      >
                        <td className="px-5 py-4 font-medium">
                          {table.table_name}
                        </td>
                        <td className="px-5 py-4 text-right text-zinc-500">
                          {formatNumber(table.row_count)}
                        </td>
                      </tr>
                    ))}

                    {filteredTables.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-5 py-8 text-zinc-500"
                        >
                          Keine Tabellen gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-semibold">
                  Spalten
                </h2>
                <p className="text-zinc-500 mt-1">
                  {filteredColumns.length} Spalten sichtbar.
                </p>
              </div>

              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Tabelle
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Spalte
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Typ
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        NULL
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredColumns.map((column) => (
                      <tr
                        key={`${column.table_name}-${column.column_name}`}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                      >
                        <td className="px-5 py-4 text-zinc-500">
                          {column.table_name}
                        </td>
                        <td className="px-5 py-4 font-medium">
                          {column.column_name}
                        </td>
                        <td className="px-5 py-4 text-zinc-500">
                          {column.data_type}
                        </td>
                        <td className="px-5 py-4 text-zinc-500">
                          {column.is_nullable}
                        </td>
                      </tr>
                    ))}

                    {filteredColumns.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-8 text-zinc-500"
                        >
                          Keine Spalten gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-xl font-semibold">
                Indexe
              </h2>
              <p className="text-zinc-500 mt-1">
                {filteredIndexes.length} Indexe sichtbar.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Tabelle
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Index
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Definition
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIndexes.map((index) => (
                    <tr
                      key={`${index.tablename}-${index.indexname}`}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-4 text-zinc-500">
                        {index.tablename}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {index.indexname}
                      </td>
                      <td className="px-5 py-4 text-zinc-500 break-all">
                        {index.indexdef}
                      </td>
                    </tr>
                  ))}

                  {filteredIndexes.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-zinc-500"
                      >
                        Keine Indexe gefunden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}