import { NextResponse } from "next/server";

import { query, queryOne } from "../../../lib/database/db";
import { mapFileRow } from "../../../lib/database/mappers/fileMapper";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type { FileRow } from "../../../lib/database/mappers/fileMapper";

type CreateFileBody = {
  key?: string;
  storageKey?: string;
  name?: string;
  type?: string;
  size?: number;
  data?: string;
  uploadedBy?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeFileSize(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0;
  }

  return Math.floor(numberValue);
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

export async function GET(request: Request) {
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
      "files.view",
      "files.upload",
      "files.delete",
      "admin.view",
    ]);

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    const params: unknown[] = [];
    const whereSql = key ? "WHERE storage_key = $1" : "";

    if (key) {
      params.push(key);
    }

    const rows = await query<FileRow>(
      `
        SELECT
          id,
          storage_key,
          name,
          type,
          size,
          data,
          uploaded_by,
          uploaded_at
        FROM files
        ${whereSql}
        ORDER BY uploaded_at DESC
      `,
      params,
    );

    return NextResponse.json(rows.map(mapFileRow));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Dateien konnten nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function POST(request: Request) {
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
      "files.upload",
      "settings.manage",
    ]);

    const body = (await request.json()) as CreateFileBody;

    const storageKey = normalizeText(body.storageKey || body.key);
    const name = normalizeText(body.name);
    const data = String(body.data || "");

    if (!storageKey) {
      return NextResponse.json(
        {
          message: "Storage-Key ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Dateiname ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          message: "Dateiinhalt ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const row = await queryOne<FileRow>(
      `
        INSERT INTO files (
          storage_key,
          name,
          type,
          size,
          data,
          uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          storage_key,
          name,
          type,
          size,
          data,
          uploaded_by,
          uploaded_at
      `,
      [
        storageKey,
        name,
        normalizeText(body.type) || "application/octet-stream",
        normalizeFileSize(body.size),
        data,
        normalizeText(body.uploadedBy) || currentUser.name || "Unbekannt",
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Datei konnte nicht gespeichert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapFileRow(row), {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Datei konnte nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}