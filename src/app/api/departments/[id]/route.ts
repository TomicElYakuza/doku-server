import { NextResponse } from "next/server";

import { queryOne } from "../../../../lib/database/db";
import { mapDepartmentRow } from "../../../../lib/database/mappers/companyMapper";
import { createSlug } from "../../../../lib/database/slug";
import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../../lib/serverPermissions";
import type { DepartmentRow } from "../../../../lib/database/mappers/companyMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateDepartmentBody = {
  companyId?: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeStatus(value?: string | null, fallback = "active") {
  const status = normalizeText(value);

  if (status === "inactive") {
    return "inactive";
  }

  if (status === "archived") {
    return "archived";
  }

  if (status === "active") {
    return "active";
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

async function findDepartmentById(id: string) {
  return queryOne<DepartmentRow>(
    `
      SELECT
        id,
        company_id,
        name,
        slug,
        description,
        status,
        created_at,
        updated_at
      FROM departments
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
}

function userCanAccessDepartment(
  currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentServerUser>>>,
  department: DepartmentRow,
) {
  if (currentUser.role === "admin") {
    return true;
  }

  if (currentUser.companyId && department.company_id === currentUser.companyId) {
    return true;
  }

  return false;
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
      "departments.manage",
      "admin.view",
      "users.view",
    ]);

    const { id } = await context.params;
    const row = await findDepartmentById(decodeURIComponent(id));

    if (!row) {
      return NextResponse.json(
        {
          message: "Abteilung nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    if (!userCanAccessDepartment(currentUser, row)) {
      return NextResponse.json(
        {
          message: "Keine Berechtigung.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json(mapDepartmentRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Abteilung konnte nicht geladen werden.",
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
      "departments.manage",
      "settings.manage",
    ]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Abteilungen bearbeiten.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateDepartmentBody;

    const current = await findDepartmentById(decodedId);

    if (!current) {
      return NextResponse.json(
        {
          message: "Abteilung nicht gefunden.",
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

    const nextCompanyId =
      body.companyId !== undefined
        ? normalizeText(body.companyId)
        : current.company_id;

    if (!nextCompanyId) {
      return NextResponse.json(
        {
          message: "Firma ist erforderlich.",
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

    const row = await queryOne<DepartmentRow>(
      `
        UPDATE departments
        SET
          company_id = $1,
          name = $2,
          slug = $3,
          description = $4,
          status = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING
          id,
          company_id,
          name,
          slug,
          description,
          status,
          created_at,
          updated_at
      `,
      [
        nextCompanyId,
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
          message: "Abteilung konnte nicht aktualisiert werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(mapDepartmentRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: getErrorMessage(
          error,
          "Abteilung konnte nicht aktualisiert werden.",
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
      "departments.manage",
      "settings.manage",
    ]);

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        {
          message: "Nur Administratoren dürfen Abteilungen löschen.",
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
        DELETE FROM departments
        WHERE id = $1
        RETURNING id
      `,
      [decodedId],
    );

    if (!deleted) {
      return NextResponse.json(
        {
          message: "Abteilung nicht gefunden.",
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
        message: getErrorMessage(
          error,
          "Abteilung konnte nicht gelöscht werden.",
        ),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: getErrorStatus(error),
      },
    );
  }
}