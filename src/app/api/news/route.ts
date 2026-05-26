import {
  NextResponse,
} from "next/server";

import {
  query,
  queryOne,
} from "../../../lib/database/db";

import {
  getCurrentServerUser,
  isPermissionError,
  requireAnyServerPermission,
} from "../../../lib/serverPermissions";

type NewsRow = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type CreateNewsBody = {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  author?: string;
  pinned?: boolean;
};

function mapNewsRow(
  row: NewsRow
) {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description,

    content:
      row.content,

    category:
      row.category,

    author:
      row.author,

    pinned:
      row.pinned,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function createNewsId() {
  return `news-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getErrorStatus(
  error: unknown
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return 403;
  }

  return 500;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    isPermissionError(
      error
    )
  ) {
    return "Keine Berechtigung.";
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

export async function GET() {
  try {
    await requireAnyServerPermission([
      "news.view",
      "news.manage",
      "news.create",
      "news.edit",
      "news.delete",
    ]);

    const rows =
      await query<NewsRow>(
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
        ORDER BY pinned DESC, created_at DESC
        `
      );

    return NextResponse.json(
      rows.map(
        mapNewsRow
      )
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "News konnten nicht geladen werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    await requireAnyServerPermission([
      "news.create",
      "news.manage",
    ]);

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

    const body =
      await request.json() as CreateNewsBody;

    const title =
      body.title?.trim();

    if (!title) {
      return NextResponse.json(
        {
          message:
            "Titel ist erforderlich.",
        },
        {
          status:
            400,
        }
      );
    }

    const row =
      await queryOne<NewsRow>(
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
          createNewsId(),
          title,
          body.description?.trim() ||
            "",
          body.content?.trim() ||
            "",
          body.category?.trim() ||
            "Allgemein",
          body.author?.trim() ||
            currentUser.name ||
            "System",
          Boolean(
            body.pinned
          ),
        ]
      );

    if (!row) {
      return NextResponse.json(
        {
          message:
            "News konnte nicht erstellt werden.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      mapNewsRow(
        row
      ),
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      error
    );

    return NextResponse.json(
      {
        message:
          getErrorMessage(
            error,
            "News konnte nicht erstellt werden."
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler",
      },
      {
        status:
          getErrorStatus(
            error
          ),
      }
    );
  }
}