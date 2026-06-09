import { query, queryOne } from "./db";
import { seedDefaultAdminModules } from "./adminModuleStore";
import { seedDefaultPermissions } from "./permissionStore";
import { ensureTaxonomyTable } from "./taxonomyStore";

type TableExistsRow = {
  exists: boolean;
};

type ColumnInfoRow = {
  data_type: string;
};

type TableHealthRow = {
  table_name: string;
  row_count: string;
};

const LEGACY_GENERAL_LABEL = ["All", "gemein"].join("");

const APP_SETTINGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    app_name TEXT NOT NULL DEFAULT 'Intranet',
    company_name TEXT NOT NULL DEFAULT 'Velunis',
    app_version TEXT NOT NULL DEFAULT '0.1.0',
    theme TEXT NOT NULL DEFAULT 'modern',
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    accent_color TEXT NOT NULL DEFAULT 'velunis',
    app_accent_color TEXT NOT NULL DEFAULT 'velunis',
    sidebar_position TEXT NOT NULL DEFAULT 'left',
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
    show_version BOOLEAN NOT NULL DEFAULT TRUE,
    enable_ticket_comments BOOLEAN NOT NULL DEFAULT TRUE,
    enable_ticket_templates BOOLEAN NOT NULL DEFAULT TRUE,
    enable_activity_log BOOLEAN NOT NULL DEFAULT TRUE,
    default_user_role TEXT NOT NULL DEFAULT 'employee',
    default_ticket_view TEXT NOT NULL DEFAULT 'table',
    default_wiki_view TEXT NOT NULL DEFAULT 'table',
    hide_closed_tickets_by_default BOOLEAN NOT NULL DEFAULT TRUE,
    tickets_per_page INTEGER NOT NULL DEFAULT 25,
    wiki_per_page INTEGER NOT NULL DEFAULT 25,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT app_settings_singleton CHECK (id = 1)
  )
`;

async function tableExists(tableName: string) {
  const row = await queryOne<TableExistsRow>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return Boolean(row?.exists);
}

async function getColumnDataType(tableName: string, columnName: string) {
  const row = await queryOne<ColumnInfoRow>(
    `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1
    `,
    [tableName, columnName],
  );

  return row?.data_type || "";
}

async function ensureAppSettingsSingletonTable() {
  const exists = await tableExists("app_settings");

  if (!exists) {
    await query(APP_SETTINGS_TABLE_SQL);
  }

  const idType = await getColumnDataType("app_settings", "id");

  if (idType && idType !== "integer") {
    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'Intranet'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT 'Velunis'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS app_version TEXT NOT NULL DEFAULT '0.1.0'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'modern'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'velunis'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS app_accent_color TEXT NOT NULL DEFAULT 'velunis'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS sidebar_position TEXT NOT NULL DEFAULT 'left'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS show_version BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_ticket_comments BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_ticket_templates BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_activity_log BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_user_role TEXT NOT NULL DEFAULT 'employee'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_ticket_view TEXT NOT NULL DEFAULT 'table'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_wiki_view TEXT NOT NULL DEFAULT 'table'
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS hide_closed_tickets_by_default BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS tickets_per_page INTEGER NOT NULL DEFAULT 25
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS wiki_per_page INTEGER NOT NULL DEFAULT 25
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await query(`
      DROP TABLE IF EXISTS app_settings_v2
    `);

    await query(`
      CREATE TABLE app_settings_v2 (
        id INTEGER PRIMARY KEY DEFAULT 1,
        app_name TEXT NOT NULL DEFAULT 'Intranet',
        company_name TEXT NOT NULL DEFAULT 'Velunis',
        app_version TEXT NOT NULL DEFAULT '0.1.0',
        theme TEXT NOT NULL DEFAULT 'modern',
        dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
        accent_color TEXT NOT NULL DEFAULT 'velunis',
        app_accent_color TEXT NOT NULL DEFAULT 'velunis',
        sidebar_position TEXT NOT NULL DEFAULT 'left',
        compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
        show_version BOOLEAN NOT NULL DEFAULT TRUE,
        enable_ticket_comments BOOLEAN NOT NULL DEFAULT TRUE,
        enable_ticket_templates BOOLEAN NOT NULL DEFAULT TRUE,
        enable_activity_log BOOLEAN NOT NULL DEFAULT TRUE,
        default_user_role TEXT NOT NULL DEFAULT 'employee',
        default_ticket_view TEXT NOT NULL DEFAULT 'table',
        default_wiki_view TEXT NOT NULL DEFAULT 'table',
        hide_closed_tickets_by_default BOOLEAN NOT NULL DEFAULT TRUE,
        tickets_per_page INTEGER NOT NULL DEFAULT 25,
        wiki_per_page INTEGER NOT NULL DEFAULT 25,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT app_settings_singleton CHECK (id = 1)
      )
    `);

    await query(`
      INSERT INTO app_settings_v2 (
        id,
        app_name,
        company_name,
        app_version,
        theme,
        dark_mode,
        accent_color,
        app_accent_color,
        sidebar_position,
        compact_mode,
        show_version,
        enable_ticket_comments,
        enable_ticket_templates,
        enable_activity_log,
        default_user_role,
        default_ticket_view,
        default_wiki_view,
        hide_closed_tickets_by_default,
        tickets_per_page,
        wiki_per_page,
        updated_at
      )
      SELECT
        1,
        COALESCE(NULLIF(app_name, ''), 'Intranet'),
        COALESCE(NULLIF(company_name, ''), 'Velunis'),
        COALESCE(NULLIF(app_version, ''), '0.1.0'),
        COALESCE(NULLIF(theme, ''), 'modern'),
        COALESCE(dark_mode, FALSE),
        CASE
          WHEN accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
          ELSE 'velunis'
        END,
        CASE
          WHEN app_accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN app_accent_color
          WHEN accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
          ELSE 'velunis'
        END,
        CASE
          WHEN sidebar_position = 'right' THEN 'right'
          ELSE 'left'
        END,
        COALESCE(compact_mode, FALSE),
        COALESCE(show_version, TRUE),
        COALESCE(enable_ticket_comments, TRUE),
        COALESCE(enable_ticket_templates, TRUE),
        COALESCE(enable_activity_log, TRUE),
        CASE
          WHEN default_user_role IN ('admin', 'department_lead', 'employee') THEN default_user_role
          ELSE 'employee'
        END,
        CASE
          WHEN default_ticket_view IN ('table', 'cards') THEN default_ticket_view
          ELSE 'table'
        END,
        CASE
          WHEN default_wiki_view IN ('table', 'cards') THEN default_wiki_view
          ELSE 'table'
        END,
        COALESCE(hide_closed_tickets_by_default, TRUE),
        CASE
          WHEN tickets_per_page BETWEEN 5 AND 100 THEN tickets_per_page
          ELSE 25
        END,
        CASE
          WHEN wiki_per_page BETWEEN 5 AND 100 THEN wiki_per_page
          ELSE 25
        END,
        COALESCE(updated_at, NOW())
      FROM app_settings
      ORDER BY updated_at DESC
      LIMIT 1
      ON CONFLICT (id) DO NOTHING
    `);

    await query(`
      DROP TABLE app_settings
    `);

    await query(`
      ALTER TABLE app_settings_v2
      RENAME TO app_settings
    `);
  }

  await query(APP_SETTINGS_TABLE_SQL);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS app_accent_color TEXT NOT NULL DEFAULT 'velunis'
  `);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS default_ticket_view TEXT NOT NULL DEFAULT 'table'
  `);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS default_wiki_view TEXT NOT NULL DEFAULT 'table'
  `);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS hide_closed_tickets_by_default BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS tickets_per_page INTEGER NOT NULL DEFAULT 25
  `);

  await query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS wiki_per_page INTEGER NOT NULL DEFAULT 25
  `);

  await query(`
    INSERT INTO app_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);

  await query(`
    UPDATE app_settings
    SET
      app_name = COALESCE(NULLIF(app_name, ''), 'Intranet'),
      company_name = COALESCE(NULLIF(company_name, ''), 'Velunis'),
      app_version = COALESCE(NULLIF(app_version, ''), '0.1.0'),
      theme = COALESCE(NULLIF(theme, ''), 'modern'),
      accent_color = CASE
        WHEN accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
        ELSE 'velunis'
      END,
      app_accent_color = CASE
        WHEN app_accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN app_accent_color
        WHEN accent_color IN ('velunis', 'zinc', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
        ELSE 'velunis'
      END,
      default_user_role = CASE
        WHEN default_user_role IN ('admin', 'department_lead', 'employee') THEN default_user_role
        ELSE 'employee'
      END,
      default_ticket_view = CASE
        WHEN default_ticket_view IN ('table', 'cards') THEN default_ticket_view
        ELSE 'table'
      END,
      default_wiki_view = CASE
        WHEN default_wiki_view IN ('table', 'cards') THEN default_wiki_view
        ELSE 'table'
      END,
      tickets_per_page = CASE
        WHEN tickets_per_page BETWEEN 5 AND 100 THEN tickets_per_page
        ELSE 25
      END,
      wiki_per_page = CASE
        WHEN wiki_per_page BETWEEN 5 AND 100 THEN wiki_per_page
        ELSE 25
      END,
      updated_at = NOW()
    WHERE id = 1
  `);
}

async function ensureCoreTables() {
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto"
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(company_id, slug)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT UNIQUE,
      password_hash TEXT,
      password_must_change BOOLEAN NOT NULL DEFAULT TRUE,
      role TEXT NOT NULL DEFAULT 'employee',
      status TEXT NOT NULL DEFAULT 'active',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT 'Intern',
      department TEXT NOT NULL DEFAULT '',
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
  `);

  await query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS password_hash TEXT
  `);

  await query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS password_must_change BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL
  `);

  await query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL
  `);

  await query(`
    ALTER TABLE admin_users
    ALTER COLUMN role SET DEFAULT 'employee'
  `);

  await query(`
    ALTER TABLE admin_users
    ALTER COLUMN department SET DEFAULT ''
  `);

  await query(
    `
      UPDATE admin_users
      SET
        role = CASE
          WHEN role IN ('admin', 'department_lead', 'employee') THEN role
          ELSE 'employee'
        END,
        department = CASE
          WHEN department = $1 THEN ''
          ELSE COALESCE(department, '')
        END
    `,
    [LEGACY_GENERAL_LABEL],
  );

  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT NOT NULL DEFAULT '',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT 'Intern',
      department TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT 'System',
      tags TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ticket_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT NOT NULL DEFAULT '',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT 'Intern',
      department TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wiki_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT 'Intern',
      category TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'System',
      tags TEXT[] NOT NULL DEFAULT '{}',
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wiki_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wiki_slug TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT 'Intern',
      category TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT '{}',
      content TEXT NOT NULL DEFAULT '',
      saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS news_posts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'System',
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS news_opened (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      news_id TEXT NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(news_id, user_email)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      storage_key TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'application/octet-stream',
      size INTEGER NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      uploaded_by TEXT NOT NULL DEFAULT 'System',
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Unbekannt',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      entity_type TEXT NOT NULL DEFAULT 'system',
      entity_id TEXT NOT NULL DEFAULT '',
      user_name TEXT NOT NULL DEFAULT 'System',
      user_email TEXT NOT NULL DEFAULT '',
      user_display TEXT NOT NULL DEFAULT 'System',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT 'Intern',
      department TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      entity_type TEXT NOT NULL DEFAULT 'system',
      entity_id TEXT NOT NULL DEFAULT '',
      user_name TEXT NOT NULL DEFAULT 'System',
      user_email TEXT NOT NULL DEFAULT '',
      user_display TEXT NOT NULL DEFAULT 'System',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      company TEXT NOT NULL DEFAULT 'Intern',
      department TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'modern',
      accent_color TEXT NOT NULL DEFAULT 'velunis',
      compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const categoryTables = [
    "tickets",
    "ticket_templates",
    "wiki_pages",
    "wiki_versions",
    "news_posts",
  ];

  for (const tableName of categoryTables) {
    await query(`
      ALTER TABLE ${tableName}
      ALTER COLUMN category SET DEFAULT ''
    `);

    await query(
      `
        UPDATE ${tableName}
        SET category = ''
        WHERE category = $1
      `,
      [LEGACY_GENERAL_LABEL],
    );
  }

  const departmentTables = [
    "tickets",
    "ticket_templates",
    "wiki_pages",
    "wiki_versions",
    "activities",
    "activity_logs",
  ];

  for (const tableName of departmentTables) {
    await query(`
      ALTER TABLE ${tableName}
      ALTER COLUMN department SET DEFAULT ''
    `);

    await query(
      `
        UPDATE ${tableName}
        SET department = ''
        WHERE department = $1
      `,
      [LEGACY_GENERAL_LABEL],
    );
  }
}

async function ensureIndexes() {
  await query(`
    CREATE INDEX IF NOT EXISTS tickets_status_idx
    ON tickets(status)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS tickets_category_idx
    ON tickets(category)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS tickets_created_at_idx
    ON tickets(created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS wiki_pages_category_idx
    ON wiki_pages(category)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS wiki_pages_slug_idx
    ON wiki_pages(slug)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS news_posts_category_idx
    ON news_posts(category)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS activities_created_at_idx
    ON activities(created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
    ON activity_logs(created_at DESC)
  `);
}

async function seedBaseCompany() {
  await query(`
    INSERT INTO companies (
      name,
      slug,
      description,
      status
    )
    VALUES (
      'Intern',
      'intern',
      'Interne Standardfirma',
      'active'
    )
    ON CONFLICT (slug) DO NOTHING
  `);
}

export async function ensureSystemDatabaseSchema() {
  await ensureCoreTables();
  await ensureAppSettingsSingletonTable();
  await ensureTaxonomyTable();
  await seedDefaultPermissions();
  await seedDefaultAdminModules();
  await ensureIndexes();
  await seedBaseCompany();
}

export async function getSystemDatabaseHealth() {
  const connection = await queryOne<{
    now: string;
    database: string;
  }>(`
    SELECT
      NOW()::TEXT AS now,
      current_database() AS database
  `);

  const expectedTables = [
    "companies",
    "departments",
    "admin_users",
    "permissions",
    "company_permissions",
    "department_permissions",
    "user_permissions",
    "tickets",
    "ticket_templates",
    "wiki_pages",
    "wiki_versions",
    "news_posts",
    "news_opened",
    "files",
    "comments",
    "activities",
    "activity_logs",
    "taxonomy_items",
    "app_settings",
    "user_settings",
    "admin_modules",
  ];

  const tableRows: TableHealthRow[] = [];

  for (const tableName of expectedTables) {
    const exists = await tableExists(tableName);

    if (!exists) {
      tableRows.push({
        table_name: tableName,
        row_count: "missing",
      });

      continue;
    }

    const count = await queryOne<{ count: string }>(
      `
        SELECT COUNT(*)::TEXT AS count
        FROM ${tableName}
      `,
    );

    tableRows.push({
      table_name: tableName,
      row_count: count?.count || "0",
    });
  }

  return {
    ok: true,
    database: connection?.database || "unknown",
    now: connection?.now || "",
    tables: tableRows,
  };
}