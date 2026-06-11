import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type AppSettingsRow = {
  id: number;
  app_name: string;
  company_name: string;
  app_version: string;
  theme: string;
  dark_mode: boolean;
  accent_color: string;
  app_accent_color: string;
  sidebar_position: string;
  compact_mode: boolean;
  show_version: boolean;
  enable_ticket_comments: boolean;
  enable_ticket_templates: boolean;
  enable_activity_log: boolean;
  default_user_role: string;
  default_ticket_view: string;
  default_wiki_view: string;
  hide_closed_tickets_by_default: boolean;
  tickets_per_page: number;
  wiki_per_page: number;
  updated_at: string;
};

type AppSettingsUpdateBody = {
  appName?: string;
  companyName?: string;
  appVersion?: string;
  version?: string;
  theme?: string;
  darkMode?: boolean;
  accentColor?: string;
  appAccentColor?: string;
  sidebarPosition?: string;
  compactMode?: boolean;
  showVersion?: boolean;
  enableTicketComments?: boolean;
  enableTicketTemplates?: boolean;
  enableActivityLog?: boolean;
  defaultUserRole?: string;
  defaultTicketView?: string;
  defaultWikiView?: string;
  hideClosedTicketsByDefault?: boolean;
  ticketsPerPage?: number;
  wikiPerPage?: number;
};

const DEFAULT_SETTINGS_ID = 1;

const defaultSettings = {
  id: DEFAULT_SETTINGS_ID,
  appName: "Intranet",
  companyName: "Velunis",
  appVersion: "0.1.0",
  version: "0.1.0",
  theme: "modern",
  darkMode: false,
  accentColor: "velunis",
  appAccentColor: "velunis",
  sidebarPosition: "left",
  compactMode: false,
  showVersion: true,
  enableTicketComments: true,
  enableTicketTemplates: true,
  enableActivityLog: true,
  defaultUserRole: "employee",
  defaultTicketView: "table",
  defaultWikiView: "table",
  hideClosedTicketsByDefault: true,
  ticketsPerPage: 25,
  wikiPerPage: 25,
  updatedAt: "",
};

function mapSettingsRow(row: AppSettingsRow) {
  return {
    id: String(row.id),
    appName: row.app_name,
    companyName: row.company_name,
    appVersion: row.app_version,
    version: row.app_version,
    theme: row.theme,
    darkMode: row.dark_mode,
    accentColor: row.accent_color,
    appAccentColor: row.app_accent_color || row.accent_color,
    sidebarPosition: row.sidebar_position,
    compactMode: row.compact_mode,
    showVersion: row.show_version,
    enableTicketComments: row.enable_ticket_comments,
    enableTicketTemplates: row.enable_ticket_templates,
    enableActivityLog: row.enable_activity_log,
    defaultUserRole: normalizeDefaultUserRole(row.default_user_role),
    defaultTicketView: row.default_ticket_view,
    defaultWikiView: row.default_wiki_view,
    hideClosedTicketsByDefault: row.hide_closed_tickets_by_default,
    ticketsPerPage: row.tickets_per_page,
    wikiPerPage: row.wiki_per_page,
    updatedAt: row.updated_at,
  };
}

function normalizeTheme(value?: string) {
  if (value === "light") {
    return "light";
  }

  if (value === "dark") {
    return "dark";
  }

  if (value === "system") {
    return "system";
  }

  return "modern";
}

function normalizeAccentColor(value?: string) {
  if (
    value === "velunis" ||
    value === "blue" ||
    value === "green" ||
    value === "red" ||
    value === "orange" ||
    value === "purple" ||
    value === "indigo" ||
    value === "emerald" ||
    value === "amber"
  ) {
    return value;
  }

  return "velunis";
}

function normalizeSidebarPosition(value?: string) {
  if (value === "right") {
    return "right";
  }

  return "left";
}

function normalizeDefaultUserRole(value?: string) {
  if (value === "admin") {
    return "admin";
  }

  if (value === "department_lead") {
    return "department_lead";
  }

  return "employee";
}

function normalizeListView(value?: string) {
  if (value === "cards") {
    return "cards";
  }

  return "table";
}

function normalizePageSize(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  const rounded = Math.round(numberValue);

  if (rounded < 5) {
    return 5;
  }

  if (rounded > 100) {
    return 100;
  }

  return rounded;
}

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPermissionError(error)) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error ? error.message : fallback;
}

async function ensureSettingsTable() {
  await query(`
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
  `);

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
    ALTER TABLE app_settings
    ALTER COLUMN company_name SET DEFAULT 'Velunis'
  `);

  await query(`
    ALTER TABLE app_settings
    ALTER COLUMN accent_color SET DEFAULT 'velunis'
  `);

  await query(`
    ALTER TABLE app_settings
    ALTER COLUMN app_accent_color SET DEFAULT 'velunis'
  `);

  await query(`
    ALTER TABLE app_settings
    ALTER COLUMN default_user_role SET DEFAULT 'employee'
  `);
}

async function ensureSettingsRow() {
  await ensureSettingsTable();

  await query(
    `
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
        wiki_per_page
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20
      )
      ON CONFLICT (id) DO NOTHING
    `,
    [
      DEFAULT_SETTINGS_ID,
      defaultSettings.appName,
      defaultSettings.companyName,
      defaultSettings.appVersion,
      defaultSettings.theme,
      defaultSettings.darkMode,
      defaultSettings.accentColor,
      defaultSettings.appAccentColor,
      defaultSettings.sidebarPosition,
      defaultSettings.compactMode,
      defaultSettings.showVersion,
      defaultSettings.enableTicketComments,
      defaultSettings.enableTicketTemplates,
      defaultSettings.enableActivityLog,
      defaultSettings.defaultUserRole,
      defaultSettings.defaultTicketView,
      defaultSettings.defaultWikiView,
      defaultSettings.hideClosedTicketsByDefault,
      defaultSettings.ticketsPerPage,
      defaultSettings.wikiPerPage,
    ],
  );

  await query(
    `
      UPDATE app_settings
      SET
        app_name = COALESCE(NULLIF(app_name, ''), 'Intranet'),
        company_name = COALESCE(NULLIF(company_name, ''), 'Velunis'),
        app_version = COALESCE(NULLIF(app_version, ''), '0.1.0'),
        theme = CASE
          WHEN theme IN ('modern', 'light', 'dark', 'system') THEN theme
          ELSE 'modern'
        END,
        accent_color = CASE
          WHEN accent_color IN ('velunis', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
          ELSE 'velunis'
        END,
        app_accent_color = CASE
          WHEN app_accent_color IN ('velunis', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN app_accent_color
          WHEN accent_color IN ('velunis', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
          ELSE 'velunis'
        END,
        sidebar_position = CASE
          WHEN sidebar_position = 'right' THEN 'right'
          ELSE 'left'
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
        END
      WHERE id = $1
    `,
    [DEFAULT_SETTINGS_ID],
  );

  return queryOne<AppSettingsRow>(
    `
      SELECT
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
      FROM app_settings
      WHERE id = $1
    `,
    [DEFAULT_SETTINGS_ID],
  );
}

export async function GET() {
  try {
    const currentUser = await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    await requireAnyServerPermission([
      "settings.view",
      "settings.manage",
      "admin.view",
    ]);

    const row = await ensureSettingsRow();

    if (!row) {
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(mapSettingsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Einstellungen konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    await requireAnyServerPermission(["settings.manage"]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Systemeinstellungen ändern.",
        },
        {
          status: 403,
        },
      );
    }

    const current = await ensureSettingsRow();

    if (!current) {
      return NextResponse.json(
        {
          message: "Einstellungen konnten nicht vorbereitet werden.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as AppSettingsUpdateBody;

    const nextAppVersion =
      body.appVersion ||
      body.version ||
      current.app_version ||
      defaultSettings.appVersion;

    const nextAccentColor =
      body.accentColor !== undefined
        ? normalizeAccentColor(body.accentColor)
        : normalizeAccentColor(current.accent_color);

    const nextAppAccentColor =
      body.appAccentColor !== undefined
        ? normalizeAccentColor(body.appAccentColor)
        : body.accentColor !== undefined
          ? nextAccentColor
          : normalizeAccentColor(current.app_accent_color || nextAccentColor);

    const row = await queryOne<AppSettingsRow>(
      `
        UPDATE app_settings
        SET
          app_name = $1,
          company_name = $2,
          app_version = $3,
          theme = $4,
          dark_mode = $5,
          accent_color = $6,
          app_accent_color = $7,
          sidebar_position = $8,
          compact_mode = $9,
          show_version = $10,
          enable_ticket_comments = $11,
          enable_ticket_templates = $12,
          enable_activity_log = $13,
          default_user_role = $14,
          default_ticket_view = $15,
          default_wiki_view = $16,
          hide_closed_tickets_by_default = $17,
          tickets_per_page = $18,
          wiki_per_page = $19,
          updated_at = NOW()
        WHERE id = $20
        RETURNING
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
      `,
      [
        body.appName !== undefined
          ? body.appName || defaultSettings.appName
          : current.app_name,
        body.companyName !== undefined
          ? body.companyName || defaultSettings.companyName
          : current.company_name,
        nextAppVersion,
        body.theme !== undefined ? normalizeTheme(body.theme) : current.theme,
        typeof body.darkMode === "boolean" ? body.darkMode : current.dark_mode,
        nextAccentColor,
        nextAppAccentColor,
        body.sidebarPosition !== undefined
          ? normalizeSidebarPosition(body.sidebarPosition)
          : current.sidebar_position,
        typeof body.compactMode === "boolean"
          ? body.compactMode
          : current.compact_mode,
        typeof body.showVersion === "boolean"
          ? body.showVersion
          : current.show_version,
        typeof body.enableTicketComments === "boolean"
          ? body.enableTicketComments
          : current.enable_ticket_comments,
        typeof body.enableTicketTemplates === "boolean"
          ? body.enableTicketTemplates
          : current.enable_ticket_templates,
        typeof body.enableActivityLog === "boolean"
          ? body.enableActivityLog
          : current.enable_activity_log,
        body.defaultUserRole !== undefined
          ? normalizeDefaultUserRole(body.defaultUserRole)
          : normalizeDefaultUserRole(current.default_user_role),
        body.defaultTicketView !== undefined
          ? normalizeListView(body.defaultTicketView)
          : normalizeListView(current.default_ticket_view),
        body.defaultWikiView !== undefined
          ? normalizeListView(body.defaultWikiView)
          : normalizeListView(current.default_wiki_view),
        typeof body.hideClosedTicketsByDefault === "boolean"
          ? body.hideClosedTicketsByDefault
          : current.hide_closed_tickets_by_default,
        body.ticketsPerPage !== undefined
          ? normalizePageSize(body.ticketsPerPage, defaultSettings.ticketsPerPage)
          : normalizePageSize(
              current.tickets_per_page,
              defaultSettings.ticketsPerPage,
            ),
        body.wikiPerPage !== undefined
          ? normalizePageSize(body.wikiPerPage, defaultSettings.wikiPerPage)
          : normalizePageSize(current.wiki_per_page, defaultSettings.wikiPerPage),
        DEFAULT_SETTINGS_ID,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Einstellungen konnten nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapSettingsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Einstellungen konnten nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE() {
  try {
    const currentUser = await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    await requireAnyServerPermission(["settings.manage"]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "Nur Administratoren dürfen Systemeinstellungen zurücksetzen.",
        },
        {
          status: 403,
        },
      );
    }

    await ensureSettingsTable();

    const row = await queryOne<AppSettingsRow>(
      `
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
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          app_name = EXCLUDED.app_name,
          company_name = EXCLUDED.company_name,
          app_version = EXCLUDED.app_version,
          theme = EXCLUDED.theme,
          dark_mode = EXCLUDED.dark_mode,
          accent_color = EXCLUDED.accent_color,
          app_accent_color = EXCLUDED.app_accent_color,
          sidebar_position = EXCLUDED.sidebar_position,
          compact_mode = EXCLUDED.compact_mode,
          show_version = EXCLUDED.show_version,
          enable_ticket_comments = EXCLUDED.enable_ticket_comments,
          enable_ticket_templates = EXCLUDED.enable_ticket_templates,
          enable_activity_log = EXCLUDED.enable_activity_log,
          default_user_role = EXCLUDED.default_user_role,
          default_ticket_view = EXCLUDED.default_ticket_view,
          default_wiki_view = EXCLUDED.default_wiki_view,
          hide_closed_tickets_by_default = EXCLUDED.hide_closed_tickets_by_default,
          tickets_per_page = EXCLUDED.tickets_per_page,
          wiki_per_page = EXCLUDED.wiki_per_page,
          updated_at = NOW()
        RETURNING
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
      `,
      [
        DEFAULT_SETTINGS_ID,
        defaultSettings.appName,
        defaultSettings.companyName,
        defaultSettings.appVersion,
        defaultSettings.theme,
        defaultSettings.darkMode,
        defaultSettings.accentColor,
        defaultSettings.appAccentColor,
        defaultSettings.sidebarPosition,
        defaultSettings.compactMode,
        defaultSettings.showVersion,
        defaultSettings.enableTicketComments,
        defaultSettings.enableTicketTemplates,
        defaultSettings.enableActivityLog,
        defaultSettings.defaultUserRole,
        defaultSettings.defaultTicketView,
        defaultSettings.defaultWikiView,
        defaultSettings.hideClosedTicketsByDefault,
        defaultSettings.ticketsPerPage,
        defaultSettings.wikiPerPage,
      ],
    );

    if (!row) {
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(mapSettingsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Einstellungen konnten nicht zurückgesetzt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}