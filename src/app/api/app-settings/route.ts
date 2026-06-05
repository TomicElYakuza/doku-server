import {
  NextResponse,
} from "next/server";
import {
  queryOne,
} from "../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type AppSettingsRow = {
  id: string;
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
};

const DEFAULT_SETTINGS_ID = "default";

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
  showDemoHints: false,
  enableTicketComments: true,
  enableTicketTemplates: true,
  enableActivityLog: true,
  defaultUserRole: "employee",
  updatedAt: "",
};

function mapSettingsRow(row: AppSettingsRow) {
  return {
    id: row.id,
    appName: row.app_name,
    companyName: row.company_name,
    appVersion: row.app_version,
    version: row.app_version,
    theme: row.theme,
    darkMode: row.dark_mode,
    accentColor: row.accent_color,
    appAccentColor: row.app_accent_color,
    sidebarPosition: row.sidebar_position,
    compactMode: row.compact_mode,
    showVersion: row.show_version,
    showDemoHints: false,
    enableTicketComments: row.enable_ticket_comments,
    enableTicketTemplates: row.enable_ticket_templates,
    enableActivityLog: row.enable_activity_log,
    defaultUserRole: row.default_user_role,
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
    value === "zinc" ||
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

  return error instanceof Error
    ? error.message
    : fallback;
}

async function ensureSettingsRow() {
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
        default_user_role
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      )
      ON CONFLICT (id) DO UPDATE SET
        id = EXCLUDED.id
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
    ],
  );

  return row;
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
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAnyServerPermission([
      "settings.manage",
    ]);

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
        : current.accent_color;

    const nextAppAccentColor =
      body.appAccentColor !== undefined
        ? normalizeAccentColor(body.appAccentColor)
        : body.accentColor !== undefined
          ? nextAccentColor
          : current.app_accent_color || nextAccentColor;

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
          updated_at = NOW()
        WHERE id = $15
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
        body.theme !== undefined
          ? normalizeTheme(body.theme)
          : current.theme,
        typeof body.darkMode === "boolean"
          ? body.darkMode
          : current.dark_mode,
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
          : current.default_user_role,
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
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE() {
  try {
    await requireAnyServerPermission([
      "settings.manage",
    ]);

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
          updated_at = NOW()
        WHERE id = $15
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
          updated_at
      `,
      [
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
        DEFAULT_SETTINGS_ID,
      ],
    );

    if (!row) {
      const created = await ensureSettingsRow();

      return NextResponse.json(
        created
          ? mapSettingsRow(created)
          : defaultSettings,
      );
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
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}