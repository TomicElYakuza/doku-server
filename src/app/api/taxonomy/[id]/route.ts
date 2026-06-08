import { NextResponse } from "next/server";

import {
  deleteTaxonomyItem,
  findTaxonomyItemById,
  updateTaxonomyItem,
} from "../../../../lib/database/taxonomyStore";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { TaxonomyUpdateInput } from "../../../../types/taxonomy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getErrorStatus(error: unknown) {
  if (isPermissionError(error)) {
    return 403;
  }

  if (
    error instanceof Error &&
    (error.message === "Name ist erforderlich." ||
      error.message === "Ein Eintrag kann nicht sein eigener Parent sein." ||
      error.message === "Parent-Eintrag wurde nicht gefunden." ||
      error.message ===
        "Parent-Eintrag muss denselben Typ und dasselbe Ziel haben." ||
      error.message ===
        "Parent-Auswahl würde eine ungültige Kreisstruktur erzeugen." ||
      error.message ===
        "Taxonomie-Eintrag hat Untereinträge und kann nicht gelöscht werden.")
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

export async function GET(_request: Request, context: RouteContext) {
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

    const { id } = await context.params;
    const item = await findTaxonomyItemById(decodeURIComponent(id));

    if (!item) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht geladen werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "taxonomy.manage",
      "settings.manage",
      "admin.view",
    ]);

    const { id } = await context.params;
    const body = (await request.json()) as TaxonomyUpdateInput;

    const item = await updateTaxonomyItem(decodeURIComponent(id), body);

    if (!item) {
      return NextResponse.json(
        {
          message: "Taxonomie-Eintrag wurde nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht gespeichert werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAnyServerPermission([
      "taxonomy.manage",
      "settings.manage",
      "admin.view",
    ]);

    const { id } = await context.params;

    await deleteTaxonomyItem(decodeURIComponent(id));

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Taxonomie-Eintrag konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}