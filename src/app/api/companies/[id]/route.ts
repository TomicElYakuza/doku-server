import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { mapCompanyRow } from "../../../../lib/database/mappers/companyMapper";
import { createSlug } from "../../../../lib/database/slug";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { CompanyRow } from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateCompanyBody = {
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
};

type ServerUser = NonNullable<Awaited<ReturnType<typeof getCurrentServerUser>>>;

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeStatus(value?: string | null, fallback = "active") {
  const status = normalizeText(value);

  if (status === "active") {
    return "active";
  }

  if (status === "inactive") {
    return "inactive";
  }

  if (status === "archived") {
    return "archived";
  }

  return fallback;
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

function userCanAccessCompany(currentUser: ServerUser, companyId: string) {
  if (currentUser.role === "admin") {
    return true;
  }

  return currentUser.companyId === companyId;
}

async function findCompanyById(id: string) {
  return queryOne<CompanyRow>(
    `
      SELECT
        id,
        name,
        slug,
        description,
        status,
        created_at,
        updated_at
      FROM companies
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
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

    await requireAnyServerPermission([
      "organization.view",
      "organization.manage",
      "companies.manage",
      "admin.view",
      "users.view",
    ]);

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const row = await findCompanyById(decodedId);

    if (!row) {
      return NextResponse.json(
        {
          message: "Firma nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessCompany(currentUser, row.id)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapCompanyRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(error, "Firma konnte nicht geladen werden."),
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
      "organization.manage",
      "companies.manage",
      "settings.manage",
    ]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Firmen bearbeiten.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateCompanyBody;

    const current = await findCompanyById(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "Firma nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    const nextName =
      body.name !== undefined ? normalizeText(body.name) : current.name;

    if (!nextName) {
      return NextResponse.json(
        {
          message: "Name ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const nextSlug =
      body.slug !== undefined
        ? createSlug(body.slug || nextName)
        : current.slug;

    const row = await queryOne<CompanyRow>(
      `
        UPDATE companies
        SET
          name = $1,
          slug = $2,
          description = $3,
          status = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
      `,
      [
        nextName,
        nextSlug,
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description || "",
        body.status !== undefined
          ? normalizeStatus(body.status, current.status)
          : current.status,
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "Firma konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapCompanyRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Firma konnte nicht aktualisiert werden.",
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
      "organization.manage",
      "companies.manage",
      "settings.manage",
    ]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Firmen löschen.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);

    const deleted = await queryOne<{ id: string }>(
      `
        DELETE FROM companies
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Firma nicht gefunden.",
        },
        {
          status: 404,
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
        message: getErrorMessage(error, "Firma konnte nicht gelöscht werden."),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}