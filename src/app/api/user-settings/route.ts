import {
  NextResponse,
} from "next/server";

import {
  queryOne,
} from "../../../lib/database/db";

import {
  getCurrentServerUser,
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

function mapUserSettingsRow(
  row: UserSettingsRow
) {
  return {
    userId:
      row.user_id,

    theme:
      row.theme,

    accentColor:
      row.accent_color,

    compactMode:
      row.compact_mode,

    updatedAt:
      row.updated_at,
  };
}

function normalizeTheme(
  value?: string
) {
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

function normalizeAccentColor(
  value?: string
) {
  if (
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

  return "zinc";
}

async function ensureUserSettings(
  userId: string
) {
  return queryOne<UserSettingsRow>(
    `
    INSERT INTO user_settings (
      user_id,
      theme,
      accent_color,
      compact_mode
    )
    VALUES (
      $1,
      'modern',
      'zinc',
      false
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id
    RETURNING
      user_id,
      theme,
      accent_color,
      compact_mode,
      updated_at
    `,
    [
      userId,
    ]
  );
}

export async function GET() {
  try {
    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const row =
      await ensureUserSettings(
        currentUser.id
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Benutzereinstellungen konnten nicht geladen werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapUserSettingsRow(
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
          "Benutzereinstellungen konnten nicht geladen werden.",

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
    const currentUser =
      await getCurrentServerUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message:
            "Nicht angemeldet.",
        },
        {
          status:
            401,
        }
      );
    }

    const current =
      await ensureUserSettings(
        currentUser.id
      );

    if (!current) {
      return NextResponse.json(
        {
          message:
            "Benutzereinstellungen konnten nicht vorbereitet werden.",
        },
        {
          status:
            500,
        }
      );
    }

    const body =
      await request.json() as UserSettingsUpdateBody;

    const row =
      await queryOne<UserSettingsRow>(
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
            ? normalizeTheme(
                body.theme
              )
            : current.theme,

          body.accentColor !== undefined
            ? normalizeAccentColor(
                body.accentColor
              )
            : current.accent_color,

          typeof body.compactMode === "boolean"
            ? body.compactMode
            : current.compact_mode,

          currentUser.id,
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "Benutzereinstellungen konnten nicht gespeichert werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapUserSettingsRow(
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
          "Benutzereinstellungen konnten nicht gespeichert werden.",

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