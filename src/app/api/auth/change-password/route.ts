import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { hashPassword, verifyPassword } from "../../../../lib/password";

const AUTH_COOKIE_NAME = "dms_user_email";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

type PasswordUserRow = {
  id: string;
  email: string;
  password_hash: string | null;
};

function normalizePassword(value?: string | null) {
  return String(value || "");
}

function clearAuthCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    return "Das neue Passwort muss mindestens 8 Zeichen haben.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "Das neue Passwort muss mindestens einen Buchstaben enthalten.";
  }

  if (!/[0-9]/.test(password)) {
    return "Das neue Passwort muss mindestens eine Zahl enthalten.";
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const rawEmail = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!rawEmail) {
      return NextResponse.json(
        {
          message: "Nicht angemeldet.",
        },
        {
          status: 401,
        },
      );
    }

    const email = decodeURIComponent(rawEmail);
    const body = (await request.json()) as ChangePasswordBody;

    const currentPassword = normalizePassword(body.currentPassword);
    const newPassword = normalizePassword(body.newPassword);

    if (!currentPassword) {
      return NextResponse.json(
        {
          message: "Aktuelles Passwort ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          message: "Neues Passwort ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const strengthError = validatePasswordStrength(newPassword);

    if (strengthError) {
      return NextResponse.json(
        {
          message: strengthError,
        },
        {
          status: 400,
        },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          message: "Das neue Passwort darf nicht dem aktuellen Passwort entsprechen.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await queryOne<PasswordUserRow>(
      `
        SELECT
          id,
          email,
          password_hash
        FROM admin_users
        WHERE LOWER(email) = LOWER($1)
          AND status = 'active'
        LIMIT 1
      `,
      [email],
    );

    if (!user || !user.password_hash) {
      clearAuthCookie(cookieStore);

      return NextResponse.json(
        {
          message: "Benutzer nicht gefunden oder Passwort nicht gesetzt.",
        },
        {
          status: 404,
        },
      );
    }

    const currentPasswordValid = await verifyPassword(
      currentPassword,
      user.password_hash,
    );

    if (!currentPasswordValid) {
      return NextResponse.json(
        {
          message: "Aktuelles Passwort ist falsch.",
        },
        {
          status: 401,
        },
      );
    }

    const nextPasswordHash = await hashPassword(newPassword);

    const updated = await queryOne<{ id: string }>(
      `
        UPDATE admin_users
        SET
          password_hash = $1,
          password_must_change = FALSE,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id
      `,
      [nextPasswordHash, user.id],
    );

    if (!updated) {
      return NextResponse.json(
        {
          message: "Passwort konnte nicht geändert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Passwort konnte nicht geändert werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}