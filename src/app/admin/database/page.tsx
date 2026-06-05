"use client";

import Link from "next/link";
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

type DatabaseStatus = {
  ok: boolean;
  status: string;
  database: {
    name: string | null;
    schema: string | null;
    time: string | null;
    version: string | null;
  };
  tables: {
    table_name: string;
    row_count: string;
  }[];
  columns: {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }[];
  indexes: {
    tablename: string;
    indexname: string;
    indexdef: string;
  }[];
  migrations: {
    detectedTables: string[];
    hasMigrationTable: boolean;
  };
  checks: {
    expectedTables: {
      tableName: string;
      exists: boolean;
    }[];
    taxonomyColumns: {
      columnName: string;
      exists: boolean;
    }[];
  };
  responseTimeMs: number;
  checkedAt: string;
  message?: string;
};

function getStatusLabel(status: DatabaseStatus | null) {
  if (!status) {
    return "Nicht geprüft";
  }

  if (status.ok) {
    return "Verbunden";
  }

  return "Fehler";
}

function getStatusClass(status: DatabaseStatus | null) {
  if (!status) {
    return "bg-zinc-100 text-zinc-600 border border-zinc-200";
  }

  if (status.ok) {
    return "bg-green-50 text-green-700 border border-green-100";
  }

  return "bg-red-50 text-red-700 border border-red-100";
}

export default function AdminDatabasePage() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    void loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/database", {
        cache: "no-store",
      });

      const data = await response.json();

      setStatus(data);
    } catch (error) {
      console.error(error);

      setStatus({
        ok: false,
        status: "error",
        database: {
          name: null,
          schema: "public",
          time: null,
          version: null,
        },
        tables: [],
        columns: [],
        indexes: [],
        migrations: {
          detectedTables: [],
          hasMigrationTable: false,
        },
        checks: {
          expectedTables: [],
          taxonomyColumns: [],
        },
        responseTimeMs: 0,
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Status konnte nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

  const missingTables = useMemo(
    () =>
      status?.checks.expectedTables.filter((table) => !table.exists) || [],
    [
      status,
    ],
  );

  const missingTaxonomyColumns = useMemo(
    () =>
      status?.checks.taxonomyColumns.filter((column) => !column.exists) || [],
    [
      status,
    ],
  );

  const tableCount = status?.tables.length || 0;
  const columnCount = status?.columns.length || 0;
  const indexCount = status?.indexes.length || 0;

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
        description="Technischer Status für PostgreSQL, Tabellen, Taxonomie und Migrationen – ohne sensible Zugangsdaten."
        badges={[
          {
            label: getStatusLabel(status),
          },
          {
            label: `${tableCount} Tabellen`,
          },
          {
            label: `${status?.responseTimeMs ?? 0} ms`,
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Zurück zum Admin Dashboard
            </Link>

            <button
              type="button"
              onClick={() => void loadStatus()}
              className="bg-white text-zinc-900 px-5 py-3 rounded-2xl hover:bg-zinc-100 transition"
            >
              Neu prüfen
            </button>
          </div>
        }
      />

      {loading && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <p className="text-zinc-500">
            Datenbankstatus wird geladen...
          </p>
        </div>
      )}

      {status?.message && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">
            Fehler
          </h2>
          <p className="text-red-600 mt-2">
            {status.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Datenbank"
          value={getStatusLabel(status)}
          description={status?.database.name || "Unbekannt"}
          icon="🗄️"
          tone={status?.ok ? "green" : "red"}
        />
        <StatCard
          label="Tabellen"
          value={tableCount}
          description={`${columnCount} Spalten`}
          icon="📋"
          tone="blue"
        />
        <StatCard
          label="Indexes"
          value={indexCount}
          description="PostgreSQL Indexe"
          icon="⚡"
          tone="purple"
        />
        <StatCard
          label="Migration"
          value={status?.migrations.hasMigrationTable ? "Erkannt" : "Keine Tabelle"}
          description={
            status?.migrations.detectedTables.length
              ? status.migrations.detectedTables.join(", ")
              : "Kein Migration-Tracker gefunden"
          }
          icon="🧱"
          tone={status?.migrations.hasMigrationTable ? "green" : "orange"}
        />
      </div>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Verbindungsstatus
            </h2>
            <p className="text-zinc-500 mt-1">
              Sichtbare Systeminformationen ohne Host, Benutzername oder Passwort.
            </p>
          </div>

          <span className={`text-sm px-3 py-2 rounded-xl ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">
              Datenbank
            </p>
            <p className="font-semibold mt-1">
              {status?.database.name || "-"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">
              Schema
            </p>
            <p className="font-semibold mt-1">
              {status?.database.schema || "public"}
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">
              Antwortzeit
            </p>
            <p className="font-semibold mt-1">
              {status?.responseTimeMs ?? 0} ms
            </p>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">
              Letzte Prüfung
            </p>
            <p className="font-semibold mt-1">
              {status?.checkedAt
                ? new Date(status.checkedAt).toLocaleString("de-AT")
                : "-"}
            </p>
          </div>
        </div>

        {status?.database.version && (
          <div className="bg-zinc-50 rounded-2xl p-5 mt-4">
            <p className="text-sm text-zinc-400">
              PostgreSQL Version
            </p>
            <p className="font-medium mt-1 break-words">
              {status.database.version}
            </p>
          </div>
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Erwartete Tabellen
        </h2>
        <p className="text-zinc-500 mt-1">
          Check der wichtigsten App-Tabellen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-6">
          {status?.checks.expectedTables.map((table) => (
            <div
              key={table.tableName}
              className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-4"
            >
              <span className="font-medium">
                {table.tableName}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  table.exists
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {table.exists ? "OK" : "Fehlt"}
              </span>
            </div>
          ))}
        </div>

        {missingTables.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mt-5">
            <p className="text-orange-700">
              Fehlende Tabellen: {missingTables.map((table) => table.tableName).join(", ")}
            </p>
          </div>
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Taxonomie-Check
        </h2>
        <p className="text-zinc-500 mt-1">
          Prüfung der benötigten Spalten für Kategorien und Tags.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mt-6">
          {status?.checks.taxonomyColumns.map((column) => (
            <div
              key={column.columnName}
              className="flex items-center justify-between gap-4 bg-zinc-50 rounded-2xl p-4"
            >
              <span className="font-medium">
                {column.columnName}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  column.exists
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {column.exists ? "OK" : "Fehlt"}
              </span>
            </div>
          ))}
        </div>

        {missingTaxonomyColumns.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mt-5">
            <p className="text-orange-700">
              Fehlende Taxonomie-Spalten: {missingTaxonomyColumns.map((column) => column.columnName).join(", ")}
            </p>
          </div>
        )}
      </section>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Tabellen & Datensätze
        </h2>
        <p className="text-zinc-500 mt-1">
          Übersicht über Tabellen im public Schema.
        </p>

        <div className="overflow-x-auto mt-6">
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
              {status?.tables.map((table) => (
                <tr
                  key={table.table_name}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-5 py-4 font-medium">
                    {table.table_name}
                  </td>
                  <td className="px-5 py-4 text-right text-zinc-600">
                    {table.row_count}
                  </td>
                </tr>
              ))}

              {status?.tables.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-6 text-zinc-500"
                  >
                    Keine Tabellen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}