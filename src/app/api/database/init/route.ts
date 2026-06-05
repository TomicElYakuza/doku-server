import {
  NextResponse,
} from "next/server";
import {
  query,
} from "../../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

export async function POST() {
  try {
    await requireAnyServerPermission([
      "settings.manage",
      "organization.manage",
      "users.manage_permissions",
    ]);

    const currentUser = await getCurrentServerUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen die Datenbankinitialisierung ausführen.",
        },
        {
          status: 403,
        },
      );
    }

    await query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(company_id, slug)
      );
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
        department TEXT NOT NULL DEFAULT 'Allgemein',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
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
        department TEXT NOT NULL DEFAULT 'Allgemein',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        permission_key TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Allgemein',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS company_permissions (
        id TEXT PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        permission_key TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(company_id, permission_key)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS department_permissions (
        id TEXT PRIMARY KEY,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        permission_key TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(department_id, permission_key)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        permission_key TEXT NOT NULL,
        scope_type TEXT NOT NULL DEFAULT 'global',
        scope_id TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, permission_key, scope_type, scope_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT NOT NULL,
        company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        company TEXT NOT NULL DEFAULT 'Intern',
        department TEXT NOT NULL DEFAULT 'Allgemein',
        assigned_to TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT 'System',
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ticket_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT NOT NULL DEFAULT 'Allgemein',
        company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        company TEXT NOT NULL DEFAULT 'Intern',
        department TEXT NOT NULL DEFAULT 'Allgemein',
        assigned_to TEXT NOT NULL DEFAULT '',
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wiki_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '',
        company TEXT NOT NULL DEFAULT 'Intern',
        category TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT 'Allgemein',
        author TEXT NOT NULL DEFAULT 'System',
        tags TEXT[] NOT NULL DEFAULT '{}',
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS news_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'Allgemein',
        author TEXT NOT NULL DEFAULT 'System',
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS news_opened (
        news_id TEXT NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY(news_id, user_email)
      );
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
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        author TEXT NOT NULL DEFAULT 'Unbekannt',
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
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
        department TEXT NOT NULL DEFAULT 'Allgemein',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
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
        department TEXT NOT NULL DEFAULT 'Allgemein',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS taxonomy_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        target TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        parent_id UUID REFERENCES taxonomy_items(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        app_name TEXT NOT NULL DEFAULT 'Intranet',
        company_name TEXT NOT NULL DEFAULT 'Intern',
        app_version TEXT NOT NULL DEFAULT '0.1.0',
        theme TEXT NOT NULL DEFAULT 'modern',
        dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
        accent_color TEXT NOT NULL DEFAULT 'zinc',
        app_accent_color TEXT NOT NULL DEFAULT 'zinc',
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
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
        theme TEXT NOT NULL DEFAULT 'modern',
        accent_color TEXT NOT NULL DEFAULT 'zinc',
        compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      ALTER TABLE app_settings
      DROP COLUMN IF EXISTS show_demo_hints;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS app_accent_color TEXT NOT NULL DEFAULT 'zinc';
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS sidebar_position TEXT NOT NULL DEFAULT 'left';
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_ticket_comments BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_ticket_templates BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS enable_activity_log BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_user_role TEXT NOT NULL DEFAULT 'employee';
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_ticket_view TEXT NOT NULL DEFAULT 'table';
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS default_wiki_view TEXT NOT NULL DEFAULT 'table';
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS hide_closed_tickets_by_default BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS tickets_per_page INTEGER NOT NULL DEFAULT 25;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS wiki_per_page INTEGER NOT NULL DEFAULT 25;
    `);

    await query(`
      ALTER TABLE app_settings
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    await query(`
      ALTER TABLE taxonomy_items
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await query(`
      ALTER TABLE taxonomy_items
      ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    `);

    await query(`
      ALTER TABLE taxonomy_items
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    await query(`
      ALTER TABLE taxonomy_items
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    await query(`
      ALTER TABLE tickets
      ALTER COLUMN category DROP DEFAULT;
    `);

    await query(`
      ALTER TABLE wiki_pages
      ALTER COLUMN category DROP DEFAULT;
    `);

    await query(`
      ALTER TABLE news_posts
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS user_display TEXT NOT NULL DEFAULT 'System';
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT 'Intern';
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Allgemein';
    `);

    await query(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
    `);

    await query(`
      INSERT INTO app_settings (
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
      VALUES (
        'default',
        'Intranet',
        'Intern',
        '0.1.0',
        'modern',
        FALSE,
        'zinc',
        'zinc',
        'left',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        'employee',
        'table',
        'table',
        TRUE,
        25,
        25,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    return NextResponse.json({
      ok: true,
      message: "Datenbank wurde initialisiert.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Datenbank konnte nicht initialisiert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}