import { NextResponse } from "next/server";

import {
  createTaxonomyItem,
  listTaxonomyItems,
} from "../../../lib/database/taxonomyStore";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";
import type { TaxonomyCreateInput } from "../../../types/taxonomy";

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  if (
    error instanceof Error &&
    (error.message === "Name ist erforderlich." ||
      error.message === "Parent-Eintrag wurde nicht gefunden." ||
      error.message ===
        "Parent-Eintrag muss denselben Typ und dasselbe Ziel haben.")
  ) {
    return 400;
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

    const url = new URL(request.url);

    const items = await listTaxonomyItems({
      type: url.searchParams.get("type"),
      target: url.searchParams.get("target"),
      status: url.searchParams.get("status"),
      parentId: url.searchParams.get("parentId"),
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie konnte nicht geladen werden.",
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
    await requireAnyServerPermission([
      "taxonomy.manage",
      "settings.manage",
      "admin.view",
    ]);

    const body = (await request.json()) as TaxonomyCreateInput;
    const item = await createTaxonomyItem(body);

    return NextResponse.json(item, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht erstellt werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}