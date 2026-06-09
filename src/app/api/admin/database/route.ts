import { NextResponse } from "next/server";

import { query, queryOne } from "../../../../lib/database/db";
import {
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

type DatabaseInfoRow = {
  database_name: string;
  schema_name: string;
  database_time: string;
  postgres_version: string;
};

type TableNameRow = {
  table_name: string;
};

type TableRow = {
  table_name: string;
  row_count: string;
};

type ColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type IndexRow = {
  tablename: string;
  indexname: string;
  indexdef: string;
};

type CountRow = {
  count: string;
};

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function getTableCount(tableName: string) {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier(tableName)}`,
  );

  return Number(row?.count || 0);
}

function createCheckItems(
  existingValues: string[],
  expectedValues: string[],
  key: "tableName" | "columnName",
) {
  const existingSet = new Set(existingValues);

  return expectedValues.map((value) => ({
    [key]: value,
    exists: existingSet.has(value),
  }));
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unbekannter Fehler";
}

export async function GET() {
  const startedAt = Date.now();

  try {
    await requireAnyServerPermission([
      "settings.manage",
      "admin.view",
      "settings.view",
    ]);

    const databaseInfo = await queryOne<DatabaseInfoRow>(`
      SELECT
        current_database()::text AS database_name,
        current_schema()::text AS schema_name,
        NOW()::text AS database_time,
        version()::text AS postgres_version
    `);

    const baseTables = await query<TableNameRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    const tables: TableRow[] = [];

    for (const table of baseTables) {
      const rowCount = await getTableCount(table.table_name);

      tables.push({
        table_name: table.table_name,
        row_count: String(rowCount),
      });
    }

    const columns = await query<ColumnRow>(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name ASC, ordinal_position ASC
    `);

    const indexes = await query<IndexRow>(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename ASC, indexname ASC
    `);

    const migrationTables = await query<TableNameRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'schema_migrations',
          'migrations',
          'knex_migrations',
          '_prisma_migrations'
        )
      ORDER BY table_name ASC
    `);

    const existingTableNames = baseTables.map((table) => table.table_name);

    const expectedTables = [
      "admin_users",
      "companies",
      "departments",
      "permissions",
      "company_permissions",
      "department_permissions",
      "user_permissions",
      "tickets",
      "ticket_templates",
      "wiki_pages",
      "news_posts",
      "news_opened",
      "files",
      "comments",
      "activities",
      "activity_logs",
      "app_settings",
      "user_settings",
      "taxonomy_items",
      "admin_modules",
      "role_permission_templates",
    ];

    const taxonomyColumns = columns
      .filter((column) => column.table_name === "taxonomy_items")
      .map((column) => column.column_name);

    const adminModuleColumns = columns
      .filter((column) => column.table_name === "admin_modules")
      .map((column) => column.column_name);

    const roleTemplateColumns = columns
      .filter((column) => column.table_name === "role_permission_templates")
      .map((column) => column.column_name);

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: {
        name: databaseInfo?.database_name || null,
        schema: databaseInfo?.schema_name || "public",
        time: databaseInfo?.database_time || null,
        version: databaseInfo?.postgres_version || null,
      },
      tables,
      columns,
      indexes,
      migrations: {
        detectedTables: migrationTables.map((table) => table.table_name),
        hasMigrationTable: migrationTables.length > 0,
      },
      checks: {
        expectedTables: createCheckItems(
          existingTableNames,
          expectedTables,
          "tableName",
        ),
        taxonomyColumns: createCheckItems(
          taxonomyColumns,
          [
            "id",
            "type",
            "target",
            "name",
            "slug",
            "parent_id",
            "color",
            "sort_order",
            "is_active",
            "created_at",
            "updated_at",
          ],
          "columnName",
        ),
        adminModuleColumns: createCheckItems(
          adminModuleColumns,
          [
            "module_key",
            "title",
            "description",
            "href",
            "icon",
            "category",
            "badge_label",
            "sort_order",
            "is_enabled",
            "is_visible",
            "is_core",
            "created_at",
            "updated_at",
          ],
          "columnName",
        ),
        rolePermissionTemplateColumns: createCheckItems(
          roleTemplateColumns,
          [
            "template_key",
            "name",
            "description",
            "role_key",
            "permission_keys",
            "is_default",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
          ],
          "columnName",
        ),
      },
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
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
          adminModuleColumns: [],
          rolePermissionTemplateColumns: [],
        },
        responseTimeMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
        message: getErrorMessage(error),
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}