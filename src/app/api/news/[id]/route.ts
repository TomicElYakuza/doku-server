import { NextResponse } from "next/server";
import { queryOne } from "../../../../lib/database/db";
import { mapNewsRow } from "../../../../lib/database/mappers/newsMapper";
import type { NewsRow } from "../../../../lib/database/mappers/newsMapper";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateNewsPostBody = {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const row = await queryOne<NewsRow>(
      `
        SELECT
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
        FROM news_posts
        WHERE id = $1
      `,
      [decodeURIComponent(id)],
    );

    if (!row) {
      return NextResponse.json(
        { message: "News nicht gefunden." },
        { status: 404 },
      );
    }

    return NextResponse.json(mapNewsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "News konnte nicht geladen werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const body = (await request.json()) as UpdateNewsPostBody;

    const current = await queryOne<NewsRow>(
      `
        SELECT
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
        FROM news_posts
        WHERE id = $1
      `,
      [decodedId],
    );

    if (!current) {
      return NextResponse.json(
        { message: "News nicht gefunden." },
        { status: 404 },
      );
    }

    const nextTitle =
      body.title !== undefined
        ? normalizeText(body.title)
        : current.title;

    const nextCategory =
      body.category !== undefined
        ? normalizeText(body.category)
        : current.category || "";

    if (!nextTitle) {
      return NextResponse.json(
        { message: "Titel ist erforderlich." },
        { status: 400 },
      );
    }

    if (!nextCategory) {
      return NextResponse.json(
        { message: "Kategorie ist erforderlich." },
        { status: 400 },
      );
    }

    const row = await queryOne<NewsRow>(
      `
        UPDATE news_posts
        SET
          title = $1,
          description = $2,
          content = $3,
          category = $4,
          author = $5,
          pinned = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING
          id,
          title,
          description,
          content,
          category,
          author,
          pinned,
          created_at,
          updated_at
      `,
      [
        nextTitle,
        body.description !== undefined
          ? normalizeText(body.description)
          : current.description || "",
        body.content !== undefined
          ? String(body.content || "")
          : current.content || "",
        nextCategory,
        body.author !== undefined
          ? normalizeText(body.author) || "System"
          : current.author || "System",
        typeof body.pinned === "boolean"
          ? body.pinned
          : current.pinned,
        decodedId,
      ],
    );

    if (!row) {
      return NextResponse.json(
        { message: "News konnte nicht aktualisiert werden." },
        { status: 500 },
      );
    }

    return NextResponse.json(mapNewsRow(row));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "News konnte nicht aktualisiert werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    await queryOne(
      `
        DELETE FROM news_posts
        WHERE id = $1
        RETURNING id
      `,
      [decodeURIComponent(id)],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "News konnte nicht gelöscht werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      { status: 500 },
    );
  }
}