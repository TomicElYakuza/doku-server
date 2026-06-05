import {
  NextResponse,
} from "next/server";
import {
  query,
  queryOne,
} from "../../../lib/database/db";
import {
  mapNewsRow,
} from "../../../lib/database/mappers/newsMapper";
import type {
  NewsRow,
} from "../../../lib/database/mappers/newsMapper";

type CreateNewsPostBody = {
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

function normalizeText(value?: string) {
  return String(value || "").trim();
}

function createNewsId(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "news"}-${Date.now()}`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const category = url.searchParams.get("category");
    const pinned = url.searchParams.get("pinned");

    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (category) {
      params.push(category);
      whereParts.push(`category = $${params.length}`);
    }

    if (pinned === "true" || pinned === "false") {
      params.push(pinned === "true");
      whereParts.push(`pinned = $${params.length}`);
    }

    const whereSql = whereParts.length > 0
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const rows = await query<NewsRow>(
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
        ${whereSql}
        ORDER BY pinned DESC, created_at DESC
      `,
      params,
    );

    return NextResponse.json(
      rows.map(mapNewsRow),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "News konnten nicht geladen werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateNewsPostBody;

    const title = normalizeText(body.title);
    const category = normalizeText(body.category);
    const description = normalizeText(body.description);
    const content = String(body.content || "");
    const author = normalizeText(body.author) || "System";
    const pinned = Boolean(body.pinned);

    if (!title) {
      return NextResponse.json(
        {
          message: "Titel ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          message: "Kategorie ist erforderlich.",
        },
        {
          status: 400,
        },
      );
    }

    const id = body.id?.trim() || createNewsId(title);

    const row = await queryOne<NewsRow>(
      `
        INSERT INTO news_posts (
          id,
          title,
          description,
          content,
          category,
          author,
          pinned
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
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
        id,
        title,
        description,
        content,
        category,
        author,
        pinned,
      ],
    );

    if (!row) {
      return NextResponse.json(
        {
          message: "News konnte nicht erstellt werden.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      mapNewsRow(row),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "News konnte nicht erstellt werden.",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      {
        status: 500,
      },
    );
  }
}