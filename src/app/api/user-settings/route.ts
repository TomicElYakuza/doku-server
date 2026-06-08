import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import {
  getCurrentServerUser,
  isPermissionError,
} from "../../../lib/serverPermissions";

type UserSettingsRow = {
  user_id: string;
  theme: string;
  accent_color: string;
  compact_mode: boolean;
  updated_at: string;
};

type UserSettingsUpdateBody = {
  theme?: string;
  accentColor?: string;
  compactMode?: boolean;
};

const DEFAULT_THEME = "modern";
const DEFAULT_ACCENT_COLOR = "velunis";
const DEFAULT_COMPACT_MODE = false;

function mapUserSettingsRow(row: UserSettingsRow) {
  return {
    userId: row.user_id,
    theme: row.theme,
    accentColor: row.accent_color,
    compactMode: row.compact_mode,
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

  return DEFAULT_THEME;
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

  return DEFAULT_ACCENT_COLOR;
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

async function ensureUserSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'modern',
      accent_color TEXT NOT NULL DEFAULT 'velunis',
      compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'modern'
  `);

  await query(`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT 'velunis'
  `);

  await query(`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN NOT NULL DEFAULT FALSE
  `);

  await query(`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await query(`
    ALTER TABLE user_settings
    ALTER COLUMN theme SET DEFAULT 'modern'
  `);

  await query(`
    ALTER TABLE user_settings
    ALTER COLUMN accent_color SET DEFAULT 'velunis'
  `);

  await query(`
    UPDATE user_settings
    SET
      theme = CASE
        WHEN theme IN ('modern', 'light', 'dark', 'system') THEN theme
        ELSE 'modern'
      END,
      accent_color = CASE
        WHEN accent_color IN ('velunis', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN accent_color
        ELSE 'velunis'
      END,
      compact_mode = COALESCE(compact_mode, FALSE),
      updated_at = NOW()
  `);
}

async function ensureUserSettings(userId: string) {
  await ensureUserSettingsTable();

  return queryOne<UserSettingsRow>(
    `
      INSERT INTO user_settings (
        user_id,
        theme,
        accent_color,
        compact_mode
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        theme = CASE
          WHEN user_settings.theme IN ('modern', 'light', 'dark', 'system') THEN user_settings.theme
          ELSE EXCLUDED.theme
        END,
        accent_color = CASE
          WHEN user_settings.accent_color IN ('velunis', 'blue', 'green', 'red', 'orange', 'purple', 'indigo', 'emerald', 'amber') THEN user_settings.accent_color
          ELSE EXCLUDED.accent_color
        END,
        compact_mode = COALESCE(user_settings.compact_mode, EXCLUDED.compact_mode)
      RETURNING
        user_id,
        theme,
        accent_color,
        compact_mode,
        updated_at
    `,
    [
      userId,
      DEFAULT_THEME,
      DEFAULT_ACCENT_COLOR,
      DEFAULT_COMPACT_MODE,
    ],
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

    const row = await ensureUserSettings(currentUser.id);

    if (!row) {
      return NextResponse.json(
        {
          message: "Benutzereinstellungen konnten nicht geladen werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapUserSettingsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzereinstellungen konnten nicht geladen werden.",
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

    const current = await ensureUserSettings(currentUser.id);

    if (!current) {
      return NextResponse.json(
        {
          message: "Benutzereinstellungen konnten nicht vorbereitet werden.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as UserSettingsUpdateBody;

    const row = await queryOne<UserSettingsRow>(
      `
        UPDATE user_settings
        SET
          theme = $1,
          accent_color = $2,
          compact_mode = $3,
          updated_at = NOW()
        WHERE user_id = $4
        RETURNING
          user_id,
          theme,
          accent_color,
          compact_mode,
          updated_at
      `,
      [
        body.theme !== undefined
          ? normalizeTheme(body.theme)
          : normalizeTheme(current.theme),
        body.accentColor !== undefined
          ? normalizeAccentColor(body.accentColor)
          : normalizeAccentColor(current.accent_color),
        typeof body.compactMode === "boolean"
          ? body.compactMode
          : current.compact_mode,
        currentUser.id,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Benutzereinstellungen konnten nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapUserSettingsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Benutzereinstellungen konnten nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}