import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../lib/database/db";

import {
  mapAppSettingsRow,
} from "../../../lib/database/mappers/appSettingsMapper";

import type {
  AppSettingsRow,
} from "../../../lib/database/mappers/appSettingsMapper";

type UpdateSettingsBody = {
  appName?: string;
  companyName?: string;
  appVersion?: string;
  version?: string;
  theme?: string;
  darkMode?: boolean;
  accentColor?: string;
  appAccentColor?: string;
  sidebarPosition?: string;
  showVersion?: boolean;
  compactMode?: boolean;
  showDemoHints?: boolean;
  enableTicketTemplates?: boolean;
  enableTicketComments?: boolean;
  enableActivityLog?: boolean;
  defaultUserRole?: string;
};

export async function GET() {
  try {
    const row =
      await queryOne<AppSettingsRow>(
        `
        SELECT
          id,
          app_name,
          company_name,
          app_version,
          theme,
          dark_mode,
          accent_color,
          sidebar_position,
          show_version,
          compact_mode,
          show_demo_hints,
          enable_ticket_templates,
          enable_ticket_comments,
          enable_activity_log,
          default_user_role,
          updated_at
        FROM app_settings
        WHERE id = 1
        `
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Einstellungen nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    return NextResponse.json(
      mapAppSettingsRow(
        row
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Einstellungen konnten nicht geladen werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body =
      await request.json() as UpdateSettingsBody;

    const current =
      await queryOne<AppSettingsRow>(
        `
        SELECT
          id,
          app_name,
          company_name,
          app_version,
          theme,
          dark_mode,
          accent_color,
          sidebar_position,
          show_version,
          compact_mode,
          show_demo_hints,
          enable_ticket_templates,
          enable_ticket_comments,
          enable_activity_log,
          default_user_role,
          updated_at
        FROM app_settings
        WHERE id = 1
        `
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Einstellungen nicht gefunden.",
        },
        {
          status:
            404,
        }
      );
    }

    const row =
      await queryOne<AppSettingsRow>(
        `
        UPDATE app_settings
        SET
          app_name = $1,
          company_name = $2,
          app_version = $3,
          theme = $4,
          dark_mode = $5,
          accent_color = $6,
          sidebar_position = $7,
          show_version = $8,
          compact_mode = $9,
          show_demo_hints = $10,
          enable_ticket_templates = $11,
          enable_ticket_comments = $12,
          enable_activity_log = $13,
          default_user_role = $14,
          updated_at = NOW()
        WHERE id = 1
        RETURNING
          id,
          app_name,
          company_name,
          app_version,
          theme,
          dark_mode,
          accent_color,
          sidebar_position,
          show_version,
          compact_mode,
          show_demo_hints,
          enable_ticket_templates,
          enable_ticket_comments,
          enable_activity_log,
          default_user_role,
          updated_at
        `,
        [
          body.appName ||
            current.app_name,
          body.companyName ||
            current.company_name,
          body.appVersion ||
            body.version ||
            current.app_version,
          body.theme ||
            current.theme,
          body.darkMode !== undefined
            ? body.darkMode
            : current.dark_mode,
          body.accentColor ||
            body.appAccentColor ||
            current.accent_color,
          body.sidebarPosition ||
            current.sidebar_position,
          body.showVersion !== undefined
            ? body.showVersion
            : current.show_version,
          body.compactMode !== undefined
            ? body.compactMode
            : current.compact_mode,
          body.showDemoHints !== undefined
            ? body.showDemoHints
            : current.show_demo_hints,
          body.enableTicketTemplates !== undefined
            ? body.enableTicketTemplates
            : current.enable_ticket_templates,
          body.enableTicketComments !== undefined
            ? body.enableTicketComments
            : current.enable_ticket_comments,
          body.enableActivityLog !== undefined
            ? body.enableActivityLog
            : current.enable_activity_log,
          body.defaultUserRole ||
            current.default_user_role,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Einstellungen konnten nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapAppSettingsRow(
        row
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          "Einstellungen konnten nicht gespeichert werden.",

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          500,
      }
    );
  }
}